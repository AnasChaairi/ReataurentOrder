"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MenuItem, MenuItemVariant, MenuItemAddon, MenuItemListItem } from '@/types/menu.types';
import { useCart } from '@/hooks/useCart';
import { menuService } from '@/services/menu.service';

interface MenuItemDetailModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuItemDetailModal({ item, isOpen, onClose }: MenuItemDetailModalProps) {
  const { addToCart } = useCart();

  // State
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<{ [key: number]: boolean }>({});
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [recommended, setRecommended] = useState<MenuItemListItem[]>([]);
  const [popular, setPopular] = useState<MenuItemListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recommendations and popular items
  useEffect(() => {
    if (isOpen && item) {
      loadRecommendations();
    }
  }, [isOpen, item]);

  const loadRecommendations = async () => {
    try {
      const [recommendedData, popularData] = await Promise.all([
        menuService.getRecommendedItems(item.slug),
        menuService.getPopularItems(),
      ]);
      setRecommended(recommendedData);
      setPopular(popularData);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  // Calculate total price
  const calculatePrice = () => {
    let price = item.price;

    // Add variant price
    if (selectedVariant) {
      price += selectedVariant.price_modifier;
    }

    // Add addons prices
    item.available_addons.forEach((addon) => {
      if (selectedAddons[addon.id]) {
        price += addon.price;
      }
    });

    return price * quantity;
  };

  const handleAddToCart = () => {
    const cartAddons = item.available_addons
      .filter((addon) => selectedAddons[addon.id])
      .map((addon) => ({ addon, quantity: 1 }));

    addToCart({
      menuItem: item,
      variant: selectedVariant,
      addons: cartAddons,
      quantity,
      special_instructions: specialNotes,
    });

    // Reset and close
    setQuantity(1);
    setSelectedAddons({});
    setSpecialNotes('');
    setSelectedVariant(undefined);
    onClose();
  };

  const toggleAddon = (addonId: number) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: !prev[addonId],
    }));
  };

  // Get images for gallery
  const images = item.images && item.images.length > 0
    ? item.images.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.order - b.order;
      })
    : item.image
    ? [{ id: 0, image: item.image, alt_text: item.name, order: 0, is_primary: true, created_at: '' }]
    : [];

  const currentImage = images[selectedImageIndex];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-[#E5D4C1] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-[#E5D4C1] z-10 p-4 flex justify-between items-center border-b-2 border-[#2D1810]/10">
          <button
            onClick={onClose}
            className="text-[#2D1810] hover:text-[#4A3428] flex items-center gap-2 font-medium"
          >
            <span className="text-xl">&larr;</span> Return to Menu
          </button>
          <button
            onClick={onClose}
            className="text-[#2D1810] hover:text-[#4A3428] text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left: Image Gallery */}
            <div>
              {currentImage && (
                <div className="mb-4">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white">
                    <Image
                      src={currentImage.image}
                      alt={currentImage.alt_text || item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                        index === selectedImageIndex
                          ? 'border-[#4A3428]'
                          : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={img.image}
                        alt={img.alt_text || item.name}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div>
              {/* Title and Rating */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-[#2D1810] mb-2">{item.name}</h2>
                {item.average_rating > 0 && (
                  <div className="flex items-center gap-2 text-sm text-[#2D1810]/70">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={star <= item.average_rating ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span>({item.review_count} reviews)</span>
                  </div>
                )}
              </div>

              <p className="text-[#2D1810]/80 mb-6">{item.description}</p>

              {/* Size Selection */}
              {item.variants && item.variants.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-[#2D1810] mb-3">CHOOSE YOUR SIZE</h3>
                  <div className="space-y-2">
                    {item.variants.map((variant) => (
                      <label
                        key={variant.id}
                        className="flex items-center justify-between p-3 rounded-lg border-2 border-[#2D1810]/20 hover:border-[#4A3428] cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="variant"
                            checked={selectedVariant?.id === variant.id}
                            onChange={() => setSelectedVariant(variant)}
                            className="w-4 h-4"
                          />
                          <span className="font-medium text-[#2D1810]">{variant.name}</span>
                        </div>
                        {variant.price_modifier !== 0 && (
                          <span className="text-[#2D1810]/70">
                            {variant.price_modifier > 0 ? '+' : ''}
                            {variant.price_modifier} dh
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons Selection */}
              {item.available_addons && item.available_addons.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-[#2D1810] mb-3">ADD EXTRAS</h3>
                  <div className="space-y-2">
                    {item.available_addons.map((addon) => (
                      <label
                        key={addon.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#2D1810] text-white cursor-pointer hover:bg-[#4A3428]"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedAddons[addon.id] || false}
                            onChange={() => toggleAddon(addon.id)}
                            className="w-4 h-4"
                          />
                          <span className="font-medium">{addon.name}</span>
                        </div>
                        <span className="text-white/90">(+{addon.price} dh)</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div className="mb-6">
                <h3 className="font-bold text-[#2D1810] mb-3">NOTE</h3>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="Add a special request (e.g., no onions, extra sauce)"
                  className="w-full p-3 rounded-lg border-2 border-[#2D1810]/20 focus:border-[#4A3428] focus:outline-none bg-white"
                  rows={3}
                />
              </div>

              {/* Quantity and Add to Cart */}
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-sm text-[#2D1810]/70 mb-1">PRICE</p>
                  <p className="text-2xl font-bold text-[#2D1810]">{calculatePrice()} dh</p>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-white text-[#2D1810] font-bold hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-[#2D1810]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-white text-[#2D1810] font-bold hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-3 rounded-xl bg-[#4A3428] text-white font-bold hover:bg-[#2D1810] transition-colors flex items-center justify-center gap-2"
              >
                <span>🛒</span>
                ADD TO CART
              </button>
            </div>
          </div>

          {/* Recommended Pairings */}
          {recommended.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-[#2D1810] mb-4">RECOMMENDED PAIRINGS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommended.map((recItem) => (
                  <div key={recItem.id} className="bg-black rounded-xl p-4 text-white">
                    {recItem.image && (
                      <div className="relative aspect-square mb-3 rounded-lg overflow-hidden">
                        <Image
                          src={recItem.image}
                          alt={recItem.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h4 className="font-bold mb-1">{recItem.name}</h4>
                    <p className="text-sm text-white/70 mb-2 line-clamp-2">{recItem.description}</p>
                    <p className="font-bold">{recItem.price} dh</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Also Loved */}
          {popular.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-[#2D1810] mb-4">CUSTOMERS ALSO LOVED</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {popular.map((popItem) => (
                  <div key={popItem.id} className="bg-black rounded-xl p-3 text-white">
                    {popItem.image && (
                      <div className="relative aspect-square mb-2 rounded-lg overflow-hidden">
                        <Image
                          src={popItem.image}
                          alt={popItem.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h4 className="font-bold text-sm mb-1">{popItem.name}</h4>
                    <p className="font-bold text-sm">{popItem.price} dh</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
