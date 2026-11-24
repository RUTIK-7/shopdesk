import React from "react";
import ProductCard from "./ProductCard.jsx";
export default function Catalogue({products,cart,setCart}){
  if (!products.length) return <div className="cat-grid">{[1,2,3,4,5,6].map(i=><div key={i} className="sk-cyber" style={{height:280,clipPath:"polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)"}}></div>)}</div>;
  return <div className="cat-grid">{products.map(p=><ProductCard key={p.id} p={p} cart={cart} setCart={setCart} />)}</div>;
}
