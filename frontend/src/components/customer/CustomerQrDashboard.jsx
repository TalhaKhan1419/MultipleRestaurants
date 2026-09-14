import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Search, UtensilsCrossed } from "lucide-react";
import { api } from "../../services/api";

export default function CustomerQrDashboard({ qrToken }) {
  const [menu, setMenu] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api.public.getMenu(qrToken)
      .then((data) => {
        if (!active) return;
        setMenu(data);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || "This QR code is invalid or unavailable.");
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [qrToken]);

  const categories = menu?.categories || [];
  const items = useMemo(() => {
    const itemsById = new Map();
    for (const category of menu?.categories || []) {
      for (const item of category.items || []) {
        const existing = itemsById.get(item.id);
        if (existing) existing.categoryIds.push(category.id);
        else itemsById.set(item.id, { ...item, categoryName: category.name, categoryIds: [category.id] });
      }
    }
    return [...itemsById.values()];
  }, [menu]);
  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const inCategory = activeCategory === "all" || item.categoryIds.includes(Number(activeCategory));
      const matchesSearch = !term || item.name.toLowerCase().includes(term) || (item.description || "").toLowerCase().includes(term);
      return inCategory && matchesSearch;
    });
  }, [activeCategory, items, search]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Loading restaurant menu…</div>;
  }

  if (error || !menu) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
        <div className="max-w-sm w-full rounded-2xl bg-white border border-rose-200 p-6 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500 mb-3" />
          <h1 className="font-bold text-slate-800">Menu unavailable</h1>
          <p className="text-sm text-slate-500 mt-2">{error || "This QR code could not be verified."}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-10">
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center"><UtensilsCrossed className="w-5 h-5" /></div>
            <div>
              <h1 className="text-lg font-bold">{menu.restaurantName}</h1>
              <p className="text-xs text-slate-300">Table {menu.tableNumber} · Digital Menu</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold">Our Menu</h2>
            <p className="text-sm text-slate-500">Browse items by category.</p>
          </div>
          <label className="relative block w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-500" />
          </label>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-5">
          <button type="button" onClick={() => setActiveCategory("all")} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === "all" ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>All items</button>
          {categories.map((category) => (
            <button key={category.id} type="button" onClick={() => setActiveCategory(String(category.id))} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === String(category.id) ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
              {category.name}
            </button>
          ))}
        </div>

        {visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No available items found in this category.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-40 w-full object-cover" />}
                <div className="p-4">
                  <span className="text-xs font-semibold text-orange-600">{item.categoryName}</span>
                  <div className="flex items-start justify-between gap-3 mt-1">
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                    <span className="font-bold text-slate-900 whitespace-nowrap">₹{Number(item.price).toFixed(2)}</span>
                  </div>
                  {item.description && <p className="text-sm text-slate-500 mt-2 leading-relaxed">{item.description}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
