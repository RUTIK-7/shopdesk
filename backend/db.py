import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "shopdesk.db")

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_conn()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      price REAL NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      emoji TEXT DEFAULT '📦',
      description TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      customer_address TEXT DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('Placed','Packed','Shipped','Cancelled','Approved','Delayed')),
      total REAL NOT NULL CHECK (total >= 0),
      placed_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      emoji TEXT,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price REAL NOT NULL,
      line_total REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders(ref);
    """)
    # migrate: add customer_address column to pre-existing orders tables
    cols = [r["name"] for r in conn.execute("PRAGMA table_info(orders)").fetchall()]
    if "customer_address" not in cols:
        conn.execute("ALTER TABLE orders ADD COLUMN customer_address TEXT DEFAULT ''")
    conn.commit()
    conn.close()
