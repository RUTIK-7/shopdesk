# ShopDesk

## Run
Backend: `cd order-console/backend && pip install -r requirements.txt && python app.py` (port 5001)
Frontend: `cd order-console/frontend && npm install && npm run dev` (port 3000) -> http://localhost:3000

## Connection
- `frontend/vite.config.js` proxies `/api` -> `http://127.0.0.1:5001`
- `frontend/src/api.js` base = `/api`; calls backend routes
- `backend/app.py` uses `backend/db.py` (SQLite) and seeds via `backend/seed.py`

## Links
| What | Where | Method | Example |
|------|-------|--------|---------|
| Service info | `/` | GET | `GET http://127.0.0.1:5001/` |
| Health check | `/api/health` | GET | `GET http://127.0.0.1:5001/api/health` |
| List products | `/api/products` | GET | `GET http://127.0.0.1:5001/api/products` |
| Add product (admin) | `/api/admin/products` | POST | `POST http://127.0.0.1:5001/api/admin/products` with `{"name","sku","price","stock","emoji","description"}` |
| Delete product (admin) | `/api/admin/products/<id>` | DELETE | `DELETE http://127.0.0.1:5001/api/admin/products/7` |
| Create order | `/api/orders` | POST | `POST http://127.0.0.1:5001/api/orders` with `{"customer_name","customer_phone","items":[{"product_id","quantity"}]}` |
| List orders | `/api/orders` | GET | `GET http://127.0.0.1:5001/api/orders?search=&status=` |
| Get one order | `/api/orders/<ref>` | GET | `GET http://127.0.0.1:5001/api/orders/ORD-1001` |
| Update order status | `/api/orders/<ref>/status` | POST | `POST http://127.0.0.1:5001/api/orders/ORD-1001/status` with `{"action":"pack"|"ship"|"cancel"}` |

Order status flow: `Placed` -> pack -> `Packed` -> ship -> `Shipped`. Cancel allowed from `Placed`/`Packed` (stock is returned).

## Frontend (http://localhost:3000)
| View | Link | What it does |
|------|------|--------------|
| Shop / Create Order | `http://localhost:3000/` (default) | Browse catalogue, add items to cart, place an order |
| Orders | `http://localhost:3000/#/orders` | Search, filter, and view all orders; pack/ship/cancel actions |
| Admin dashboard | `http://localhost:3000/#/admin` | **Link-only** — not in the navbar. Admin-only: view products, add products, approve/delay/reject orders (requires admin password) |

Navigation: the Navbar only shows **Create Order** and **Orders**. The admin dashboard is reachable only by opening `http://localhost:3000/#/admin` directly. Cart badge shows live item count.

## Tree
```
order-console/
├── README.md
├── .gitignore
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx          -> mounts App, imports bootstrap/styles
│       ├── App.jsx           -> global state (view, products, cart, toasts)
│       ├── api.js            -> fetch wrapper + endpoints
│       ├── styles.css        -> theme
│       ├── utils/format.js   -> ₹ + date formatters
│       ├── pages/ShopPage.jsx, OrdersPage.jsx, AdminPage.jsx
│       └── components/ (Navbar, Catalogue, ProductCard, Cart, AddProductForm, OrderDetailModal, StatusBadge, Toast)
├── backend/
│   ├── app.py               -> Flask routes + state machine
│   ├── db.py                -> connection + schema
│   ├── seed.py              -> catalogue seed (--reset)
│   ├── requirements.txt
│   ├── data/shopdesk.db     -> SQLite (auto-created)
│   └── tests/ (conftest.py, test_orders.py)
└── guide/ (docs + screenshots)
```
## Tests
`cd order-console/backend && pytest tests`