import argparse, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import get_conn

SEED = [
    ("Wireless Mouse", "ELEC-001", 799, 25, "🖱️", ""),
    ("Mechanical Keyboard", "ELEC-002", 2499, 12, "⌨️", ""),
    ("USB-C 65W Fast Charger", "ELEC-003", 1499, 0, "🔌", ""),
    ("Bluetooth Headphones", "ELEC-004", 3999, 18, "🎧", ""),
    ("Full HD Webcam", "ELEC-005", 2199, 9, "📷", ""),
    ("USB-C 4-Port Hub", "ELEC-006", 899, 5, "🧩", ""),
]

def seed(reset=False):
    conn = get_conn()
    if reset:
        conn.execute("DELETE FROM order_items")
        conn.execute("DELETE FROM orders")
        conn.execute("DELETE FROM products")
        conn.commit()
    cur = conn.execute("SELECT COUNT(*) c FROM products").fetchone()
    if cur["c"] == 0 or reset:
        for row in SEED:
            conn.execute("INSERT INTO products (name,sku,price,stock,emoji,description) VALUES (?,?,?,?,?,?)", row)
        conn.commit()
    conn.close()

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--reset", action="store_true")
    args = p.parse_args()
    seed(reset=args.reset)
    print("seeded" if not args.reset else "reset+seeded")
