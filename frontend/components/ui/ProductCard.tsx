"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "./Button";

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
    // TODO: Implement cart functionality
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
      {/* Product Image */}
      <div className="relative h-64 bg-black overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* Product Info */}
      <div className="p-6 bg-baristas-cream">
        <h3 className="text-lg font-bold text-baristas-brown-dark uppercase mb-2">
          {name}
        </h3>
        <p className="text-sm text-gray-700 mb-4 line-clamp-2 min-h-[40px]">
          {description}
        </p>
        <p className="text-2xl font-bold text-baristas-brown-dark mb-4">
          {price}
        </p>

        {/* Quantity and Add to Cart */}
        <div className="flex items-center justify-between gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center bg-white rounded-full px-3 py-1.5 gap-3 border border-gray-300">
            <button
              onClick={handleDecrease}
              className="text-baristas-brown hover:text-baristas-brown-dark font-bold text-lg w-6 h-6 flex items-center justify-center"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="text-baristas-brown-dark font-semibold min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              onClick={handleIncrease}
              className="text-baristas-brown hover:text-baristas-brown-dark font-bold text-lg w-6 h-6 flex items-center justify-center"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-baristas-brown text-white px-4 py-2.5 rounded-full font-semibold hover:bg-baristas-brown-light transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
