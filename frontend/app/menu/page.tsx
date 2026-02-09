"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryTabs } from "@/components/ui/CategoryTabs";
import { MenuItemCard } from "@/components/ui/MenuItemCard";
import { Pagination } from "@/components/ui/Pagination";
import MenuItemDetailModal from "@/components/ui/MenuItemDetailModal";
import { menuService } from "@/services/menu.service";
import { Category, MenuItemListItem, MenuItem } from "@/types/menu.types";
import { useCart } from "@/contexts/CartContext";
import { errorHandler } from "@/lib/errorHandler";

export default function MenuPage() {
  const { addToCart, toggleCart, isCartOpen } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemListItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingItem, setIsLoadingItem] = useState(false);

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
        if (!abortController.signal.aborted && err.name !== 'AbortError') {
          errorHandler.error('Failed to fetch categories', err as Error, { component: 'MenuPage' });
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

        const response = await menuService.getMenuItems(params);

        if (!abortController.signal.aborted) {
          setMenuItems(response.results);

          // Calculate total pages
          const total = Math.ceil(response.count / 9);
          setTotalPages(total);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted && err.name !== 'AbortError') {
          errorHandler.error('Failed to fetch menu items', err as Error, {
            component: 'MenuPage',
            page: currentPage,
            category: activeCategory
          });
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
  }, [activeCategory, currentPage]);

  const handleCategoryChange = (categoryId: number | null) => {
    setActiveCategory(categoryId);
    setCurrentPage(1); // Reset to first page when changing category
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (itemId: number, quantity: number) => {
    const listItem = menuItems.find(item => item.id === itemId);
    if (!listItem) return;

    // If item has variants, open the detail modal so user can choose
    if (listItem.has_variants) {
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

      {/* Hero Section */}
      <section className="relative section-dark text-white py-32 pt-40">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            EXPLORE OUR MENU
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg leading-relaxed">
            From rich espresso blends to hearty dishes and indulgent desserts,
            BARISTAS brings the café experience to your doorstep.
          </p>
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

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4A3428] border-t-transparent"></div>
              <p className="mt-4 text-gray-700">Loading menu items...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-20">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => { setError(null); setCurrentPage(1); }}
                className="mt-2 px-6 py-3 bg-[#4A3428] text-white rounded-xl font-semibold hover:bg-[#3B2316] transition-colors"
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
              <p className="text-gray-700 text-lg">No items found in this category.</p>
            </div>
          )}
        </div>
      </section>

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

