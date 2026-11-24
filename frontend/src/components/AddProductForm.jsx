import React, { useState } from "react";
import { formatINR } from "../utils/format.js";
import { addProduct } from "../api.js";
export default function AddProductForm({ pushToast, reloadProducts }) {
  const [form, setForm] = useState({ name: "", sku: "", price: "", stock: "", emoji: "📦", description: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setSaving(true);
    try {
      const d = await addProduct(form);
      setOk(d.product);
      pushToast(`Product ${d.product.sku} added`);
      if (reloadProducts) reloadProducts();
      setForm({ name: "", sku: "", price: "", stock: "", emoji: "📦", description: "" });
    } catch (e) {
      if (e.code === 401) { setErr("admin password rejected — re-enter it on the Products tab"); }
      else { setErr(e.message); pushToast(e.message, "danger"); }
    } finally { setSaving(false); }
  };
  if (ok) return (
    <div className="admin-add">
      <div className="aa-card hud cart-success">
        <div className="ok-mark">✓</div>
        <div className="ref">{ok.sku}</div>
        <div className="amt">{formatINR(ok.price)} · stock {ok.stock}</div>
        <button className="btn-cyber" onClick={() => setOk(null)}>add another</button>
      </div>
    </div>
  );
  return (
    <div className="admin-add">
      <div className="aa-card hud">
        <h3>Add Product</h3>
        {err && <div className="cart-err" style={{ marginBottom: 16 }}>{err}</div>}
        <form onSubmit={submit}>
          <div className="modal-info" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label className="field-label">product name *</label>
              <input className="field" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div>
              <label className="field-label">sku *</label>
              <input className="field mono" value={form.sku} onChange={e => set("sku", e.target.value.toUpperCase())} required />
            </div>
            <div>
              <label className="field-label">price (₹) *</label>
              <input type="number" min="0" step="0.01" className="field mono" value={form.price} onChange={e => set("price", e.target.value)} required />
            </div>
            <div>
              <label className="field-label">stock *</label>
              <input type="number" min="0" className="field mono" value={form.stock} onChange={e => set("stock", e.target.value)} required />
            </div>
            <div>
              <label className="field-label">emoji</label>
              <input className="field" value={form.emoji} onChange={e => set("emoji", e.target.value)} maxLength={2} />
            </div>
            <div>
              <label className="field-label">description</label>
              <input className="field" value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit" className="btn-cyber magenta" disabled={saving}>{saving ? "saving..." : "add product"}</button>
            <button type="button" className="btn-cyber purple" onClick={() => setForm({ name: "", sku: "", price: "", stock: "", emoji: "📦", description: "" })}>clear</button>
          </div>
        </form>
      </div>
    </div>
  );
}