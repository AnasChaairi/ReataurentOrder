interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-2 mt-12 mb-8">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            currentPage === page
              ? 'bg-[#4A3428] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
