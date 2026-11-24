import React, { useState } from "react";
import { createOrder } from "../api.js";
import { formatINR } from "../utils/format.js";
export default function Cart({cart,setCart,products,reloadProducts,pushToast}){
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [address,setAddress]=useState("");
  const [placing,setPlacing]=useState(false);
  const [success,setSuccess]=useState(null);
  const [err,setErr]=useState("");
  const total = cart.reduce((a,c)=>a+c.price*c.quantity,0);
  const count = cart.reduce((a,c)=>a+c.quantity,0);
  const updateQty=(id,delta)=>{
    setCart(prev=>prev.map(c=>c.product_id===id?{...c,quantity:Math.max(1,Math.min(c.quantity+delta,c.stock))}:c));
  };
  const remove=(id)=>setCart(prev=>prev.filter(c=>c.product_id!==id));
  const place=async()=>{
    if(!name.trim()){setErr("customer name required");return;}
    setPlacing(true);setErr("");
    try{
      const d=await createOrder({customer_name:name,customer_phone:phone||null,customer_address:address||null,items:cart.map(c=>({product_id:c.product_id,quantity:c.quantity}))});
      setSuccess(d.order); setCart([]); pushToast(`Order ${d.order.ref} placed — stock deducted`); reloadProducts();
    }catch(e){ setErr(e.message); pushToast(`Order rejected: ${e.message}`,"danger"); reloadProducts(); }
    finally{setPlacing(false);}
  };
  if(success) return (
    <div className="cart-panel">
      <div className="cart-success">
        <div className="ok-mark">✓</div>
        <div className="ph-tag mono" style={{color:"var(--green)"}}>order transmitted</div>
        <div className="ref">{success.ref}</div>
        <div className="amt">{formatINR(success.total)}</div>
        <div className="hero-actions" style={{justifyContent:"center"}}>
          <button className="btn-cyber" onClick={()=>{setSuccess(null);}}>new order</button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="cart-panel">
      <div className="cart-title">
        <span>Cart</span>
        <span className="cnt">{count.toString().padStart(2,"0")} items</span>
      </div>
      {cart.length===0 && <div className="cart-empty">// awaiting items_</div>}
      {cart.map(c=>(
        <div key={c.product_id} className="cart-item">
          <span className="ci-emoji">{c.emoji}</span>
          <div>
            <div className="ci-name">{c.name}</div>
            <div className="ci-price">{formatINR(c.price)} × {c.quantity}</div>
          </div>
          <div className="ci-ctrl">
            <div className="qty-ctrl">
              <button onClick={()=>updateQty(c.product_id,-1)}>−</button>
              <span>{c.quantity}</span>
              <button onClick={()=>updateQty(c.product_id,1)}>+</button>
            </div>
            <button className="cart-del" onClick={()=>remove(c.product_id)}>✕</button>
          </div>
        </div>
      ))}
      <div className="cart-total">
        <span className="l">total</span>
        <span className="v">{formatINR(total)}</span>
      </div>
      <div className="cart-fields">
        <div>
          <label className="field-label">customer name *</label>
          <input className="field" placeholder="ENTER IDENT" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="field-label">phone (optional)</label>
          <input className="field mono" placeholder="+91 …" value={phone} onChange={e=>setPhone(e.target.value)} />
        </div>
        <div>
          <label className="field-label">delivery address (optional)</label>
          <textarea className="field" rows={2} placeholder="STREET / CITY / PINCODE" value={address} onChange={e=>setAddress(e.target.value)} />
        </div>
      </div>
      {err && <div className="cart-err">{err}</div>}
      <div style={{marginTop:14}}>
        <button className="btn-cyber magenta lg w-100" disabled={placing||cart.length===0} onClick={place}>
          {placing?"transmitting...":"place order"}
        </button>
      </div>
    </div>
  );
}
