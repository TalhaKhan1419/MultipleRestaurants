import { useState, useEffect } from "react";
import { User, Phone, X } from "lucide-react";

export default function CustomerDetailsModal({
  isOpen,
  onClose,
  targetItem = null,
  itemType = "Table",
  onConfirm,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setPhone("");
    }
  }, [isOpen]);

  if (!isOpen || !targetItem) return null;

  const itemTitle =
    itemType === "Room"
      ? `Room ${targetItem.roomNumber || targetItem.id}`
      : `Table ${targetItem.tableNumber || targetItem.id}`;

  const handleSave = (e) => {
    if (e) e.preventDefault();
    onConfirm(name.trim(), phone.trim());
  };

  const handleSkip = () => {
    onConfirm("", "");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 border border-pink-100 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-pink-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              {itemTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-500 font-medium ml-10 mb-5">
          Add customer details to track repeat visits — completely optional
        </p>

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guest name"
              className="w-full bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Phone</span>
              <span className="text-slate-400 font-normal">
                (optional — used for repeat detection)
              </span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile number"
              className="w-full bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Skip & Continue
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              Save & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
