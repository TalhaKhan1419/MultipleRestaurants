const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
let activeToken = localStorage.getItem("token") || null;

function getToken() {
  return activeToken || localStorage.getItem("token");
}

// Persist authentication token across browser refreshes
export function setAuthToken(token) {
  activeToken = token;
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

function getSelectedRestaurantId() {
  return localStorage.getItem("selectedRestaurantId");
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const selectedRestId = getSelectedRestaurantId();

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (selectedRestId) {
    headers["x-restaurant-id"] = selectedRestId;
  }

  // If body is JSON and not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || (data.errors ? JSON.stringify(data.errors) : `Request failed with status ${response.status}`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth API
  auth: {
    login: (credentials) => request("/auth/login", { method: "POST", body: credentials }),
    getMe: () => request("/auth/me"),
    changePassword: (data) => request("/auth/change-password", { method: "POST", body: data }),
  },

  // Owner Dashboard & Entities
  owner: {
    getDashboardStats: () => request("/orders/stats"),
    // Categories
    getCategories: () => request("/categories"),
    createCategory: (data) => request("/categories", { method: "POST", body: data }),
    updateCategory: (id, data) => request(`/categories/${id}`, { method: "PUT", body: data }),
    deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),
    // Tables
    getTables: () => request("/tables"),
    createTable: (data) => request("/tables", { method: "POST", body: data }),
    updateTable: (id, data) => request(`/tables/${id}`, { method: "PUT", body: data }),
    updateTableStatus: (id, status) => request(`/tables/${id}/status`, { method: "PATCH", body: { status } }),
    getTableQRCode: (id) => request(`/tables/${id}/qrcode`),
    deleteTable: (id) => request(`/tables/${id}`, { method: "DELETE" }),
    // Rooms
    getRooms: () => request("/rooms"),
    createRoom: (data) => request("/rooms", { method: "POST", body: data }),
    updateRoom: (id, data) => request(`/rooms/${id}`, { method: "PUT", body: data }),
    deleteRoom: (id) => request(`/rooms/${id}`, { method: "DELETE" }),
    checkInRoom: (id, data) => request(`/rooms/${id}/check-in`, { method: "POST", body: data }),
    checkOutRoom: (id) => request(`/rooms/${id}/check-out`, { method: "POST" }),
    // Menu
    getMenu: () => request("/menu"),
    createMenuItem: (formData) => request("/menu", { method: "POST", body: formData }),
    updateMenuItem: (id, formData) => request(`/menu/${id}`, { method: "PUT", body: formData }),
    deleteMenuItem: (id) => request(`/menu/${id}`, { method: "DELETE" }),
    // Orders
    getOrders: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/orders${qs ? `?${qs}` : ""}`);
    },
    getOrder: (id) => request(`/orders/${id}`),
    createOrder: (data) => request("/orders", { method: "POST", body: data }),
    updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: "PATCH", body: { status } }),
    updateKitchenNote: (id, kitchenNotes) => request(`/orders/${id}/kitchen-note`, { method: "PATCH", body: { kitchenNotes } }),
    updateKitchenStatus: (id, status) => request(`/orders/${id}/kitchen-status`, { method: "PATCH", body: { status } }),
    updatePaymentStatus: (id, paymentStatus, paymentMethod = "cash") =>
      request(`/orders/${id}/payment`, { method: "PATCH", body: { paymentStatus, paymentMethod } }),
    // Restaurant Profile
    getProfile: () => request("/restaurants/me"),
    updateProfile: (data) => request("/restaurants/me", { method: "PUT", body: data }),
  },

  // Inventory API
  inventory: {
    getSummary: () => request("/inventory/summary"),
    getLowStock: () => request("/inventory/low-stock"),
    getItems: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/inventory${qs ? `?${qs}` : ""}`);
    },
    getItem: (id) => request(`/inventory/${id}`),
    createItem: (data) => request("/inventory", { method: "POST", body: data }),
    updateItem: (id, data) => request(`/inventory/${id}`, { method: "PUT", body: data }),
    deleteItem: (id) => request(`/inventory/${id}`, { method: "DELETE" }),
    stockIn: (id, data) => request(`/inventory/${id}/stock-in`, { method: "POST", body: data }),
    stockOut: (id, data) => request(`/inventory/${id}/stock-out`, { method: "POST", body: data }),
    adjustStock: (id, data) => request(`/inventory/${id}/adjust`, { method: "POST", body: data }),
    getHistory: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/inventory/history${qs ? `?${qs}` : ""}`);
    },
    getItemHistory: (id, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/inventory/${id}/history${qs ? `?${qs}` : ""}`);
    },
    getCategories: () => request("/inventory/categories"),
    createCategory: (data) => request("/inventory/categories", { method: "POST", body: data }),
    updateCategory: (id, data) => request(`/inventory/categories/${id}`, { method: "PUT", body: data }),
    deleteCategory: (id) => request(`/inventory/categories/${id}`, { method: "DELETE" }),
    getSuppliers: () => request("/inventory/suppliers"),
    createSupplier: (data) => request("/inventory/suppliers", { method: "POST", body: data }),
  },

  // Super Admin Platform API
  superAdmin: {
    getStats: () => request("/restaurants/platform-stats"),
    getRestaurants: () => request("/restaurants"),
    createRestaurant: (data) => request("/restaurants", { method: "POST", body: data }),
    updateRestaurantStatus: (id, isActive) => request(`/restaurants/${id}/status`, { method: "PATCH", body: { isActive } }),
    getAdmins: () => request("/restaurants/admins"),
  },

  // Public QR Menu & Table Ordering
  public: {
    getMenu: (qrToken) => request(`/public/menu/${qrToken}`),
    getAvailableTables: (qrToken) => request(`/public/tables/${qrToken}`),
    placeOrder: (data) => request("/public/orders", { method: "POST", body: data }),
    getOrderStatus: (orderId, qrToken) =>
      request(`/public/orders/${orderId}?qrToken=${encodeURIComponent(qrToken)}`),
    requestBill: (orderId, qrToken, paymentMethod) =>
      request(`/public/orders/${orderId}/request-bill`, { method: "POST", body: { qrToken, paymentMethod } }),
    confirmPayment: (orderId, qrToken, paymentMethod) =>
      request(`/public/orders/${orderId}/payment`, { method: "POST", body: { qrToken, paymentMethod } }),
  },
  // Reports API
  reports: {
    getDashboard: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/reports/dashboard${qs ? `?${qs}` : ""}`);
    },
    getExpenses: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/reports/expenses${qs ? `?${qs}` : ""}`);
    },
    createExpense: (data) => request("/reports/expenses", { method: "POST", body: data }),
    deleteExpense: (id) => request(`/reports/expenses/${id}`, { method: "DELETE" }),
  },
};


