export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  owner: number | null;
  owner_name: string | null;
  odoo_config: number | null;
  odoo_config_name: string | null;
  address: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantListItem {
  id: number;
  name: string;
  slug: string;
  owner: number | null;
  owner_name: string | null;
  is_active: boolean;
  created_at: string;
}
