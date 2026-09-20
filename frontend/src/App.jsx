import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginView from "./components/auth/LoginView";
import Navbar from "./components/layout/Navbar";

// Owner Views
import OwnerDashboard from "./components/owner/OwnerDashboard";
import MenuManager from "./components/owner/MenuManager";
import CategoryManager from "./components/owner/CategoryManager";
import TableManager from "./components/owner/TableManager";
import OrderManager from "./components/owner/OrderManager";
import KOTManager from "./components/owner/KOTManager";
import RestaurantSettings from "./components/owner/RestaurantSettings";

// Super Admin Views
import SuperAdminDashboard from "./components/superadmin/SuperAdminDashboard";
import RestaurantsDirectory from "./components/superadmin/RestaurantsDirectory";
import AdminUsersList from "./components/superadmin/AdminUsersList";

// Customer QR View
import CustomerMenuView from "./components/customer/CustomerMenuView";
import { api } from "./services/api";

// Real-Time Notification & Modal
import NewOrderNotifier from "./components/notifications/NewOrderNotifier";
import BillRequestNotifier from "./components/notifications/BillRequestNotifier";
import OrderDetailsModal from "./components/owner/OrderDetailsModal";
import BillingModal from "./components/owner/BillingModal";

function MainApp() {
  const { isAuthenticated, role, loading } = useAuth();
  const path = window.location.pathname;
  const isCustomerRoute = path.startsWith("/menu") || path.startsWith("/table") || path === "/customer";
  const routeTokenMatch = path.match(/^\/(?:table|menu)\/([^/]+)$/);
  const scannedQrToken = routeTokenMatch ? decodeURIComponent(routeTokenMatch[1]) : (isCustomerRoute ? "default" : null);

  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem("activeTab") || (role === "super_admin" ? "super_dashboard" : "dashboard");
  });

  const setActiveTab = (tab) => {
    localStorage.setItem("activeTab", tab);
    setActiveTabState(tab);
  };

  // Selected Order for Modal Details
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [billingOrder, setBillingOrder] = useState(null);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

  // Pending order count for Navbar badge
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [pendingKotCount, setPendingKotCount] = useState(0);

  // Sync active tab with user role
  useEffect(() => {
    if (!role) return;
    const storedTab = localStorage.getItem("activeTab");
    if (role === "super_admin") {
      if (!storedTab || !storedTab.startsWith("super_")) {
        setActiveTab("super_dashboard");
      }
    } else {
      if (!storedTab || storedTab.startsWith("super_")) {
        setActiveTab("dashboard");
      }
    }
  }, [role]);

  // Confirmed orders are waiting for the kitchen. Keep the KOT badge live even
  // while the user is working on a different screen.
  useEffect(() => {
    if (!isAuthenticated || role === "super_admin") {
      setPendingKotCount(0);
      return undefined;
    }

    let isMounted = true;
    const refreshKotCount = async () => {
      try {
        const orders = await api.owner.getOrders({ limit: 100 });
        if (isMounted && Array.isArray(orders)) {
          setPendingKotCount(orders.filter((order) => order.kitchenStatus === "confirmed").length);
        }
      } catch (_) {
        // A temporary polling error should not interrupt the POS interface.
      }
    };

    refreshKotCount();
    const interval = setInterval(refreshKotCount, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, role]);

  if (isCustomerRoute || scannedQrToken) {
    return (
      <CustomerMenuView
        qrToken={scannedQrToken || "default"}
        onClose={() => {
          window.location.href = "/";
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eef2f6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium tracking-wide">Initializing Restaurant Manager...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated, show Login screen
  if (!isAuthenticated) {
    return (
      <LoginView
        onOpenCustomerView={() => {}}
      />
    );
  }

  const handleInspectTenant = () => {
    setActiveTab("dashboard");
  };

  const handleOpenOrderDetails = (order) => {
    setSelectedOrderForModal(order);
    setIsOrderModalOpen(true);
    setActiveTab("orders");
    // Clear badge when admin opens order
    setPendingOrderCount((prev) => Math.max(0, prev - 1));
  };

  const handleOpenCustomerView = async () => {
    try {
      const tables = await api.owner.getTables();
      if (tables && tables.length > 0) {
        window.open(`/table/${tables[0].qrToken}`, "_blank");
      } else {
        window.open("/table/6ba7b810-9dad-11d1-80b4-00c04fd430c8", "_blank");
      }
    } catch (e) {
      window.open("/table/6ba7b810-9dad-11d1-80b4-00c04fd430c8", "_blank");
    }
  };

  const handleOpenBillRequest = (order) => {
    setBillingOrder(order);
    setActiveTab("orders");
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] text-slate-800 flex flex-col font-sans">
      {/* Real-Time Incoming Order Pop-up Alert */}
      {role !== "super_admin" && (
        <NewOrderNotifier
          onOpenOrder={handleOpenOrderDetails}
          onPendingCountChange={setPendingOrderCount}
        />
      )}
      {role !== "super_admin" && <BillRequestNotifier onOpenBill={handleOpenBillRequest} />}

      {/* Interactive Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrderForModal}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onStatusUpdated={(id, newStatus) => {
          setSelectedOrderForModal((prev) => (prev ? { ...prev, status: newStatus } : null));
        }}
        onOpenBilling={(order) => setBillingOrder(order)}
      />
      <BillingModal
        order={billingOrder}
        isOpen={Boolean(billingOrder)}
        onClose={() => setBillingOrder(null)}
        onPaymentComplete={(paidOrder) => {
          setSelectedOrderForModal((current) => current?.id === paidOrder.id ? paidOrder : current);
          setOrdersRefreshKey((key) => key + 1);
        }}
      />

      {/* Top POS Header Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCustomerView={handleOpenCustomerView}
        pendingOrderCount={pendingOrderCount}
        pendingKotCount={pendingKotCount}
      />

      {/* Dynamic Workspace Container */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        {/* Restaurant Owner Views */}
        {activeTab === "dashboard" && <OwnerDashboard onNavigate={setActiveTab} />}
        {activeTab === "hotel" && <TableManager initialMode="rooms" initialFilter="occupied" hideModeSwitcher={true} />}
        {activeTab === "orders" && (
          <OrderManager refreshKey={ordersRefreshKey} onSelectOrder={(order) => {
            setSelectedOrderForModal(order);
            setIsOrderModalOpen(true);
          }} />
        )}
        {activeTab === "kot" && <KOTManager />}
        {activeTab === "menu" && <MenuManager />}
        {activeTab === "inventory" && <CategoryManager />}
        {activeTab === "categories" && <CategoryManager />}
        {activeTab === "tables" && (
          <TableManager initialMode="tables" />
        )}
        {activeTab === "reports" && <OwnerDashboard onNavigate={setActiveTab} />}
        {activeTab === "settings" && <RestaurantSettings />}

        {/* Super Admin Pages */}
        {activeTab === "super_dashboard" && (
          <SuperAdminDashboard onNavigate={setActiveTab} />
        )}
        {activeTab === "super_restaurants" && (
          <RestaurantsDirectory onInspectTenant={handleInspectTenant} />
        )}
        {activeTab === "super_admins" && <AdminUsersList />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
