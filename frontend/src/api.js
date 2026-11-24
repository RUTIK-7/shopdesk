const BASE = "/api";

function currentAdminPassword() {
  return localStorage.getItem("shopdesk_admin") || "";
}

function withAdmin(opts = {}) {
  return { ...opts, headers: { ...(opts.headers || {}), "X-Admin-Password": currentAdminPassword() } };
}

async function req(path, opts = {}) {
  const { headers: optHeaders, ...rest } = opts;
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json", ...optHeaders },
    ...rest,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    const err = new Error(data.message || "Admin password required");
    err.code = 401;
    throw err;
  }
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

export function setAdminPassword(pw) {
  localStorage.setItem("shopdesk_admin", pw);
}

export function clearAdminPassword() {
  localStorage.removeItem("shopdesk_admin");
}

export function getProducts() {
  return req("/products");
}

export function getOrders(params = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  const qsStr = qs.toString();
  return req("/orders" + (qsStr ? `?${qsStr}` : ""));
}

export function getOrder(ref) {
  return req(`/orders/${encodeURIComponent(ref)}`);
}

export function updateStatus(ref, action) {
  return req(`/orders/${encodeURIComponent(ref)}/status`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export function addProduct(body) {
  return req("/admin/products", withAdmin({
    method: "POST",
    body: JSON.stringify(body),
  }));
}

export function deleteProduct(id) {
  return req(`/admin/products/${id}`, withAdmin({ method: "DELETE" }));
}

export function adminOrderAction(ref, action) {
  return req(`/admin/orders/${encodeURIComponent(ref)}/action`, withAdmin({
    method: "POST",
    body: JSON.stringify({ action }),
  }));
}

export function createOrder(body) {
  return req("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}