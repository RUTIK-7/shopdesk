import React, { useState, useEffect } from "react";
import { getProducts } from "./api.js";
import Navbar from "./components/Navbar.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import Toast from "./components/Toast.jsx";
import { Background, BootScreen, PageHeader, SideRail } from "./components/Layout.jsx";

const HEADERS = {
  shop: { tag: "01 / storefront", title: "Create Order", accent: "terminal", desc: "Assemble an order from the live catalogue. Items sync instantly into the cart buffer." },
  orders: { tag: "02 / pipeline", title: "Orders", accent: "control", desc: "Monitor, pack and ship every order flowing through the fulfilment grid." },
  admin: { tag: "03 / restricted", title: "Admin", accent: "console", desc: "Manage catalogue and approve or reject incoming orders. Neural link secured." },
};

export default function App() {
  const [view, setView] = useState("shop");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [toasts, setToasts] = useState([]);
  const loadProducts = async () => { try { const d = await getProducts(); setProducts(d.products); } catch (e) { pushToast(e.message, "danger"); } };
  useEffect(() => { loadProducts(); }, []);
  const pushToast = (msg, type = "success") => {
    const id = Date.now(); setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace(/^#\/?/, "") || "shop";
      setView(["shop", "orders", "admin"].includes(h) ? h : "shop");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  const navigate = (v) => { window.location.hash = "/" + v; };
  const h = HEADERS[view] || HEADERS.shop;

  return (
    <>
      <Background />
      <BootScreen />
      <div className="app-shell">
        <Navbar view={view} setView={navigate} cartCount={cart.reduce((a, c) => a + c.quantity, 0)} />
        <SideRail view={view} setView={navigate} />
        <main className="cyber-main">
          <PageHeader tag={h.tag} title={h.title} accent={h.accent} desc={h.desc} />
          {view === "shop" ? <ShopPage products={products} reloadProducts={loadProducts} cart={cart} setCart={setCart} pushToast={pushToast} />
            : view === "orders" ? <OrdersPage pushToast={pushToast} />
            : view === "admin" ? <AdminPage pushToast={pushToast} reloadProducts={loadProducts} />
            : <ShopPage products={products} reloadProducts={loadProducts} cart={cart} setCart={setCart} pushToast={pushToast} />}
          <footer className="cyber-footer">
            <span>shopdesk os v2.7.1 · cyber build</span>
            <span><span className="dot-green">●</span> all systems nominal</span>
          </footer>
        </main>
      </div>
      <Toast toasts={toasts} />
    </>
  );
}
