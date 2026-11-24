import React from "react";
export default function Toast({toasts}){
  const kind = t => t.type==="danger" ? "danger" : (t.type==="success" ? "success" : "info");
  return <div className="toast-stack">{toasts.map(t=>(
    <div key={t.id} className={`toast-cyber ${kind(t)}`}>
      <div className="tk">{t.type==="danger"?"! alert":t.type==="success"?"+ ok":"· sys"}</div>
      {t.msg}
    </div>
  ))}</div>;
}
