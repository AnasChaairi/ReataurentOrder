"use client";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="mb-16">
      <h3 className="text-center text-baristas-brown-dark font-semibold mb-8 text-lg">
        Explore Categories
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide justify-center flex-wrap">
        {/* All Items */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-8 py-3 rounded-full whitespace-nowrap transition-all font-medium ${
            activeCategory === null
              ? 'bg-baristas-brown text-white shadow-lg'
              : 'bg-white text-baristas-brown-dark border-2 border-baristas-beige hover:border-baristas-brown hover:shadow-md'
          }`}
        >
          Coffee & Beverages
        </button>

        {/* Category Tabs */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`px-8 py-3 rounded-full whitespace-nowrap transition-all font-medium ${
              activeCategory === category.id
                ? 'bg-baristas-brown text-white shadow-lg'
                : 'bg-white text-baristas-brown-dark border-2 border-baristas-beige hover:border-baristas-brown hover:shadow-md'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
