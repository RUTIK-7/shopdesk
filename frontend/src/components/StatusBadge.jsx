import React from "react";
export default function StatusBadge({status}){
  return <span className={`badge-cyber status-${status}`}>{status}</span>;
}
