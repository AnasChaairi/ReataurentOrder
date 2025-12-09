// Menu related type definitions

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  is_active: boolean;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemVariant {
  id: number;
  name: string;
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE' | '';
  price_modifier: number;
  final_price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemAddon {
  id: number;
  name: string;
  category: 'TOPPING' | 'SAUCE' | 'SIDE' | 'DRINK' | 'EXTRA';
  description?: string;
  price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemImage {
  id: number;
  image: string;
  alt_text?: string;
  order: number;
  is_primary: boolean;
  created_at: string;
}

export interface MenuItemReview {
  id: number;
  menu_item: number;
  user: number;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  category: number;
  category_name: string;
  category_slug: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image?: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  preparation_time: number;
  ingredients?: string;
  allergens?: string;
  calories?: number;
  is_available: boolean;
  is_featured: boolean;
  variants: MenuItemVariant[];
  available_addons: MenuItemAddon[];
  images: MenuItemImage[];
  average_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemListItem {
  id: number;
  category: number;
  category_name: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image?: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  preparation_time: number;
  is_available: boolean;
  is_featured: boolean;
  has_variants: boolean;
  average_rating: number;
  review_count: number;
}

export interface CreateReviewData {
  menu_item: number;
  rating: number;
  comment: string;
}
