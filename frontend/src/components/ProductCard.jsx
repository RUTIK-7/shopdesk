import React, { useState } from "react";
import { formatINR } from "../utils/format.js";
export default function ProductCard({p, cart, setCart}){
  const inCart = cart.find(c=>c.product_id===p.id);
  const qtyInCart = inCart ? inCart.quantity : 0;
  const maxAdded = qtyInCart >= p.stock && p.stock>0;
  const [qty, setQty] = useState(1);
  const out = p.stock === 0;
  const add = () => {
    if (maxAdded) return;
    setCart(prev => {
      const ex = prev.find(c=>c.product_id===p.id);
      if (ex) return prev.map(c=>c.product_id===p.id?{...c,quantity:Math.min(c.quantity+qty,p.stock)}:c);
      return [...prev,{product_id:p.id,name:p.name,sku:p.sku,emoji:p.emoji,price:p.price,quantity:qty,stock:p.stock}];
    });
  };
  const stockLabel = out ? "out of stock" : (p.stock<=5 ? `only ${p.stock} left` : `in stock: ${p.stock}`);
  const stockCls = out ? "zero" : (p.stock<=5 ? "low" : "ok");
  return (
    <div className={`product-card ${out?"out":""}`}>
      <div className="product-media">
        <span className="emoji">{p.emoji}</span>
        {out && <span className="tag-out">offline</span>}
      </div>
      <div className="product-body">
        <h3 className="product-name">{p.name}</h3>
        <div className="product-sku">SKU / {p.sku}</div>
        <div className="product-price">{formatINR(p.price)}</div>
        <div className={`product-stock ${stockCls}`}>{stockLabel}</div>
        {inCart && <span className="cart-qty-badge">in cart · {qtyInCart}</span>}
        <div className="product-foot">
          <select className="field" disabled={out||maxAdded} value={qty} onChange={e=>setQty(+e.target.value)}>
            {Array.from({length:Math.max(1,p.stock)},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}
          </select>
          <button className="btn-cyber sm" disabled={out||maxAdded} onClick={add}>{maxAdded?"max":"add"}</button>
        </div>
      </div>
    </div>
  );
}
