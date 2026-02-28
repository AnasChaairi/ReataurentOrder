"use client";

import Image from "next/image";
import { useState } from "react";
import { MenuItemListItem } from "@/types/menu.types";
import { ShoppingCart, Star, Plus, Minus, Layers } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItemListItem;
  onItemClick?: (item: MenuItemListItem) => void;
  onAddToCart?: (itemId: number, quantity: number) => void;
}

export function MenuItemCard({ item, onItemClick, onAddToCart }: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(quantity + 1);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(item.id, quantity);
    }
  };

  const handleCardClick = () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <article
      className="group bg-white rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 border border-gray-100"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`View details for ${item.name}`}
    >
      {/* Image */}
      <div className="relative h-52 bg-baristas-cream overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={`${item.name} - Menu item image`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-baristas-brown/30">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}

        {/* Rating badge */}
        {item.average_rating > 0 && (
          <div
            className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"
            role="img"
            aria-label={`Rating: ${item.average_rating.toFixed(1)} out of 5`}
          >
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span className="text-baristas-brown-dark">{item.average_rating.toFixed(1)}</span>
          </div>
        )}

        {/* Variants badge */}
        {item.has_variants && (
          <div className="absolute top-3 right-3 bg-baristas-brown-dark/80 text-baristas-cream px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-sm">
            <Layers className="w-3 h-3" />
            Sizes
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 bg-baristas-cream">
        <h3 className="text-sm font-bold text-baristas-brown-dark uppercase tracking-wide mb-1.5 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[32px] leading-relaxed">
          {item.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <p className="text-xl font-extrabold text-baristas-brown-dark">
            {item.price} <span className="text-sm font-medium text-gray-400">dh</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Quantity */}
          <div
            className="flex items-center bg-white rounded-full px-2 py-1.5 gap-2 border border-gray-200 shadow-sm"
            role="group"
            aria-label="Quantity selector"
          >
            <button
              onClick={handleDecrease}
              className="text-baristas-brown hover:text-baristas-brown-dark w-6 h-6 flex items-center justify-center rounded-full hover:bg-baristas-cream transition-colors disabled:opacity-40"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span
              className="text-baristas-brown-dark font-bold min-w-[20px] text-center text-sm"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              onClick={handleIncrease}
              className="text-baristas-brown hover:text-baristas-brown-dark w-6 h-6 flex items-center justify-center rounded-full hover:bg-baristas-cream transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-baristas-brown-dark text-white px-4 py-2.5 rounded-full font-semibold hover:bg-baristas-brown transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
            aria-label={`Add ${quantity} ${item.name} to cart`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
