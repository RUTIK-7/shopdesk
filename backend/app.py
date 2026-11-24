import os, sys, json, datetime, sqlite3
sys.path.insert(0, os.path.dirname(__file__))
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_conn, init_db
import seed

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

def check_admin():
    got = request.headers.get("X-Admin-Password", "")
    return got == ADMIN_PASSWORD

def admin():
    if not check_admin():
        return err("Admin password required", 401)
    return None

def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def next_ref(conn):
    cur = conn.execute("SELECT ref FROM orders ORDER BY id DESC LIMIT 1").fetchone()
    if cur:
        try:
            n = int(cur["ref"].split("-")[1])
        except Exception:
            n = 1000
    else:
        n = 1000
    return f"ORD-{n+1}"

def row_to_product(r):
    return {"id": r["id"], "name": r["name"], "sku": r["sku"], "price": r["price"],
            "stock": r["stock"], "emoji": r["emoji"], "description": r["description"]}

def err(msg, code):
    return jsonify({"message": msg}), code

@app.route("/")
def index():
    return jsonify({"service": "ShopDesk API", "health": "/api/health", "products": "/api/products", "orders": "/api/orders"})

@app.route("/api/health")
def health():
    conn = get_conn()
    p = conn.execute("SELECT COUNT(*) c FROM products").fetchone()["c"]
    o = conn.execute("SELECT COUNT(*) c FROM orders").fetchone()["c"]
    conn.close()
    return jsonify({"status": "ok", "products": p, "orders": o})

@app.route("/api/products")
def products():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM products ORDER BY id").fetchall()
    conn.close()
    return jsonify({"products": [row_to_product(r) for r in rows]})

@app.route("/api/orders", methods=["POST"])
def create_order():
    data = request.get_json(silent=True) or {}
    name = (data.get("customer_name") or "").strip()
    if not name:
        return err("customer_name is required", 400)
    items = data.get("items")
    if not items or not isinstance(items, list) or len(items) == 0:
        return err("items must contain at least one product", 400)
    phone = data.get("customer_phone")
    address = (data.get("customer_address") or "").strip()
    conn = get_conn()
    try:
        conn.execute("BEGIN IMMEDIATE")
        # validate items & check stock
        resolved = []
        for it in items:
            pid = it.get("product_id")
            qty = it.get("quantity")
            if not isinstance(qty, int) or qty <= 0:
                conn.rollback(); conn.close()
                return err("Invalid quantity", 400)
            p = conn.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
            if p is None:
                conn.rollback(); conn.close()
                return err(f"Product {pid} not found", 404)
            if p["stock"] < qty:
                conn.rollback(); conn.close()
                return err(f"Insufficient stock for '{p['name']}': requested {qty}, available {p['stock']}. Order rejected — no stock changed.", 409)
            resolved.append((p, qty))
        # deduct stock
        for p, qty in resolved:
            conn.execute("UPDATE products SET stock = stock - ? WHERE id=?", (qty, p["id"]))
        ref = next_ref(conn)
        total = sum(p["price"] * qty for p, qty in resolved)
        ts = now()
        cur = conn.execute("INSERT INTO orders (ref,customer_name,customer_phone,customer_address,status,total,placed_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
                           (ref, name, phone, address, "Placed", total, ts, ts))
        oid = cur.lastrowid
        out_items = []
        for p, qty in resolved:
            lt = p["price"] * qty
            conn.execute("""INSERT INTO order_items (order_id,product_id,product_name,sku,emoji,quantity,unit_price,line_total)
                            VALUES (?,?,?,?,?,?,?,?)""",
                         (oid, p["id"], p["name"], p["sku"], p["emoji"], qty, p["price"], lt))
            out_items.append({"product_id": p["id"], "product_name": p["name"], "sku": p["sku"],
                            "emoji": p["emoji"], "quantity": qty, "unit_price": p["price"], "line_total": lt})
        conn.commit()
    except Exception as e:
        conn.rollback(); conn.close()
        return err(str(e), 500)
    conn.close()
    order = {"ref": ref, "customer_name": name, "customer_phone": phone, "customer_address": address, "status": "Placed",
             "total": total, "placed_at": ts, "updated_at": ts, "item_count": len(resolved), "items": out_items}
    return jsonify({"order": order}), 201

@app.route("/api/orders")
def list_orders():
    search = (request.args.get("search") or "").strip()
    status = (request.args.get("status") or "").strip()
    conn = get_conn()
    q = "SELECT o.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id=o.id) AS item_count FROM orders o WHERE 1=1"
    params = []
    if search:
        q += " AND (o.ref LIKE ? OR o.customer_name LIKE ?)"
        params += [f"%{search}%", f"%{search}%"]
    if status:
        q += " AND o.status = ?"
        params.append(status)
    q += " ORDER BY o.id DESC"
    rows = conn.execute(q, params).fetchall()
    conn.close()
    orders = []
    for r in rows:
        orders.append({"ref": r["ref"], "customer_name": r["customer_name"], "customer_phone": r["customer_phone"],
                       "customer_address": r["customer_address"] if "customer_address" in r.keys() else "",
                       "item_count": r["item_count"], "total": r["total"], "status": r["status"], "placed_at": r["placed_at"]})
    return jsonify({"orders": orders})

@app.route("/api/orders/<ref>")
def get_order(ref):
    conn = get_conn()
    o = conn.execute("SELECT * FROM orders WHERE ref=?", (ref,)).fetchone()
    if o is None:
        conn.close()
        return err(f"Order {ref} not found", 404)
    items = conn.execute("SELECT * FROM order_items WHERE order_id=?", (o["id"],)).fetchall()
    ic = len(items)
    conn.close()
    return jsonify({"order": {
        "ref": o["ref"], "customer_name": o["customer_name"], "customer_phone": o["customer_phone"],
        "customer_address": o["customer_address"] if "customer_address" in o.keys() else "",
        "status": o["status"], "total": o["total"], "placed_at": o["placed_at"], "updated_at": o["updated_at"],
        "item_count": ic,
        "items": [{"id": it["id"], "product_id": it["product_id"], "product_name": it["product_name"],
                   "sku": it["sku"], "emoji": it["emoji"], "quantity": it["quantity"],
                   "unit_price": it["unit_price"], "line_total": it["line_total"]} for it in items]
    }})

@app.route("/api/orders/<ref>/status", methods=["POST"])
def update_status(ref):
    a = admin()
    if a:
        return a
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    if action not in ("pack", "ship", "cancel"):
        return err("Invalid action. Use pack, ship or cancel.", 400)
    conn = get_conn()
    try:
        conn.execute("BEGIN IMMEDIATE")
        o = conn.execute("SELECT * FROM orders WHERE ref=?", (ref,)).fetchone()
        if o is None:
            conn.rollback(); conn.close()
            return err(f"Order {ref} not found", 404)
        status = o["status"]
        # determine transition
        new_status = None
        if action == "pack":
            if status != "Placed":
                raise ValueError(f"Cannot pack order in status '{status}'...")
            new_status = "Packed"
        elif action == "ship":
            if status != "Packed":
                raise ValueError(f"Cannot ship order in status '{status}'...")
            new_status = "Shipped"
        elif action == "cancel":
            if status not in ("Placed", "Packed"):
                raise ValueError(f"Cannot cancel order in status '{status}'...")
            new_status = "Cancelled"
        ts = now()
        conn.execute("UPDATE orders SET status=?, updated_at=? WHERE id=?", (new_status, ts, o["id"]))
        if new_status == "Cancelled":
            items = conn.execute("SELECT * FROM order_items WHERE order_id=?", (o["id"],)).fetchall()
            for it in items:
                conn.execute("UPDATE products SET stock = stock + ? WHERE id=?", (it["quantity"], it["product_id"]))
        conn.commit()
    except ValueError as e:
        conn.rollback(); conn.close()
        return err(str(e), 409)
    except Exception as e:
        conn.rollback(); conn.close()
        return err(str(e), 500)
    conn.close()
    # return updated
    return get_order(ref)

@app.route("/api/admin/products", methods=["POST"])
def add_product():
    a = admin()
    if a:
        return a
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    sku = (data.get("sku") or "").strip()
    price = data.get("price")
    stock = data.get("stock")
    emoji = (data.get("emoji") or "📦").strip()
    description = (data.get("description") or "").strip()
    if not name:
        return err("name is required", 400)
    if not sku:
        return err("sku is required", 400)
    try:
        price = float(price)
        stock = int(stock)
    except (TypeError, ValueError):
        return err("price and stock must be numbers", 400)
    if price < 0:
        return err("price must be >= 0", 400)
    if stock < 0:
        return err("stock must be >= 0", 400)
    conn = get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO products (name, sku, price, stock, emoji, description) VALUES (?,?,?,?,?,?)",
            (name, sku, price, stock, emoji, description),
        )
        conn.commit()
        pid = cur.lastrowid
    except sqlite3.IntegrityError:
        conn.rollback(); conn.close()
        return err(f"SKU '{sku}' already exists", 409)
    conn.close()
    return jsonify({"product": {"id": pid, "name": name, "sku": sku, "price": price,
                                "stock": stock, "emoji": emoji, "description": description}}), 201

@app.route("/api/admin/products/<int:pid>", methods=["DELETE"])
def delete_product(pid):
    a = admin()
    if a:
        return a
    conn = get_conn()
    p = conn.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
    if p is None:
        conn.close()
        return err(f"Product {pid} not found", 404)
    conn.execute("DELETE FROM products WHERE id=?", (pid,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Product deleted"})

@app.route("/api/admin/orders/<ref>/action", methods=["POST"])
def admin_order_action(ref):
    a = admin()
    if a:
        return a
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    if action not in ("approve", "delay", "reject", "pack", "ship", "cancel"):
        return err("Invalid action.", 400)
    conn = get_conn()
    try:
        conn.execute("BEGIN IMMEDIATE")
        o = conn.execute("SELECT * FROM orders WHERE ref=?", (ref,)).fetchone()
        if o is None:
            conn.rollback(); conn.close()
            return err(f"Order {ref} not found", 404)
        status = o["status"]
        if status not in ("Placed", "Packed"):
            conn.rollback(); conn.close()
            return err(f"Cannot {action} order in status '{status}'.", 409)
        if action == "reject" or action == "cancel":
            new_status = "Cancelled"
            items = conn.execute("SELECT * FROM order_items WHERE order_id=?", (o["id"],)).fetchall()
            for it in items:
                conn.execute("UPDATE products SET stock = stock + ? WHERE id=?", (it["quantity"], it["product_id"]))
        elif action == "pack":
            if status != "Placed":
                conn.rollback(); conn.close()
                return err(f"Cannot pack order in status '{status}'.", 409)
            new_status = "Packed"
        elif action == "ship":
            if status != "Packed":
                conn.rollback(); conn.close()
                return err(f"Cannot ship order in status '{status}'.", 409)
            new_status = "Shipped"
        elif action == "approve":
            new_status = "Approved"
        else:
            new_status = "Delayed"
        ts = now()
        conn.execute("UPDATE orders SET status=?, updated_at=? WHERE id=?", (new_status, ts, o["id"]))
        conn.commit()
    except Exception as e:
        conn.rollback(); conn.close()
        return err(str(e), 500)
    conn.close()
    return get_order(ref)

init_db()
seed.seed()
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
