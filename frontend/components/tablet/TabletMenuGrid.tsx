"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { menuService } from "@/services/menu.service";
import { Category, MenuItemListItem, MenuItem } from "@/types/menu.types";
import { MenuItemCard } from "@/components/ui/MenuItemCard";
import MenuItemDetailModal from "@/components/ui/MenuItemDetailModal";
import { useCart } from "@/contexts/CartContext";

export function TabletMenuGrid() {
  const { addToCart, toggleCart, isCartOpen } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemListItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingItem, setIsLoadingItem] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await menuService.getCategories();
        const activeCategories = data.filter((cat) => cat.is_active);
        setCategories(activeCategories);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Debounce the search input so each keystroke doesn't hit the API
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 250);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Fetch menu items when category or search changes
  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params: {
          page_size: number;
          category?: number;
          search?: string;
        } = {
          page_size: 50, // Get more items for tablet view
        };

        if (activeCategory) {
          params.category = activeCategory;
        }
        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await menuService.getMenuItems(params);
        setMenuItems(response.results);
      } catch (err) {
        console.error("Failed to fetch menu items:", err);
        setError("Failed to load menu items. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, [activeCategory, searchQuery]);

  const handleCategoryChange = (categoryId: number | null) => {
    setActiveCategory(categoryId);
  };

  const handleAddToCart = async (itemId: number, quantity: number) => {
    const listItem = menuItems.find((item) => item.id === itemId);
    if (!listItem) return;

    // If item has variants, open the detail modal
    if (listItem.has_variants) {
      handleItemClick(listItem);
      return;
    }

    // Fetch full item details
    try {
      const fullItem = await menuService.getMenuItem(listItem.slug);
      addToCart({
        menuItem: fullItem,
        addons: [],
        quantity,
      });

      if (!isCartOpen) {
        toggleCart();
      }
    } catch (error) {
      // Fallback: construct item from list data
      const fallbackItem: MenuItem = {
        id: listItem.id,
        category: listItem.category,
        category_name: listItem.category_name,
        category_slug: "",
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
        created_at: "",
        updated_at: "",
      };

      addToCart({
        menuItem: fallbackItem,
        addons: [],
        quantity,
      });
    }
  };

  const handleItemClick = async (item: MenuItemListItem) => {
    setIsModalOpen(true);
    setIsLoadingItem(true);

    try {
      const fullItem = await menuService.getMenuItem(item.slug);
      setSelectedItem(fullItem);
    } catch (error) {
      console.error("Error loading item details:", error);
    } finally {
      setIsLoadingItem(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Search + Category Tabs */}
      <div className="bg-baristas-cream px-4 pt-4 pb-4 border-b border-baristas-brown/10 space-y-3">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-baristas-brown/60" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search menu…"
            className="block w-full pl-12 pr-12 py-3 rounded-xl bg-white border border-baristas-brown/15 text-baristas-brown-dark placeholder-baristas-brown/50 focus:outline-none focus:ring-2 focus:ring-baristas-brown focus:border-transparent text-base shadow-sm"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-baristas-brown/60 hover:text-baristas-brown"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="tablet-category-tabs">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`tablet-category-tab ${
              activeCategory === null
                ? "tablet-category-tab-active"
                : "tablet-category-tab-inactive"
            }`}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`tablet-category-tab ${
                activeCategory === category.id
                  ? "tablet-category-tab-active"
                  : "tablet-category-tab-inactive"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 overflow-y-auto bg-baristas-cream p-4 pb-32">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-baristas-brown border-t-transparent mb-4"></div>
              <p className="text-baristas-brown-dark">Loading menu...</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={() => handleCategoryChange(activeCategory)}
                className="text-baristas-brown underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && menuItems.length > 0 && (
          <div className="tablet-menu-grid max-w-4xl mx-auto">
            {menuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onItemClick={handleItemClick}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && menuItems.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-baristas-brown-dark text-lg mb-2">
                {searchQuery
                  ? `No items match “${searchQuery}”.`
                  : "No items available in this category."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchInput("")}
                  className="text-baristas-brown underline text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </div>

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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-baristas-brown border-t-transparent"></div>
            <p className="mt-4 text-baristas-brown-dark">Loading item details...</p>
          </div>
        </div>
      )}
    </div>
  );
}
