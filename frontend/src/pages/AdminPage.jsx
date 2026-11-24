import React, { useState, useEffect } from "react";
import { formatINR } from "../utils/format.js";
import { getProducts, deleteProduct, getOrders, setAdminPassword, clearAdminPassword, adminOrderAction } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import AddProductForm from "../components/AddProductForm.jsx";

export default function AdminPage({ pushToast, reloadProducts }) {
  const [sub, setSub] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pw, setPw] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [err, setErr] = useState("");
  const loadP = async () => { try { const d = await getProducts(); setProducts(d.products); } catch (e) { pushToast(e.message, "danger"); } };
  const loadO = async () => { try { const d = await getOrders(); setOrders(d.orders); } catch (e) { pushToast(e.message, "danger"); } };
  useEffect(() => { if (authenticated) { loadP(); loadO(); } }, [authenticated]);
  const login = () => {
    if (!pw.trim()) { setErr("admin password required"); return; }
    setAdminPassword(pw.trim());
    setAuthenticated(true);
    setErr("");
  };
  const logout = () => { clearAdminPassword(); setAuthenticated(false); setPw(""); setProducts([]); setOrders([]); };
  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    try { await deleteProduct(id); pushToast("Product deleted"); loadP(); if (reloadProducts) reloadProducts(); }
    catch (e) { if (e.code === 401) { clearAdminPassword(); setAuthenticated(false); setPw(""); setErr("admin password rejected — try again"); } else { pushToast(e.message, "danger"); } }
  };
  const act = async (ref, action) => {
    const labels = { approve: "Approve", delay: "Delay", reject: "Reject" };
    if (!confirm(`${labels[action]} order ${ref}?`)) return;
    try {
      const d = await adminOrderAction(ref, action);
      pushToast(`Order ${ref} → ${d.order.status}`);
      loadO();
    } catch (e) {
      if (e.code === 401) { clearAdminPassword(); setAuthenticated(false); setPw(""); setErr("admin password rejected — try again"); }
      else { pushToast(e.message, "danger"); }
    }
  };
  if (!authenticated) return (
    <div className="admin-login">
      <div className="al-card hud">
        <div className="hero-kicker">secure channel · locked</div>
        <h2>Admin Access</h2>
        <p className="al-sub">Neural link restricted. Enter the admin password to unlock the operations console.</p>
        <div>
          <label className="field-label">admin passphrase</label>
          <input type="password" className="field mono" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => { if (e.key === "Enter") login(); }} />
        </div>
        {err && <div className="cart-err" style={{ marginTop: 14 }}>{err}</div>}
        <div style={{ marginTop: 16 }}>
          <button className="btn-cyber magenta lg w-100" onClick={login}>unlock console</button>
        </div>
      </div>
    </div>
  );
  return (
    <>
      <div className="seg-title" style={{ marginTop: 0 }}>
        <h2>Admin Console</h2>
        <span className="seg-line" />
      </div>
      <div className="admin-tabs">
        <button className={`admin-tab ${sub === "products" ? "active" : ""}`} onClick={() => setSub("products")}>products</button>
        <button className={`admin-tab ${sub === "add" ? "active" : ""}`} onClick={() => setSub("add")}>add product</button>
        <button className={`admin-tab ${sub === "orders" ? "active" : ""}`} onClick={() => { setSub("orders"); loadO(); }}>orders</button>
        <div style={{ flex: 1 }} />
        <button className="btn-cyber sm" onClick={logout}>logout</button>
      </div>
      {sub === "products" && (
        <div className="hud" style={{ padding: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
            <div className="mono" style={{ fontSize: ".7rem", letterSpacing: ".2em", color: "var(--cyan)" }}>CATALOGUE · {products.length.toString().padStart(2, "0")} MODULES</div>
            <button className="btn-cyber sm" onClick={loadP}>refresh</button>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead><tr><th></th><th>name</th><th>sku</th><th>price</th><th>stock</th><th></th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="td-emoji">{p.emoji}</td>
                    <td>{p.name}{p.description && <span className="td-desc">{p.description}</span>}</td>
                    <td className="td-sku">{p.sku}</td>
                    <td className="td-price">{formatINR(p.price)}</td>
                    <td className={`td-stock ${p.stock === 0 ? "zero" : ""}`}>{p.stock}</td>
                    <td><button className="btn-cyber magenta sm" onClick={() => remove(p.id)}>delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {sub === "add" && <AddProductForm pushToast={pushToast} reloadProducts={reloadProducts} />}
      {sub === "orders" && (
        <div className="hud" style={{ padding: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
            <div className="mono" style={{ fontSize: ".7rem", letterSpacing: ".2em", color: "var(--cyan)" }}>ORDER QUEUE · {orders.length.toString().padStart(2, "0")} RECORDS</div>
            <button className="btn-cyber sm" onClick={loadO}>refresh</button>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead><tr><th>ref</th><th>customer</th><th>items</th><th>total</th><th>status</th><th>placed</th><th></th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.ref}>
                    <td className="mono" style={{ color: "var(--cyan)" }}>{o.ref}</td>
                    <td>{o.customer_name}</td>
                    <td className="td-sku">{o.item_count}</td>
                    <td className="td-price">{formatINR(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="td-sku">{new Date(o.placed_at).toLocaleString()}</td>
                    <td>
                      {(o.status === "Placed" || o.status === "Packed") ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          {o.status === "Placed" && <button className="btn-cyber yellow sm" onClick={() => act(o.ref, "pack")}>pack</button>}
                          {o.status === "Packed" && <button className="btn-cyber green sm" onClick={() => act(o.ref, "ship")}>ship</button>}
                          <button className="btn-cyber cyan sm" onClick={() => act(o.ref, "approve")}>approve</button>
                          <button className="btn-cyber magenta sm" onClick={() => act(o.ref, "reject")}>reject</button>
                        </div>
                      ) : <span className="mono" style={{ color: "var(--text-dim)", fontSize: ".7rem" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
