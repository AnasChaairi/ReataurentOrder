"use client";

import Image from "next/image";
import { useState } from "react";
import { ShoppingCart, Plus, Minus } from "lucide-react";

interface ProductCardProps {
  name: string;
  description: string;
  price: string;
  image: string;
}

export function ProductCard({ name, description, price, image }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    console.log(`Adding ${quantity} x ${name} to cart`);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 border border-gray-100">
      {/* Image */}
      <div className="relative h-60 bg-baristas-cream overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-400"
        />
      </div>

      {/* Info */}
      <div className="p-5 bg-baristas-cream">
        <h3 className="text-sm font-bold text-baristas-brown-dark uppercase tracking-wide mb-1.5">
          {name}
        </h3>
        <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[32px] leading-relaxed">
          {description}
        </p>
        <p className="text-xl font-extrabold text-baristas-brown-dark mb-4">
          {price}
        </p>

        <div className="flex items-center gap-2">
          {/* Quantity */}
          <div className="flex items-center bg-white rounded-full px-2 py-1.5 gap-2 border border-gray-200 shadow-sm">
            <button
              onClick={handleDecrease}
              className="text-baristas-brown hover:text-baristas-brown-dark w-6 h-6 flex items-center justify-center rounded-full hover:bg-baristas-cream transition-colors disabled:opacity-40"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-baristas-brown-dark font-bold min-w-[20px] text-center text-sm">
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
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
