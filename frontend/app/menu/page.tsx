"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Layers } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryTabs } from "@/components/ui/CategoryTabs";
import { MenuItemCard } from "@/components/ui/MenuItemCard";
import { Pagination } from "@/components/ui/Pagination";
import MenuItemDetailModal from "@/components/ui/MenuItemDetailModal";
import { menuService } from "@/services/menu.service";
import { Category, MenuItemListItem, MenuItem } from "@/types/menu.types";
import { useCart } from "@/contexts/CartContext";

export default function MenuPage() {
  const { addToCart, toggleCart, isCartOpen } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemListItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCombosOnly, setShowCombosOnly] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingItem, setIsLoadingItem] = useState(false);

  // Debounce search input — wait 350ms after user stops typing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1); // reset to page 1 on new search
    }, 350);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  // Fetch categories
  useEffect(() => {
    const abortController = new AbortController();

    const fetchCategories = async () => {
      try {
        const data = await menuService.getCategories();
        if (!abortController.signal.aborted) {
          setCategories(data.filter(cat => cat.is_active));
        }
      } catch (err: any) {
        // Silently ignore — the api interceptor already handles network/auth toasts
        if (!abortController.signal.aborted && err.name !== 'AbortError') {
          console.error('Failed to fetch categories', err);
        }
      }
    };

    fetchCategories();

    return () => abortController.abort();
  }, []);

  // Fetch menu items
  useEffect(() => {
    const abortController = new AbortController();

    const fetchMenuItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params: any = {
          page: currentPage,
          page_size: 9, // 3x3 grid
        };

        if (activeCategory) {
          params.category = activeCategory;
        }

        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        if (showCombosOnly) {
          params.is_combo = true;
        }

        const response = await menuService.getMenuItems(params);

        if (!abortController.signal.aborted) {
          setMenuItems(response.results);

          // Calculate total pages
          const total = Math.ceil(response.count / 9);
          setTotalPages(total);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted && err.name !== 'AbortError') {
          console.error('Failed to fetch menu items', err);
          setError('Failed to load menu items. Please try again.');
          setMenuItems([]);
          setTotalPages(1);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchMenuItems();

    return () => abortController.abort();
  }, [activeCategory, currentPage, debouncedSearch, showCombosOnly]);

  const handleCategoryChange = (categoryId: number | null) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (itemId: number, quantity: number) => {
    const listItem = menuItems.find(item => item.id === itemId);
    if (!listItem) return;

    // If item has variants or is a combo, open the detail modal so user can choose
    if (listItem.has_variants || listItem.is_combo) {
      handleItemClick(listItem);
      return;
    }

    // Try to fetch full item details; fall back to constructing from list data
    let fullItem: MenuItem;
    try {
      fullItem = await menuService.getMenuItem(listItem.slug);
    } catch {
      fullItem = {
        id: listItem.id,
        category: listItem.category,
        category_name: listItem.category_name,
        category_slug: '',
        name: listItem.name,
        slug: listItem.slug,
        description: listItem.description,
        price: listItem.price,
        image: listItem.image,
        is_vegetarian: listItem.is_vegetarian,
        is_vegan: listItem.is_vegan,
        is_gluten_free: listItem.is_gluten_free,
        preparation_time: listItem.preparation_time,
        is_available: listItem.is_available,
        is_featured: listItem.is_featured,
        is_combo: listItem.is_combo,
        combo_groups: [],
        variants: [],
        available_addons: [],
        images: [],
        average_rating: listItem.average_rating,
        review_count: listItem.review_count,
        created_at: '',
        updated_at: '',
      };
    }

    addToCart({
      menuItem: fullItem,
      addons: [],
      quantity,
    });

    // Open cart sidebar to show feedback
    if (!isCartOpen) {
      toggleCart();
    }
  };

  const handleItemClick = async (item: MenuItemListItem) => {
    setIsModalOpen(true);
    setIsLoadingItem(true);

    try {
      // Fetch full item details including variants, addons, images, etc.
      const fullItem = await menuService.getMenuItem(item.slug);
      setSelectedItem(fullItem);
    } catch (error) {
      console.error('Error loading item details:', error);
      // TODO: Show error toast
    } finally {
      setIsLoadingItem(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Main content landmark */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="relative text-white py-32 pt-44 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <img
              src="/baristas-background.png"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-baristas-brown-dark/85 via-baristas-brown-dark/70 to-baristas-brown-dark/90" />
          </div>
          <div className="relative z-10 container mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-baristas-cream px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              Fresh &amp; Crafted Daily
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
              EXPLORE OUR MENU
            </h1>
            <p className="text-white/65 max-w-2xl mx-auto text-lg leading-relaxed">
              From rich espresso blends to hearty dishes and indulgent desserts,
              BARISTAS brings the café experience to your doorstep.
            </p>

            {/* Search bar */}
            <div className="mt-10 max-w-xl mx-auto">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-white/50 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search items, ingredients..."
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white placeholder-white/45 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all text-base"
                  aria-label="Search menu items"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 text-white/50 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

      {/* Menu Content */}
      <section className="py-16 section-light">
        <div className="container mx-auto px-4">
          {/* Category Tabs */}
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />

          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <button
              onClick={() => { setShowCombosOnly(!showCombosOnly); setCurrentPage(1); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                showCombosOnly
                  ? "bg-baristas-brown-dark text-white border-baristas-brown-dark shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-baristas-brown hover:text-baristas-brown"
              }`}
            >
              <Layers className="w-4 h-4" />
              Combos
              {showCombosOnly && <X className="w-3 h-3 ml-1" />}
            </button>
          </div>

          {/* Active search indicator */}
          {debouncedSearch && (
            <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
              <Search className="w-4 h-4 text-gray-400" />
              <span>
                Results for <span className="font-semibold text-gray-900">&ldquo;{debouncedSearch}&rdquo;</span>
              </span>
              <button
                onClick={clearSearch}
                className="ml-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-20" role="status" aria-live="polite" aria-atomic="true">
              <div
                className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4A3428] border-t-transparent"
                aria-hidden="true"
              ></div>
              <p className="mt-4 text-gray-700">Loading menu items...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-20" role="alert" aria-live="assertive">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => { setError(null); setCurrentPage(1); }}
                className="mt-2 px-6 py-3 bg-[#4A3428] text-white rounded-xl font-semibold hover:bg-[#3B2316] transition-colors"
                aria-label="Retry loading menu items"
              >
                Retry
              </button>
            </div>
          )}

          {/* Menu Items Grid */}
          {!isLoading && menuItems.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {menuItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onItemClick={handleItemClick}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && menuItems.length === 0 && !error && (
            <div className="text-center py-20">
              {debouncedSearch ? (
                <>
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-700 text-lg font-medium mb-2">
                    No results for &ldquo;{debouncedSearch}&rdquo;
                  </p>
                  <p className="text-gray-400 text-sm mb-6">Try a different keyword or browse by category.</p>
                  <button
                    onClick={clearSearch}
                    className="px-6 py-2.5 bg-[#4A3428] text-white rounded-xl font-semibold hover:bg-[#3B2316] transition-colors text-sm"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <p className="text-gray-700 text-lg">No items found in this category.</p>
              )}
            </div>
          )}
        </div>
      </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Menu Item Detail Modal */}
      {selectedItem && (
        <MenuItemDetailModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Loading overlay for modal */}
      {isModalOpen && isLoadingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4A3428] border-t-transparent"></div>
            <p className="mt-4 text-gray-700">Loading item details...</p>
          </div>
        </div>
      )}
    </div>
  );
}

