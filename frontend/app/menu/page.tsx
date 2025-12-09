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

export default function MenuPage() {
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
    const fetchCategories = async () => {
      try {
        const data = await menuService.getCategories();
        setCategories(data.filter(cat => cat.is_active));
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch menu items
  useEffect(() => {
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
        setMenuItems(response.results);

        // Calculate total pages
        const total = Math.ceil(response.count / 9);
        setTotalPages(total);
      } catch (err: any) {
        console.error('Error fetching menu items:', err);
        setError('Failed to load menu items. Please try again.');

        // Use sample data as fallback
        setMenuItems(sampleMenuItems);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
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

  const handleAddToCart = (itemId: number, quantity: number) => {
    console.log(`Added item ${itemId} with quantity ${quantity} to cart`);
    // Quick add to cart - for items without variants/addons
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
              <p className="text-gray-600">Showing sample items instead</p>
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

// Sample menu items for fallback
const sampleMenuItems: MenuItemListItem[] = [
  {
    id: 1,
    name: "GAUFRE TROIX CHOCOLAT",
    slug: "gaufre-troix-chocolat",
    description: "Caramel, chocolate ou lait et chocolat blanc, Biscuit Oreo",
    price: 8,
    category: 1,
    category_name: "Desserts",
    image: "/hero-image.png",
    is_available: true,
    is_featured: true,
    is_vegetarian: true,
    is_vegan: false,
    is_gluten_free: false,
    preparation_time: 15,
    has_variants: false,
    average_rating: 0,
    review_count: 0,
  },
  {
    id: 2,
    name: "CRÊPE KUNAFA PISTACHE",
    description: "Creamy chocolate ou lait et chocolat blanc, Biscuit Oreo",
    price: "7$ dh",
    category: 1,
    image: "/hero-image.png",
    is_available: true,
    is_featured: true,
    is_vegetarian: true,
    is_vegan: false,
  },
  {
    id: 3,
    name: "BROWNIE BARISTAS",
    description: "Caramel, chocolate ou lait et chocolat blanc, Biscuit Oreo",
    price: "6$ dh",
    category: 2,
    image: "/hero-image.png",
    is_available: true,
    is_featured: true,
    is_vegetarian: true,
    is_vegan: false,
  },
  {
    id: 4,
    name: "CRÊPE KUNAFA PISTACHE",
    description: "Creamy chocolate ou lait et chocolat blanc, Biscuit Oreo",
    price: "7$ dh",
    category: 1,
    image: "/hero-image.png",
    is_available: true,
    is_featured: false,
    is_vegetarian: true,
    is_vegan: false,
  },
  {
    id: 5,
    name: "BROWNIE BARISTAS",
    description: "Caramel, chocolate ou lait et chocolat blanc, Biscuit Oreo",
    price: "6$ dh",
    category: 2,
    image: "/hero-image.png",
    is_available: true,
    is_featured: false,
    is_vegetarian: true,
    is_vegan: false,
  },
  {
    id: 6,
    name: "GAUFRE TROIX CHOCOLAT",
    description: "Caramel, chocolate ou lait et chocolat blanc, Biscuit Oreo",
    price: "8$ dh",
    category: 1,
    image: "/hero-image.png",
    is_available: true,
    is_featured: false,
    is_vegetarian: true,
    is_vegan: false,
  },
  {
    id: 7,
    name: "GAUFRE TROIX CHOCOLAT",
    description: "Caramel, chocolate ou lait et chocolat blanc, Biscuit Oreo",
    price: "8$ dh",
    category: 1,
    image: "/hero-image.png",
    is_available: true,
    is_featured: false,
    is_vegetarian: true,
    is_vegan: false,
  },
  {
    id: 8,
    name: "CRÊPE KUNAFA PISTACHE",
    description: "Creamy chocolate ou lait et chocolat blanc, Biscuit Oreo",
    price: "7$ dh",
    category: 1,
    image: "/hero-image.png",
    is_available: true,
    is_featured: false,
    is_vegetarian: true,
    is_vegan: false,
  },
  {
    id: 9,
    name: "BROWNIE BARISTAS",
    description: "Caramel, chocolate ou lait et chocolat blanc, Biscuit Oreo",
    price: "6$ dh",
    category: 2,
    image: "/hero-image.png",
    is_available: true,
    is_featured: false,
    is_vegetarian: true,
    is_vegan: false,
  },
];
