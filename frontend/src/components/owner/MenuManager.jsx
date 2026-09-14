import { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  UtensilsCrossed,
  X,
  Check,
  AlertCircle,
  Tag,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function MenuManager() {
  const [menu, setMenu] = useState({ items: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [dietaryFilter, setDietaryFilter] = useState("all");

  // Dish Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryIds: [],
    isAvailable: true,
    image: null,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Quick Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState(null);

  const fetchMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.owner.getMenu();
      setMenu(data || { items: [], categories: [] });
    } catch (err) {
      setError(err.message || "Failed to load menu catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryIds: selectedCategoryId !== "all" ? [Number(selectedCategoryId)] : (menu.categories[0] ? [menu.categories[0].id] : []),
      isAvailable: true,
      image: null,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      categoryIds: (item.categories || []).map((c) => c.id),
      isAvailable: item.isAvailable ?? true,
      image: null,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggleStock = async (item) => {
    try {
      const updatedPayload = {
        name: item.name,
        description: item.description,
        price: Number(item.price),
        categoryIds: (item.categories || []).map((c) => c.id),
        isAvailable: !item.isAvailable,
      };
      await api.owner.updateMenuItem(item.id, updatedPayload);
      fetchMenu();
    } catch (err) {
      alert(err.message || "Failed to toggle stock status");
    }
  };

  const handleSubmitDish = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      if (formData.categoryIds.length === 0) {
        throw new Error("Please select at least one category");
      }

      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("price", String(Number(formData.price)));
      payload.append("categoryIds", JSON.stringify(formData.categoryIds));
      payload.append("isAvailable", String(formData.isAvailable));
      if (formData.image) payload.append("image", formData.image);

      if (editingItem) {
        await api.owner.updateMenuItem(editingItem.id, payload);
      } else {
        await api.owner.createMenuItem(payload);
      }

      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      setModalError(err.message || "Failed to save dish");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryLoading(true);
    setCategoryError(null);

    try {
      await api.owner.createCategory({
        name: categoryName,
        description: categoryDesc,
        displayOrder: menu.categories.length + 1,
        isActive: true,
      });
      setIsCategoryModalOpen(false);
      setCategoryName("");
      setCategoryDesc("");
      fetchMenu();
    } catch (err) {
      setCategoryError(err.message || "Failed to create category");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await api.owner.deleteMenuItem(id);
      fetchMenu();
    } catch (err) {
      alert(err.message || "Failed to delete menu item");
    }
  };

  const toggleCategory = (catId) => {
    setFormData((prev) => {
      const exists = prev.categoryIds.includes(catId);
      if (exists) {
        return { ...prev, categoryIds: prev.categoryIds.filter((id) => id !== catId) };
      } else {
        return { ...prev, categoryIds: [...prev.categoryIds, catId] };
      }
    });
  };

  const isDishVeg = (item) => {
    const name = (item.name + " " + (item.description || "")).toLowerCase();
    const categories = (item.categories || []).map((c) => c.name.toLowerCase()).join(" ");
    if (name.includes("chicken") || name.includes("meat") || name.includes("mutton") || name.includes("beef") || name.includes("fish") || name.includes("prawn") || categories.includes("non-veg")) {
      return false;
    }
    return true;
  };

  const allItems = menu.items || [];
  const totalDishes = allItems.length;
  const inStockDishes = allItems.filter((i) => i.isAvailable).length;
  const outOfStockDishes = allItems.filter((i) => !i.isAvailable).length;
  const totalCategories = (menu.categories || []).length;

  const filteredItems = allItems.filter((item) => {
    const matchesCategory =
      selectedCategoryId === "all" ||
      (item.categories || []).some((c) => c.id === Number(selectedCategoryId));
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in_stock" && item.isAvailable) ||
      (stockFilter === "out_of_stock" && !item.isAvailable);
    const isVeg = isDishVeg(item);
    const matchesDietary =
      dietaryFilter === "all" ||
      (dietaryFilter === "veg" && isVeg) ||
      (dietaryFilter === "non_veg" && !isVeg);

    return matchesCategory && matchesSearch && matchesStock && matchesDietary;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & KPI Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Menu Catalog</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Add dishes, prices, photos, availability, and categories for your restaurant.</p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-semibold text-white shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Dishes</span>
            <div className="text-xl font-bold text-slate-800">{totalDishes}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">In Stock</span>
            <div className="text-xl font-bold text-emerald-600">{inStockDishes}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Out of Stock</span>
            <div className="text-xl font-bold text-rose-600">{outOfStockDishes}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Categories</span>
            <div className="text-xl font-bold text-blue-600">{totalCategories}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
          {error}
        </div>
      )}

      {/* Main Dual Pane */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[550px]">
        {/* Left Rail */}
        <aside className="w-full md:w-56 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200 p-3 space-y-1 shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Categories</span>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedCategoryId("all")}
            className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 text-xs font-semibold transition-all cursor-pointer ${
              selectedCategoryId === "all"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-slate-700 hover:bg-slate-200/60"
            }`}
          >
            <span>All Items</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedCategoryId === "all" ? "bg-white text-orange-600" : "bg-slate-200 text-slate-600"}`}>
              {totalDishes}
            </span>
          </button>

          {(menu.categories || []).map((cat) => {
            const isSelected = selectedCategoryId === cat.id.toString();
            const count = (menu.items || []).filter((it) => (it.categories || []).some((c) => c.id === cat.id)).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id.toString())}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-200/60"
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? "bg-white text-orange-600" : "bg-slate-200 text-slate-600"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Right Main Catalog */}
        <main className="flex-1 p-5 overflow-y-auto">
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search dishes by name..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-orange-500 font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Dishes Grid */}
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-medium">
                No dishes found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredItems.map((item) => {
                  const isVeg = isDishVeg(item);
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-orange-300 transition-all shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-2.5 h-2.5 rounded-full ${isVeg ? "bg-emerald-500" : "bg-rose-500"}`} />
                              <span className="text-[10px] font-bold text-slate-500">
                                {isVeg ? "Pure Veg" : "Non-Veg"}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
                            <div className="text-sm font-bold text-slate-900 mt-0.5">
                              ₹{Number(item.price).toFixed(2)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleStock(item)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              item.isAvailable
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {item.isAvailable ? "In Stock" : "Out of Stock"}
                          </button>
                        </div>

                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {item.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">
                {editingItem ? "Edit Dish" : "Add New Dish"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitDish} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="block text-slate-700 font-medium">Menu Category <span className="text-rose-500">*</span></label>
                  <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="text-orange-600 font-semibold hover:text-orange-700">
                    + Add category
                  </button>
                </div>
                {menu.categories.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">Create a category first, such as Starters or Drinks.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                    {menu.categories.map((category) => (
                      <label key={category.id} className="flex items-center gap-2 rounded-lg p-1.5 text-slate-700 cursor-pointer hover:bg-white">
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="h-3.5 w-3.5 accent-orange-500"
                        />
                        <span className="truncate">{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Dish Photo <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-100 file:px-2 file:py-1 file:text-orange-700"
                />
              </div>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="h-3.5 w-3.5 accent-orange-500"
                />
                Available to customers
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                >
                  {modalLoading ? "Saving..." : "Save Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800">Add Menu Category</h2>
                <p className="text-xs text-slate-500 mt-0.5">For example: Starters, Main Course, Drinks.</p>
              </div>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryError && <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">{categoryError}</div>}

            <form onSubmit={handleCreateCategorySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Category Name</label>
                <input type="text" required maxLength="120" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Starters" className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800" />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea rows="2" value={categoryDesc} onChange={(e) => setCategoryDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={categoryLoading} className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold disabled:opacity-60">
                  {categoryLoading ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
