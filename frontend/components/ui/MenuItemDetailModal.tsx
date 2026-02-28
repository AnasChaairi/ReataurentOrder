"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MenuItem, MenuItemVariant, MenuItemAddon, MenuItemListItem, ComboChoice } from '@/types/menu.types';
import { CartComboSelection } from '@/types/cart.types';
import { useCart } from '@/hooks/useCart';
import { menuService } from '@/services/menu.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ShoppingCart, Star, Plus, Minus, Layers } from 'lucide-react';

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
  // combo_id -> selected ComboChoice
  const [selectedCombos, setSelectedCombos] = useState<{ [comboId: number]: ComboChoice }>({});
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
    // Fetch each independently so a 500 on one doesn't kill the other
    const [recommended, popular] = await Promise.allSettled([
      menuService.getRecommendedItems(item.slug),
      menuService.getPopularItems(),
    ]);
    if (recommended.status === 'fulfilled') setRecommended(recommended.value);
    if (popular.status === 'fulfilled') setPopular(popular.value);
  };

  // Are all combo groups answered?
  const comboGroups = item.is_combo ? (item.combo_groups ?? []) : [];
  const allCombosSelected = comboGroups.every((g) => selectedCombos[g.combo_id] !== undefined);

  // Calculate total price
  const calculatePrice = () => {
    let price = item.price;

    if (selectedVariant) price += selectedVariant.price_modifier;

    item.available_addons.forEach((addon) => {
      if (selectedAddons[addon.id]) price += addon.price;
    });

    Object.values(selectedCombos).forEach((choice) => {
      price += choice.price_extra;
    });

    return price * quantity;
  };

  const handleAddToCart = () => {
    const cartAddons = item.available_addons
      .filter((addon) => selectedAddons[addon.id])
      .map((addon) => ({ addon, quantity: 1 }));

    // Build structured combo selections for proper Odoo POS transmission
    const comboSelections: CartComboSelection[] = item.is_combo
      ? Object.entries(selectedCombos).map(([comboId, choice]) => ({
          combo_id: Number(comboId),
          combo_line_id: choice.id,
          product_id: choice.choice_item_id,
          label: choice.label,
          price_extra: choice.price_extra,
        }))
      : [];

    addToCart({
      menuItem: item,
      variant: selectedVariant,
      addons: cartAddons,
      combo_selections: comboSelections.length > 0 ? comboSelections : undefined,
      quantity,
      special_instructions: specialNotes || undefined,
    });

    // Reset and close
    setQuantity(1);
    setSelectedAddons({});
    setSelectedCombos({});
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#E5D4C1] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            Customize and add {item.name} to your cart. Choose size, extras, and quantity.
          </DialogDescription>
        </DialogHeader>

        <div className="p-2 sm:p-4">
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
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Product image gallery">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                        index === selectedImageIndex
                          ? 'border-[#4A3428]'
                          : 'border-transparent'
                      }`}
                      aria-label={`View image ${index + 1} of ${images.length}`}
                      aria-pressed={index === selectedImageIndex}
                    >
                      <Image
                        src={img.image}
                        alt={img.alt_text || `${item.name} - Image ${index + 1}`}
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
                <h2 className="text-2xl font-bold text-[#2D1810] mb-2" aria-label={item.name}>{item.name}</h2>
                {item.average_rating > 0 && (
                  <div className="flex items-center gap-2 text-sm text-[#2D1810]/70">
                    <div className="flex" role="img" aria-label={`Rating: ${item.average_rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= item.average_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span>({item.review_count} reviews)</span>
                  </div>
                )}
              </div>

              <p className="text-[#2D1810]/80 mb-6">{item.description}</p>

              {/* Combo Group Selection */}
              {item.is_combo && comboGroups.length > 0 && (
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-[#4A3428]" aria-hidden="true" />
                    <h3 className="font-bold text-[#2D1810] uppercase tracking-wide text-sm">Customize your combo</h3>
                  </div>
                  {comboGroups.map((group, groupIndex) => (
                    <div key={group.combo_id}>
                      <p className="text-xs font-semibold text-[#2D1810]/60 uppercase tracking-wider mb-2">
                        Choice {groupIndex + 1}
                        {!selectedCombos[group.combo_id] && (
                          <span className="ml-2 text-red-500 normal-case font-normal">· required</span>
                        )}
                      </p>
                      <div className="space-y-2" role="radiogroup" aria-label={`Combo group ${groupIndex + 1}`}>
                        {group.choices.map((choice) => {
                          const isSelected = selectedCombos[group.combo_id]?.id === choice.id;
                          return (
                            <label
                              key={choice.id}
                              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-[#4A3428] bg-[#4A3428]/5'
                                  : 'border-[#2D1810]/20 hover:border-[#4A3428]/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`combo-group-${group.combo_id}`}
                                  checked={isSelected}
                                  onChange={() =>
                                    setSelectedCombos((prev) => ({ ...prev, [group.combo_id]: choice }))
                                  }
                                  className="w-4 h-4 accent-[#4A3428]"
                                  aria-label={`${choice.label}${choice.price_extra > 0 ? ` (+${choice.price_extra} dh)` : ''}`}
                                />
                                {choice.choice_item_image && (
                                  <div className="relative w-9 h-9 rounded-md overflow-hidden flex-shrink-0">
                                    <Image
                                      src={choice.choice_item_image}
                                      alt={choice.label}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <span className="font-medium text-[#2D1810]">{choice.label}</span>
                              </div>
                              {choice.price_extra > 0 && (
                                <span className="text-sm text-[#2D1810]/70 flex-shrink-0 ml-2" aria-hidden="true">
                                  +{choice.price_extra} dh
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Size Selection */}
              {item.variants && item.variants.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-[#2D1810] mb-3" id="variant-group-label">CHOOSE YOUR SIZE</h3>
                  <div className="space-y-2" role="radiogroup" aria-labelledby="variant-group-label">
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
                            aria-label={`${variant.name}${variant.price_modifier !== 0 ? ` (${variant.price_modifier > 0 ? '+' : ''}${variant.price_modifier} dh)` : ''}`}
                          />
                          <span className="font-medium text-[#2D1810]">{variant.name}</span>
                        </div>
                        {variant.price_modifier !== 0 && (
                          <span className="text-[#2D1810]/70" aria-hidden="true">
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
                  <h3 className="font-bold text-[#2D1810] mb-3" id="addons-group-label">ADD EXTRAS</h3>
                  <div className="space-y-2" role="group" aria-labelledby="addons-group-label">
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
                            aria-label={`${addon.name} (+${addon.price} dh)`}
                          />
                          <span className="font-medium">{addon.name}</span>
                        </div>
                        <span className="text-white/90" aria-hidden="true">(+{addon.price} dh)</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div className="mb-6">
                <label htmlFor="special-notes" className="font-bold text-[#2D1810] mb-3 block">NOTE</label>
                <textarea
                  id="special-notes"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="Add a special request (e.g., no onions, extra sauce)"
                  className="w-full p-3 rounded-lg border-2 border-[#2D1810]/20 focus:border-[#4A3428] focus:outline-none bg-white"
                  rows={3}
                  aria-label="Special instructions for your order"
                />
              </div>

              {/* Quantity and Add to Cart */}
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-sm text-[#2D1810]/70 mb-1">PRICE</p>
                  <p className="text-2xl font-bold text-[#2D1810]" aria-live="polite" aria-atomic="true">
                    {calculatePrice()} dh
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-auto bg-white rounded-full px-2 py-1.5 shadow-sm" role="group" aria-label="Quantity selector">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-full bg-baristas-cream text-baristas-brown-dark flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-40"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-bold text-[#2D1810]" aria-live="polite" aria-atomic="true">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 rounded-full bg-baristas-cream text-baristas-brown-dark flex items-center justify-center hover:bg-gray-200 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={item.is_combo && !allCombosSelected}
                className="w-full py-3.5 rounded-2xl bg-baristas-brown-dark text-white font-bold hover:bg-baristas-brown transition-colors flex items-center justify-center gap-2 shadow-md text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Add ${quantity} ${item.name} to cart for ${calculatePrice()} dh`}
              >
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                {item.is_combo && !allCombosSelected ? 'SELECT ALL OPTIONS' : 'ADD TO CART'}
              </button>
            </div>
          </div>

          {/* Recommended Pairings */}
          {recommended.length > 0 && (
            <section className="mb-8" aria-labelledby="recommended-heading">
              <h3 id="recommended-heading" className="text-xl font-bold text-[#2D1810] mb-4">RECOMMENDED PAIRINGS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommended.map((recItem) => (
                  <article key={recItem.id} className="bg-black rounded-xl p-4 text-white">
                    {recItem.image && (
                      <div className="relative aspect-square mb-3 rounded-lg overflow-hidden">
                        <Image
                          src={recItem.image}
                          alt={`${recItem.name} - Recommended pairing`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h4 className="font-bold mb-1">{recItem.name}</h4>
                    <p className="text-sm text-white/70 mb-2 line-clamp-2">{recItem.description}</p>
                    <p className="font-bold" aria-label={`Price: ${recItem.price} dirhams`}>{recItem.price} dh</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Customers Also Loved */}
          {popular.length > 0 && (
            <section aria-labelledby="popular-heading">
              <h3 id="popular-heading" className="text-xl font-bold text-[#2D1810] mb-4">CUSTOMERS ALSO LOVED</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {popular.map((popItem) => (
                  <article key={popItem.id} className="bg-black rounded-xl p-3 text-white">
                    {popItem.image && (
                      <div className="relative aspect-square mb-2 rounded-lg overflow-hidden">
                        <Image
                          src={popItem.image}
                          alt={`${popItem.name} - Popular item`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h4 className="font-bold text-sm mb-1">{popItem.name}</h4>
                    <p className="font-bold text-sm" aria-label={`Price: ${popItem.price} dirhams`}>{popItem.price} dh</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
