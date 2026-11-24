import React, { useState } from "react";
import { formatINR } from "../utils/format.js";
import { addProduct, setAdminPassword, clearAdminPassword } from "../api.js";
export default function AddProductPage({ pushToast, reloadProducts }){
  const [pw, setPw] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [form, setForm] = useState({ name:"", sku:"", price:"", stock:"", emoji:"📦", description:"" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(null);
  const set = (k,v) => setForm(f => ({...f, [k]: v}));
  const login = () => {
    if (!pw.trim()) { setErr("Admin password required"); return; }
    setAdminPassword(pw.trim());
    setAuthenticated(true);
    setErr("");
  };
  const logout = () => { clearAdminPassword(); setAuthenticated(false); setPw(""); };
  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setSaving(true);
    try {
      const d = await addProduct(form);
      setOk(d.product);
      pushToast(`Product ${d.product.sku} added`);
      if (reloadProducts) reloadProducts();
      setForm({ name:"", sku:"", price:"", stock:"", emoji:"📦", description:"" });
    } catch(e){
      if (e.code === 401) { clearAdminPassword(); setAuthenticated(false); setPw(""); setErr("Admin password rejected — try again"); }
      else { setErr(e.message); pushToast(e.message, "danger"); }
    }
    finally { setSaving(false); }
  };
  if (!authenticated) return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <div className="card p-4">
          <h4 className="mb-2">Admin Access</h4>
          <p className="text-muted small mb-3">Adding products requires the admin password.</p>
          <div className="input-group">
            <input type="password" className="form-control" placeholder="Admin password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") login();}} />
            <button className="btn btn-yellow" onClick={login}>Unlock</button>
          </div>
          {err && <div className="alert alert-danger mt-2 py-1">{err}</div>}
        </div>
      </div>
    </div>
  );
  if (ok) return (
    <div className="card p-3">
      <div className="alert alert-success">Product "{ok.name}" ({ok.sku}) added — stock {ok.stock}, {formatINR(ok.price)}</div>
      <button className="btn btn-primary me-2" onClick={()=>setOk(null)}>Add Another</button>
      <button className="btn btn-outline-secondary" onClick={logout}>Logout</button>
    </div>
  );
  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <div className="card p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Add Product</h4>
            <button className="btn btn-sm btn-outline-secondary" onClick={logout}>Logout</button>
          </div>
          {err && <div className="alert alert-danger">{err}</div>}
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Product name *</label>
                <input className="form-control" value={form.name} onChange={e=>set("name",e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">SKU *</label>
                <input className="form-control" value={form.sku} onChange={e=>set("sku",e.target.value.toUpperCase())} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Price (₹) *</label>
                <input type="number" min="0" step="0.01" className="form-control" value={form.price} onChange={e=>set("price",e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Stock *</label>
                <input type="number" min="0" className="form-control" value={form.stock} onChange={e=>set("stock",e.target.value)} required />
              </div>
              <div className="col-md-2">
                <label className="form-label">Emoji</label>
                <input className="form-control" value={form.emoji} onChange={e=>set("emoji",e.target.value)} maxLength={2} />
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={2} value={form.description} onChange={e=>set("description",e.target.value)} />
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button type="submit" className="btn btn-yellow" disabled={saving}>{saving?"Saving...":"Add Product"}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={()=>setForm({name:"",sku:"",price:"",stock:"",emoji:"📦",description:""})}>Clear</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}