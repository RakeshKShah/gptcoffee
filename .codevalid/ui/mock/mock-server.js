/**
 * Mock API server for GPT Coffee UI Playwright tests.
 *
 * Starts an Express server on port 4100 (the default API_BASE used by the UI
 * when VITE_API_URL is not set) and returns mock data for all API endpoints.
 *
 * Usage (from test setup or directly):
 *   import { startMockServer, stopMockServer } from './mock-server.js';
 *   const server = await startMockServer();
 *   // ... run tests ...
 *   await stopMockServer(server);
 *
 * Or run standalone:
 *   node .codevalid/ui/mock/mock-server.js
 */

import http from "http";
import {
  mockUsers,
  mockProducts,
  mockCustomizations,
  mockOrders,
  mockSales,
  makeMockToken,
} from "./mock-data.js";

const PORT = process.env.MOCK_API_PORT || 4100;

// In-memory state (reset each server start)
let orders = [...mockOrders];
let products = [...mockProducts];
let customizations = { ...mockCustomizations };

function resetState() {
  orders = JSON.parse(JSON.stringify(mockOrders));
  products = JSON.parse(JSON.stringify(mockProducts));
  customizations = JSON.parse(JSON.stringify(mockCustomizations));
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function getAuthUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    return Object.values(mockUsers).find((u) => u.id === payload.userId) ?? null;
  } catch {
    return null;
  }
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method.toUpperCase();

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // Health check
  if (path === "/health" || path === "/api/health") {
    return sendJson(res, 200, { ok: true });
  }

  // POST /api/auth/login
  if (method === "POST" && path === "/api/auth/login") {
    const body = await parseBody(req);
    const user = Object.values(mockUsers).find(
      (u) => u.email.toLowerCase() === String(body.email || "").toLowerCase()
    );
    if (!user) {
      return sendJson(res, 401, {
        message: "No user found with that email and password.",
      });
    }
    return sendJson(res, 200, {
      token: makeMockToken(user),
      user,
    });
  }

  // POST /api/auth/signup
  if (method === "POST" && path === "/api/auth/signup") {
    const body = await parseBody(req);
    const newUser = {
      id: `buyer-${Date.now()}`,
      name: body.name || "Coffee Guest",
      email: body.email,
      role: "buyer",
    };
    return sendJson(res, 201, {
      token: makeMockToken(newUser),
      user: newUser,
    });
  }

  // GET /api/menu
  if (method === "GET" && path === "/api/menu") {
    return sendJson(res, 200, { products, customizations });
  }

  // GET /api/orders/my
  if (method === "GET" && path === "/api/orders/my") {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { message: "Missing or invalid session." });
    const userOrders = orders.filter((o) => o.buyerId === user.id);
    return sendJson(res, 200, { orders: userOrders });
  }

  // POST /api/orders
  if (method === "POST" && path === "/api/orders") {
    const user = getAuthUser(req);
    if (!user) return sendJson(res, 401, { message: "Missing or invalid session." });
    const body = await parseBody(req);
    const createdAt = new Date();
    const order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      buyerId: user.id,
      buyerName: user.name,
      createdAt: createdAt.toISOString(),
      readyAt: new Date(createdAt.getTime() + 15 * 60 * 1000).toISOString(),
      status: "Placed",
      total: (body.items || []).reduce((s, i) => s + Number(i.total || 0), 0),
      items: body.items || [],
    };
    orders.unshift(order);
    return sendJson(res, 201, { order });
  }

  // GET /api/admin/orders
  if (method === "GET" && path === "/api/admin/orders") {
    const user = getAuthUser(req);
    if (!user || user.role !== "admin")
      return sendJson(res, 403, { message: "Admin access required." });
    return sendJson(res, 200, { orders });
  }

  // GET /api/admin/sales
  if (method === "GET" && path === "/api/admin/sales") {
    const user = getAuthUser(req);
    if (!user || user.role !== "admin")
      return sendJson(res, 403, { message: "Admin access required." });
    return sendJson(res, 200, mockSales);
  }

  // PATCH /api/admin/orders/:id/status
  const orderStatusMatch = path.match(/^\/api\/admin\/orders\/([^/]+)\/status$/);
  if (method === "PATCH" && orderStatusMatch) {
    const user = getAuthUser(req);
    if (!user || user.role !== "admin")
      return sendJson(res, 403, { message: "Admin access required." });
    const body = await parseBody(req);
    const order = orders.find((o) => o.id === orderStatusMatch[1]);
    if (!order) return sendJson(res, 404, { message: "Order not found." });
    order.status = body.status || order.status;
    return sendJson(res, 200, { order });
  }

  // POST /api/admin/products
  if (method === "POST" && path === "/api/admin/products") {
    const user = getAuthUser(req);
    if (!user || user.role !== "admin")
      return sendJson(res, 403, { message: "Admin access required." });
    const body = await parseBody(req);
    const product = { ...body, id: body.id || `coffee-${Date.now()}` };
    products.unshift(product);
    return sendJson(res, 201, { product });
  }

  // PATCH /api/admin/products/:id
  const productPatchMatch = path.match(/^\/api\/admin\/products\/([^/]+)$/);
  if (method === "PATCH" && productPatchMatch) {
    const user = getAuthUser(req);
    if (!user || user.role !== "admin")
      return sendJson(res, 403, { message: "Admin access required." });
    const body = await parseBody(req);
    const idx = products.findIndex((p) => p.id === productPatchMatch[1]);
    if (idx === -1) return sendJson(res, 404, { message: "Product not found." });
    products[idx] = { ...products[idx], ...body, id: productPatchMatch[1] };
    return sendJson(res, 200, { product: products[idx] });
  }

  // DELETE /api/admin/products/:id
  const productDeleteMatch = path.match(/^\/api\/admin\/products\/([^/]+)$/);
  if (method === "DELETE" && productDeleteMatch) {
    const user = getAuthUser(req);
    if (!user || user.role !== "admin")
      return sendJson(res, 403, { message: "Admin access required." });
    products = products.filter((p) => p.id !== productDeleteMatch[1]);
    res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
    res.end();
    return;
  }

  // PUT /api/admin/customizations
  if (method === "PUT" && path === "/api/admin/customizations") {
    const user = getAuthUser(req);
    if (!user || user.role !== "admin")
      return sendJson(res, 403, { message: "Admin access required." });
    const body = await parseBody(req);
    customizations = body.customizations || customizations;
    return sendJson(res, 200, { customizations });
  }

  // 404 fallback
  sendJson(res, 404, { message: `Not found: ${method} ${path}` });
}

/**
 * Start the mock API server.
 * @param {number} [port] - Port to listen on (default: 4100)
 * @returns {Promise<http.Server>}
 */
export function startMockServer(port = PORT) {
  resetState();
  const server = http.createServer(handleRequest);
  return new Promise((resolve, reject) => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`[mock-server] GPT Coffee mock API listening on http://localhost:${port}`);
      resolve(server);
    });
    server.on("error", reject);
  });
}

/**
 * Stop the mock API server.
 * @param {http.Server} server
 * @returns {Promise<void>}
 */
export function stopMockServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

// Run standalone
const isMain =
  process.argv[1] &&
  new URL(import.meta.url).pathname === new URL(process.argv[1], import.meta.url).pathname;

if (isMain) {
  startMockServer().catch((err) => {
    console.error("[mock-server] Failed to start:", err);
    process.exit(1);
  });
}
