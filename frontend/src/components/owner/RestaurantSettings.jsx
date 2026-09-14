import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Printer,
  FileText,
  Monitor,
  Receipt,
  Leaf,
  Percent,
  DollarSign,
  Hash,
  Bed,
  Coffee,
  Store,
  ChevronRight,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Image,
  Lock,
  Sliders,
  Check
} from "lucide-react";

export default function RestaurantSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // ID of active settings modal
  const [toastMsg, setToastMsg] = useState(null);

  // Settings State Management
  const [generalProfile, setGeneralProfile] = useState({
    name: "UP 65 Restaurant & Buffet",
    phone: "+91 98765 43210",
    email: "manager@up65restaurant.com",
    address: "Varanasi, Uttar Pradesh, India",
    logoUrl: "",
  });

  const [printerConfig, setPrinterConfig] = useState({
    kotPrinter: "RP3200 plus{U} 1",
    billPrinter: "Thermal 80mm USB",
    printPort: "USB001",
    autoPrintKOT: true,
    autoPrintBill: false,
  });

  const [kotTemplate, setKotTemplate] = useState({
    headerTitle: "UP 65 KITCHEN TICKET",
    footerText: "Thank you for dining with us!",
    showItemPrices: false,
    showWaiterName: true,
    showTableNo: true,
  });

  const [gstConfig, setGstConfig] = useState({
    enabled: true,
    cgstRate: "2.5",
    sgstRate: "2.5",
    gstinNumber: "09AAACU5041M1ZM",
    taxInclusive: false,
  });

  const [inRoomOrdering, setInRoomOrdering] = useState({
    enabled: true,
    phonePeIntegrated: true,
    startTime: "07:00",
    endTime: "23:00",
    customNotice: "Room service delivered directly to your room.",
  });

  const [breakfastConfig, setBreakfastConfig] = useState({
    enabled: true,
    remindersOn: true,
    breakfastStart: "07:00",
    breakfastEnd: "10:30",
  });

  const [dietaryPrefs, setDietaryPrefs] = useState({
    showVegNonVegBadge: true,
    defaultType: "Veg",
    highlightJain: true,
  });

  const [printBillFlow, setPrintBillFlow] = useState({
    showPendingInvoice: true,
    recordPaymentNoAutoPrint: true,
    allowPartialPayments: false,
  });

  const [invoiceLayout, setInvoiceLayout] = useState("Layout 1 (Thermal Compact)");
  const [tokenSearch, setTokenSearch] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(false);
    try {
      const data = await api.owner.getProfile();
      if (data) {
        setProfile(data);
        setGeneralProfile({
          name: data.name || "UP 65 Restaurant & Buffet",
          phone: data.phone || "+91 98765 43210",
          email: data.email || "manager@up65restaurant.com",
          address: data.address || "Varanasi, Uttar Pradesh, India",
          logoUrl: data.logoUrl || "",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Card definitions matching the exact screenshot layout
  const settingsCards = [
    {
      id: "printer_setup",
      title: "Printer Setup",
      subtitle: "KOT and bill printers — name, print port, USB connect, and auto-print.",
      icon: Printer,
    },
    {
      id: "kot_template",
      title: "KOT Template",
      subtitle: "Customise the KOT print slip — header title, footer, show/hide fields, and print prices.",
      icon: FileText,
    },
    {
      id: "ordering_terminals",
      title: "Ordering Terminals",
      subtitle: "Manage sales locations and terminal-based menu pricing.",
      icon: Monitor,
    },
    {
      id: "invoice_templates",
      title: "Invoice Templates",
      subtitle: "Choose from 3 invoice layouts — used automatically when billing guests.",
      icon: Receipt,
    },
    {
      id: "dietary_preferences",
      title: "Dietary Preferences",
      subtitle: "Enable or disable Veg/Non-Veg indicators for menu items.",
      icon: Leaf,
    },
    {
      id: "gst_configuration",
      title: "GST Configuration",
      subtitle: "Separate CGST and SGST rates and invoice clause for bills and checkout.",
      icon: Percent,
    },
    {
      id: "print_bill",
      title: "Print Bill",
      subtitle: "Custom invoice flow — show invoice with pending payment and record payment without auto-printing.",
      icon: DollarSign,
    },
    {
      id: "token_number_search",
      title: "Token Number Search",
      subtitle: "Assign sequential token numbers to menu items for fast, strict search from the POS.",
      icon: Hash,
    },
    {
      id: "in_room_ordering",
      title: "In-Room Ordering",
      subtitle: "Time slots, manual on/off, and messages for guest room bill & PhonePe ordering.",
      icon: Bed,
    },
    {
      id: "breakfast_settings",
      title: "Breakfast Settings",
      subtitle: "Enable breakfast reminders and set serving hours for room-service guest cards.",
      icon: Coffee,
    },
    {
      id: "edit_restaurant",
      title: "Edit Restaurant",
      subtitle: "Restaurant profile, hours, and general settings.",
      icon: Store,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure restaurant operations and ordering.
        </p>
      </div>

      {/* 2-Column Settings Grid matching reference photo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => setActiveModal(card.id)}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:border-orange-500 transition-colors">
                  <Icon className="w-5 h-5 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-orange-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-1 shrink-0">
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DIALOGS FOR SETTINGS */}

      {/* 1. Printer Setup Modal */}
      {activeModal === "printer_setup" && (
        <ModalWrapper title="Printer Setup" onClose={() => setActiveModal(null)}>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Active KOT Printer</label>
              <select
                value={printerConfig.kotPrinter}
                onChange={(e) => setPrinterConfig({ ...printerConfig, kotPrinter: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              >
                <option value="RP3200 plus{U} 1">RP3200 plus{U} 1 (Thermal USB)</option>
                <option value="Epson TM-T82">Epson TM-T82 (LAN)</option>
                <option value="Posiflex 2">Posiflex 2 (Bluetooth)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Billing Receipt Printer</label>
              <select
                value={printerConfig.billPrinter}
                onChange={(e) => setPrinterConfig({ ...printerConfig, billPrinter: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              >
                <option value="Thermal 80mm USB">Thermal 80mm USB</option>
                <option value="LaserJet Pro M12">LaserJet Pro M12</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">USB / Serial Port</label>
              <input
                type="text"
                value={printerConfig.printPort}
                onChange={(e) => setPrinterConfig({ ...printerConfig, printPort: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printerConfig.autoPrintKOT}
                  onChange={(e) => setPrinterConfig({ ...printerConfig, autoPrintKOT: e.target.checked })}
                  className="rounded text-orange-500 focus:ring-orange-400"
                />
                <span className="text-slate-700 font-medium">Auto-print KOT on order placement</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printerConfig.autoPrintBill}
                  onChange={(e) => setPrinterConfig({ ...printerConfig, autoPrintBill: e.target.checked })}
                  className="rounded text-orange-500 focus:ring-orange-400"
                />
                <span className="text-slate-700 font-medium">Auto-print Bill on checkout</span>
              </label>
            </div>

            <ModalFooter
              onSave={() => {
                showNotification("Printer setup updated!");
                setActiveModal(null);
              }}
              onClose={() => setActiveModal(null)}
            />
          </div>
        </ModalWrapper>
      )}

      {/* 2. KOT Template Modal */}
      {activeModal === "kot_template" && (
        <ModalWrapper title="KOT Slip Template" onClose={() => setActiveModal(null)}>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Header Title</label>
              <input
                type="text"
                value={kotTemplate.headerTitle}
                onChange={(e) => setKotTemplate({ ...kotTemplate, headerTitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Footer Slip Note</label>
              <input
                type="text"
                value={kotTemplate.footerText}
                onChange={(e) => setKotTemplate({ ...kotTemplate, footerText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kotTemplate.showItemPrices}
                  onChange={(e) => setKotTemplate({ ...kotTemplate, showItemPrices: e.target.checked })}
                  className="rounded text-orange-500"
                />
                <span className="text-slate-700 font-medium">Print Item Prices on KOT</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kotTemplate.showTableNo}
                  onChange={(e) => setKotTemplate({ ...kotTemplate, showTableNo: e.target.checked })}
                  className="rounded text-orange-500"
                />
                <span className="text-slate-700 font-medium">Show Room / Table Number prominently</span>
              </label>
            </div>

            <ModalFooter
              onSave={() => {
                showNotification("KOT Template updated!");
                setActiveModal(null);
              }}
              onClose={() => setActiveModal(null)}
            />
          </div>
        </ModalWrapper>
      )}

      {/* 3. GST Configuration Modal */}
      {activeModal === "gst_configuration" && (
        <ModalWrapper title="GST & Tax Configuration" onClose={() => setActiveModal(null)}>
          <div className="space-y-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer bg-orange-50/60 p-3 rounded-xl border border-orange-200">
              <input
                type="checkbox"
                checked={gstConfig.enabled}
                onChange={(e) => setGstConfig({ ...gstConfig, enabled: e.target.checked })}
                className="rounded text-orange-500"
              />
              <span className="text-slate-800 font-bold">Enable GST Calculation on Bills</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">CGST Rate (%)</label>
                <input
                  type="text"
                  value={gstConfig.cgstRate}
                  onChange={(e) => setGstConfig({ ...gstConfig, cgstRate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">SGST Rate (%)</label>
                <input
                  type="text"
                  value={gstConfig.sgstRate}
                  onChange={(e) => setGstConfig({ ...gstConfig, sgstRate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstConfig.gstinNumber}
                onChange={(e) => setGstConfig({ ...gstConfig, gstinNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            <ModalFooter
              onSave={() => {
                showNotification("GST settings updated!");
                setActiveModal(null);
              }}
              onClose={() => setActiveModal(null)}
            />
          </div>
        </ModalWrapper>
      )}

      {/* 4. Edit Restaurant Modal */}
      {activeModal === "edit_restaurant" && (
        <ModalWrapper title="Edit Restaurant Profile" onClose={() => setActiveModal(null)}>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Restaurant Name</label>
              <input
                type="text"
                value={generalProfile.name}
                onChange={(e) => setGeneralProfile({ ...generalProfile, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={generalProfile.phone}
                  onChange={(e) => setGeneralProfile({ ...generalProfile, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={generalProfile.email}
                  onChange={(e) => setGeneralProfile({ ...generalProfile, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Address</label>
              <textarea
                rows="2"
                value={generalProfile.address}
                onChange={(e) => setGeneralProfile({ ...generalProfile, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            <ModalFooter
              onSave={() => {
                showNotification("Restaurant profile updated!");
                setActiveModal(null);
              }}
              onClose={() => setActiveModal(null)}
            />
          </div>
        </ModalWrapper>
      )}

      {/* Generic Modal Handler for other 7 settings cards */}
      {activeModal && !["printer_setup", "kot_template", "gst_configuration", "edit_restaurant"].includes(activeModal) && (
        <ModalWrapper
          title={settingsCards.find((c) => c.id === activeModal)?.title || "Settings"}
          onClose={() => setActiveModal(null)}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              {settingsCards.find((c) => c.id === activeModal)?.subtitle}
            </p>

            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-slate-700 flex items-center justify-between">
              <span className="font-semibold text-xs">Active Status</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                ENABLED
              </span>
            </div>

            <ModalFooter
              onSave={() => {
                showNotification("Settings saved!");
                setActiveModal(null);
              }}
              onClose={() => setActiveModal(null)}
            />
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

function ModalWrapper({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onSave, onClose }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <Save className="w-3.5 h-3.5" />
        <span>Save Changes</span>
      </button>
    </div>
  );
}
