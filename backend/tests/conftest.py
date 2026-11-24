import os, sys, tempfile, pytest
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import db, seed

@pytest.fixture
def client():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.remove(path)
    db.DB_PATH = path
    # reinit schema
    db.init_db = lambda: None
    conn = db.get_conn()
    # ensure tables exist by running init via original? Just call create
    os.environ["DB_PATH"] = path
    # manually init
    import sqlite3
    # use db.get_conn already connects to path; schema not created yet -> create
    c = db.get_conn()
    c.executescript(open(os.path.join(os.path.dirname(os.path.dirname(__file__)), "db.py")).read().split("def init_db")[1] if False else "")
    c.close()
    # easier: import app after setting DB_PATH? app imports db already. Call init_db from db module but it uses DB_PATH global (already set). But init_db defined earlier; rebind.
    # Re-run DDL by invoking original init_db saved? We overwrote. Let's just call seed which needs tables. Instead create tables here.
    conn = db.get_conn()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sku TEXT NOT NULL UNIQUE, price REAL NOT NULL CHECK (price >= 0), stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0), emoji TEXT DEFAULT '📦', description TEXT DEFAULT '');
    CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT NOT NULL UNIQUE, customer_name TEXT NOT NULL, customer_phone TEXT, customer_address TEXT, status TEXT NOT NULL CHECK (status IN ('Placed','Packed','Shipped','Cancelled','Approved','Delayed')), total REAL NOT NULL CHECK (total >= 0), placed_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER NOT NULL REFERENCES products(id), product_name TEXT NOT NULL, sku TEXT NOT NULL, emoji TEXT, quantity INTEGER NOT NULL CHECK (quantity > 0), unit_price REAL NOT NULL, line_total REAL NOT NULL);
    """)
    conn.commit()
    conn.close()
    seed.seed(reset=True)
    # import app
    import importlib
    import app as appmod
    importlib.reload(appmod)
    appmod.app.config["TESTING"] = True
    with appmod.app.test_client() as tc:
        yield tc
    try:
        os.remove(path)
    except Exception:
        pass
