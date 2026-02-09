"use client";

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      style={{ width, height }}
    />
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <Skeleton variant="rectangular" className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-3/4 h-5" />
        <Skeleton variant="text" className="w-full h-4" />
        <Skeleton variant="text" className="w-1/2 h-4" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton variant="text" className="w-16 h-6" />
          <Skeleton variant="rectangular" className="w-24 h-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton variant="text" className="w-32 h-5" />
        <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
      </div>
      <Skeleton variant="text" className="w-48 h-4" />
      <Skeleton variant="text" className="w-full h-4" />
      <Skeleton variant="rectangular" className="w-full h-10 rounded-lg" />
    </div>
  );
}
