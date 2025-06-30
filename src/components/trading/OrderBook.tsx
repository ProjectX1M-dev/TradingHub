import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import mt5ApiService from '../../lib/mt5ApiService';
import { useAuthStore } from '../../stores/authStore';

interface Order {
  id: string;
  ticket: number;
  symbol: string;
  type: 'Buy Limit' | 'Sell Limit' | 'Buy Stop' | 'Sell Stop';
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  timestamp: string;
  comment?: string;
}

export const OrderBook: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'filled' | 'cancelled'>('all');
  const { isAuthenticated } = useAuthStore();

  // Fetch real pending orders
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchOrders = async () => {
      if (!isAuthenticated) {
        setOrders([]);
        return;
      }
      try {
        // Assuming mt5ApiService.getPendingOrders() fetches both pending and opened orders
        // and returns them in a format compatible with the 'Order' interface.
        // You might need to adapt the data structure based on your actual API response.
        const fetchedOrders = await mt5ApiService.getPendingOrders();
        if (fetchedOrders) {
          // For demonstration, let's assume fetchedOrders are already in the correct format
          // and include a 'status' field. If not, you'll need to map them.
          setOrders(fetchedOrders.map((order: any) => ({
            id: order.ticket.toString(),
            ticket: order.ticket,
            symbol: order.symbol,
            type: order.type === 'ORDER_TYPE_BUY_LIMIT' ? 'Buy Limit' : // Map MT5 order types
                  order.type === 'ORDER_TYPE_SELL_LIMIT' ? 'Sell Limit' :
                  order.type === 'ORDER_TYPE_BUY_STOP' ? 'Buy Stop' :
                  order.type === 'ORDER_TYPE_SELL_STOP' ? 'Sell Stop' :
                  order.type === 'ORDER_TYPE_BUY' ? 'Buy Limit' : 'Sell Limit', // Fallback for market orders if they appear
            volume: order.volume || order.lots,
            openPrice: order.price_open || order.price_current,
            currentPrice: order.price_current,
            stopLoss: order.sl,
            takeProfit: order.tp,
            status: order.state === 'ORDER_STATE_PENDING' ? 'pending' : // Map MT5 order states
                    order.state === 'ORDER_STATE_FILLED' ? 'filled' :
                    order.state === 'ORDER_STATE_CANCELED' ? 'cancelled' :
                    order.state === 'ORDER_STATE_EXPIRED' ? 'expired' : 'pending',
            timestamp: new Date(order.time_setup * 1000).toISOString(), // Convert Unix timestamp to ISO string
            comment: order.comment
          })));
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setOrders([]);
      }
    };

    if (isAuthenticated) {
      fetchOrders(); // Initial fetch
      interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    }

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const filteredOrders = orders.filter(order => 
    filter === 'all' || order.status === filter
  );

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes('JPY')) return price.toFixed(3);
    return price.toFixed(5);
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'filled':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'filled':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    // In a real application, you would call an MT5 API method to cancel the order
    // For now, we'll simulate the status change
    console.log(`Attempting to cancel order ${orderId}`);
    // Assuming mt5ApiService has a cancelOrder method
    try {
      // const success = await mt5ApiService.cancelOrder(orderId);
      // if (success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' as const }
            : order
        ));
        // toast.success(`Order ${orderId} cancelled successfully`);
      // } else {
        // toast.error(`Failed to cancel order ${orderId}`);
      // }
    } catch (error) {
      console.error('Error canceling order:', error);
      // toast.error('Error canceling order');
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const filledOrders = orders.filter(o => o.status === 'filled').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">{pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Filled</p>
              <p className="text-xl font-bold text-gray-900">{filledOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Cancelled</p>
              <p className="text-xl font-bold text-gray-900">{cancelledOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Order Book</h2>
            
            {/* Filter Buttons */}
            <div className="flex space-x-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'filled', label: 'Filled' },
                { id: 'cancelled', label: 'Cancelled' }
              ].map(filterOption => (
                <button
                  key={filterOption.id}
                  onClick={() => setFilter(filterOption.id as any)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filter === filterOption.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SL/TP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {order.ticket}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{order.symbol}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.type.includes('Buy')
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.volume}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {formatPrice(order.openPrice, order.symbol)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {formatPrice(order.currentPrice, order.symbol)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {order.stopLoss && (
                          <div className="text-red-600">
                            SL: {formatPrice(order.stopLoss, order.symbol)}
                          </div>
                        )}
                        {order.takeProfit && (
                          <div className="text-green-600">
                            TP: {formatPrice(order.takeProfit, order.symbol)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(order.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};