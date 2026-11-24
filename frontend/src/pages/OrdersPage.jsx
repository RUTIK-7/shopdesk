import React, { useState, useEffect } from "react";
import { getOrders, getOrder, updateStatus } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatINR, formatDate } from "../utils/format.js";

export default function OrdersPage({ pushToast }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const d = await getOrders({ search, status }); setOrders(d.orders); }
    catch (e) { pushToast(e.message, "danger"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, status]);
  const open = async (ref) => { const d = await getOrder(ref); setSelected(d.order); };
  const act = async (action) => { if (!selected) return; try { const d = await updateStatus(selected.ref, action); setSelected(d.order); pushToast("Updated"); load(); } catch (e) { pushToast(e.message, "danger"); } };

  const counts = { Placed: 0, Packed: 0, Shipped: 0, Cancelled: 0 };
  orders.forEach(o => { if (counts[o.status] != null) counts[o.status]++; });

  return (
    <>
      <div className="seg-title" style={{ marginTop: 0 }}>
        <h2>Order Pipeline</h2>
        <span className="seg-line" />
        <div className="mono hide-sm" style={{ fontSize: ".66rem", letterSpacing: ".16em", display: "flex", gap: 14 }}>
          <span style={{ color: "var(--cyan)" }}>{counts.Placed} placed</span>
          <span style={{ color: "var(--yellow)" }}>{counts.Packed} packed</span>
          <span style={{ color: "var(--green)" }}>{counts.Shipped} shipped</span>
        </div>
      </div>

      <div className="orders-toolbar">
        <div>
          <label className="field-label">query</label>
          <input className="field mono" placeholder="SEARCH REF / CUSTOMER…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="field-label">filter</label>
          <select className="field" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">ALL STATES</option><option>Placed</option><option>Packed</option><option>Shipped</option><option>Cancelled</option>
          </select>
        </div>
        <div>
          <button className="btn-cyber" onClick={load}>scan</button>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="orders-list">
          {[1, 2, 3].map(i => <div key={i} className="sk-cyber" style={{ height: 72 }} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">// no signals detected_</div>
      ) : (
        <div className="orders-list">
          {orders.map(o => (
            <div key={o.ref} className="order-row" onClick={() => open(o.ref)}>
              <span className="or-ref">{o.ref}</span>
              <span className="or-cust">{o.customer_name}</span>
              <span className="or-meta">{o.item_count} items</span>
              <span className="or-total">{formatINR(o.total)}</span>
              <span><StatusBadge status={o.status} /></span>
              <span className="or-act">
                <button className="btn-cyber sm" onClick={(e) => { e.stopPropagation(); open(o.ref); }}>open</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-cyber" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="mt">{selected.ref}<small>order manifest</small></div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <div className="mi"><div className="l">status</div><div className="v"><StatusBadge status={selected.status} /></div></div>
                <div className="mi"><div className="l">customer</div><div className="v">{selected.customer_name}</div></div>
                <div className="mi"><div className="l">phone</div><div className="v mono" style={{ fontSize: ".8rem" }}>{selected.customer_phone || "—"}</div></div>
                <div className="mi"><div className="l">placed</div><div className="v mono" style={{ fontSize: ".75rem" }}>{formatDate(selected.placed_at)}</div></div>
                <div className="mi"><div className="l">items</div><div className="v">{selected.items.length}</div></div>
                <div className="mi"><div className="l">total</div><div className="v" style={{ color: "var(--cyan)" }}>{formatINR(selected.total)}</div></div>
              </div>
              <div className="modal-items">
                <div className="mi-row hdr"><span>item</span><span>qty</span><span>unit</span><span>line</span></div>
                {selected.items.map(it => (
                  <div key={it.id} className="mi-row">
                    <span className="name">{it.emoji} {it.product_name}</span>
                    <span className="num">{it.quantity}</span>
                    <span className="num">{formatINR(it.unit_price)}</span>
                    <span className="num">{formatINR(it.line_total)}</span>
                  </div>
                ))}
              </div>
              <div className="modal-actions">
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
