import React from "react";

export default function Navbar({ view, setView, cartCount }) {
  return (
    <nav className="cyber-nav">
      <div className="nav-brand" onClick={() => setView("shop")}>
        <span className="logo-mark">SD</span>
        <div>
          ShopDesk
          <small>Store Ops Console</small>
        </div>
      </div>
      <div className="nav-links">
        <button className={`nav-link ${view === "shop" ? "active" : ""}`} onClick={() => setView("shop")}>Create Order</button>
        <button className={`nav-link ${view === "orders" ? "active" : ""}`} onClick={() => setView("orders")}>Orders</button>
      </div>
      <div className="nav-spacer" />
      <div className="nav-status hide-sm">
        <span className="dot" />
        online
      </div>
      <button className="nav-cart" onClick={() => setView("shop")} title="Cart">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6"/>
        </svg>
        {cartCount > 0 && <span className="badge">{cartCount}</span>}
      </button>
    </nav>
  );
}
