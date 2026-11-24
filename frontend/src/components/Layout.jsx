import React, { useEffect, useState } from "react";

export function Background() {
  return (
    <>
      <div className="bg-layer bg-aurora" />
      <div className="bg-layer bg-grid" />
      <div className="bg-layer bg-floor" />
      <div className="bg-layer noise" />
      <div className="bg-layer scanlines" />
    </>
  );
}

export function BootScreen() {
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v += Math.random() * 18 + 6;
      if (v >= 100) { v = 100; clearInterval(t); setTimeout(() => setFade(true), 220); setTimeout(() => setGone(true), 900); }
      setPct(Math.floor(v));
    }, 110);
    return () => clearInterval(t);
  }, []);

  if (gone) return null;
  const lines = [
    "> ShopDesk OS v2.7.1 [cyber build]",
    "> mounting /api ... OK",
    "> sync neural catalogue ... OK",
    "> calibrating neon grid ... OK",
    "> secure channel established",
    `> loading assets ......... ${pct}%`,
  ];
  return (
    <div className="boot" style={{ opacity: fade ? 0 : 1, pointerEvents: fade ? "none" : "auto" }}>
      <div className="boot-bar"><i style={{ width: pct + "%" }} /></div>
      <div className="boot-screen">
        {lines.map((l, i) => <div key={i} className={i === lines.length - 1 ? "" : "hide-sm"}>{l}{i === lines.length - 1 && <span className="cursor" />}</div>)}
      </div>
    </div>
  );
}

export function PageHeader({ tag, title, accent, desc, right }) {
  return (
    <div className="page-head">
      <div className="ph-left">
        {tag && <div className="ph-tag mono">{tag}</div>}
        <h1 className="ph-title">
          <span className="gradient-text glitch" data-text={title}>{title}</span>
          {accent && <> <span className="ph-accent">{accent}</span></>}
        </h1>
        {desc && <p className="ph-desc">{desc}</p>}
      </div>
      {right && <div className="ph-right">{right}</div>}
    </div>
  );
}

export function SideRail({ view, setView }) {
  const items = [
    { id: "shop", icon: "cart", label: "Shop" },
    { id: "orders", icon: "list", label: "Orders" },
  ];
  return (
    <div className="side-rail">
      {items.map(it => (
        <button key={it.id} className={`rail-btn ${view === it.id ? "active" : ""}`} onClick={() => setView(it.id)} title={it.label}>
          {it.icon === "cart" ? <CartIcon /> : <ListIcon />}
          <span className="rail-tip">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function CartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6"/></svg>;
}
function ListIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor"/></svg>;
}
