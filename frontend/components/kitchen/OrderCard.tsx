"use client";

interface OrderItem {
  name: string;
  quantity: number;
  special_instructions?: string;
}

interface KitchenOrder {
  id: number;
  order_number: string;
  status: string;
  table_number: string;
  items: OrderItem[];
  items_count: number;
  customer_notes: string;
  total_amount: string;
  created_at: string;
}

interface OrderCardProps {
  order: KitchenOrder;
  onAdvance: (orderId: number, newStatus: string) => void;
  isUpdating: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  PREPARING: 'bg-orange-500',
  READY: 'bg-green-500',
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
};

const NEXT_LABEL: Record<string, string> = {
  PENDING: 'Confirm',
  CONFIRMED: 'Start Preparing',
  PREPARING: 'Mark Ready',
  READY: 'Mark Served',
};

function getElapsedTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function OrderCard({ order, onAdvance, isUpdating }: OrderCardProps) {
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = NEXT_LABEL[order.status];
  const statusColor = STATUS_COLORS[order.status] || 'bg-gray-500';

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-l-[#4A3428] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-[#3B2316]">{order.order_number}</h3>
          <p className="text-sm text-gray-500">Table {order.table_number}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`${statusColor} text-white text-xs px-2 py-1 rounded-full font-semibold`}>
            {order.status}
          </span>
          <span className="text-xs text-gray-400">{getElapsedTime(order.created_at)}</span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 space-y-2 mb-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start">
            <div className="flex-1">
              <span className="font-semibold text-sm text-[#3B2316]">
                {item.quantity}x {item.name}
              </span>
              {item.special_instructions && (
                <p className="text-xs text-orange-600 italic mt-0.5">
                  {item.special_instructions}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Customer Notes */}
      {order.customer_notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
          <p className="text-xs text-yellow-800 font-medium">Note: {order.customer_notes}</p>
        </div>
      )}

      {/* Action Button */}
      {nextStatus && (
        <button
          onClick={() => onAdvance(order.id, nextStatus)}
          disabled={isUpdating}
          className="w-full py-3 bg-[#4A3428] text-white rounded-lg font-semibold text-sm hover:bg-[#3B2316] transition-colors disabled:opacity-50 active:scale-[0.98] min-h-[48px]"
          aria-label={`${nextLabel} order ${order.order_number}`}
        >
          {isUpdating ? 'Updating...' : nextLabel}
        </button>
      )}
    </div>
  );
}
