import React from "react";
import Catalogue from "../components/Catalogue.jsx";
import Cart from "../components/Cart.jsx";

export default function ShopPage({ products, reloadProducts, cart, setCart, pushToast }) {
  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);
  return (
    <>
      {/* HERO */}
      <div className="hero">
        <div className="hero-card hud hud-hover">
          <div className="hero-kicker">neural commerce grid · online</div>
          <h1 className="hero-title">
            <span className="gradient-text glitch" data-text="ShopDesk">ShopDesk</span>
          </h1>
          <p className="hero-sub">
            Cybernetic storefront console. Browse the catalogue, assemble your order in real time, and dispatch straight into the fulfilment pipeline.
          </p>
          <div className="hero-actions">
            <button className="btn-cyber" onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}>browse catalogue</button>
            <button className="btn-cyber magenta" onClick={() => document.getElementById("cart-panel")?.scrollIntoView({ behavior: "smooth" })}>view cart</button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="n">{products.length}</div><div className="l">skus online</div></div>
            <div className="hero-stat"><div className="n">{products.reduce((a, p) => a + (p.stock || 0), 0)}</div><div className="l">units ready</div></div>
            <div className="hero-stat"><div className="n">{cartCount}</div><div className="l">in cart</div></div>
          </div>
        </div>
        <div className="hero-card hud hud-hover" id="cart-panel">
          <Cart cart={cart} setCart={setCart} products={products} reloadProducts={reloadProducts} pushToast={pushToast} />
        </div>
      </div>

      {/* CATALOGUE */}
      <div id="catalogue">
        <div className="seg-title">
          <h2>Catalogue</h2>
          <span className="seg-line" />
          <span className="mono" style={{ fontSize: ".66rem", letterSpacing: ".2em", color: "var(--cyan)" }}>
            {products.length.toString().padStart(2, "0")} modules
          </span>
        </div>
        <Catalogue products={products} cart={cart} setCart={setCart} />
      </div>
    </>
  );
}
