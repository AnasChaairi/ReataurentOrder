"use client";

interface TableData {
  id: number;
  number: string;
  section: string;
  status: string;
  pending_orders: number;
}

interface TableOverviewProps {
  tables: TableData[];
  onTableClick: (tableId: number) => void;
}

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  AVAILABLE: { bg: 'bg-green-100 border-green-400', label: 'Available' },
  OCCUPIED: { bg: 'bg-blue-100 border-blue-400', label: 'Occupied' },
  NEEDS_ATTENTION: { bg: 'bg-red-100 border-red-400 animate-pulse', label: 'Needs Attention' },
};

export default function TableOverview({ tables, onTableClick }: TableOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map(table => {
        const style = STATUS_STYLES[table.status] || STATUS_STYLES.AVAILABLE;
        return (
          <button
            key={table.id}
            onClick={() => onTableClick(table.id)}
            className={`${style.bg} border-2 rounded-xl p-4 text-left hover:shadow-lg transition-all min-h-[100px] active:scale-[0.98]`}
            aria-label={`Table ${table.number}, ${style.label}, ${table.pending_orders} pending orders`}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-[#3B2316]">T-{table.number}</h3>
              {table.pending_orders > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {table.pending_orders}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{table.section}</p>
            <p className="text-xs text-gray-500 mt-2">{style.label}</p>
          </button>
        );
      })}
    </div>
  );
}
