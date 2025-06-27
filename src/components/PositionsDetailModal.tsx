import React, { useState } from 'react';
import { Position } from '../types/mt5';
import { X, TrendingUp, TrendingDown, DollarSign, Filter, Search, ArrowUpDown } from 'lucide-react';
import { useTradingStore } from '../stores/tradingStore';
import { formatDistanceToNow } from 'date-fns';

interface PositionsDetailModalProps {
  positions: Position[];
  onClose: () => void;
}

export const PositionsDetailModal: React.FC<PositionsDetailModalProps> = ({ positions, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'profit' | 'symbol' | 'openTime'>('profit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  
  const { closePosition } = useTradingStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleClosePosition = async (ticket: number) => {
    await closePosition(ticket);
  };

  // Filter positions
  const filteredPositions = positions.filter(position => {
    // Apply search filter
    const matchesSearch = position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.ticket.toString().includes(searchTerm);
    
    // Apply type filter
    const matchesType = filterType === 'all' || 
                       (filterType === 'buy' && position.type === 'Buy') ||
                       (filterType === 'sell' && position.type === 'Sell');
    
    return matchesSearch && matchesType;
  });

  // Sort positions
  const sortedPositions = [...filteredPositions].sort((a, b) => {
    if (sortBy === 'profit') {
      return sortDirection === 'desc' ? b.profit - a.profit : a.profit - b.profit;
    } else if (sortBy === 'symbol') {
      return sortDirection === 'desc' 
        ? b.symbol.localeCompare(a.symbol) 
        : a.symbol.localeCompare(b.symbol);
    } else if (sortBy === 'openTime') {
      const dateA = new Date(a.openTime).getTime();
      const dateB = new Date(b.openTime).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    }
    return 0;
  });

  // Calculate summary stats
  const totalProfit = positions.reduce((sum, pos) => sum + pos.profit, 0);
  const profitablePositions = positions.filter(pos => pos.profit > 0);
  const losingPositions = positions.filter(pos => pos.profit < 0);
  const avgProfit = profitablePositions.length > 0 
    ? profitablePositions.reduce((sum, pos) => sum + pos.profit, 0) / profitablePositions.length 
    : 0;
  const avgLoss = losingPositions.length > 0 
    ? losingPositions.reduce((sum, pos) => sum + pos.profit, 0) / losingPositions.length 
    : 0;

  const handleSort = (column: 'profit' | 'symbol' | 'openTime') => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Open Positions</h2>
                <p className="text-sm text-gray-500">
                  {positions.length} active positions with {formatCurrency(totalProfit)} total P&L
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Total Positions</p>
                  <p className="text-xl font-bold text-blue-800">{positions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Total P&L</p>
                  <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalProfit)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Profitable</p>
                  <p className="text-xl font-bold text-green-600">
                    {profitablePositions.length} ({avgProfit > 0 ? formatCurrency(avgProfit) : '$0.00'})
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-red-600">Losing</p>
                  <p className="text-xl font-bold text-red-600">
                    {losingPositions.length} ({avgLoss < 0 ? formatCurrency(avgLoss) : '$0.00'})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-auto md:flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by symbol or ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex space-x-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filterType === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('buy')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filterType === 'buy'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setFilterType('sell')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filterType === 'sell'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <div className="flex space-x-1">
                <button
                  onClick={() => handleSort('profit')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    sortBy === 'profit'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Profit {sortBy === 'profit' && (sortDirection === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  onClick={() => handleSort('symbol')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    sortBy === 'symbol'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Symbol {sortBy === 'symbol' && (sortDirection === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  onClick={() => handleSort('openTime')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    sortBy === 'openTime'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Time {sortBy === 'openTime' && (sortDirection === 'desc' ? '↓' : '↑')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Positions Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
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
                  Open Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit/Loss
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Open Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPositions.map((position) => (
                <tr key={position.ticket} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {position.ticket}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{position.symbol}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      position.type === 'Buy'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {position.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {position.volume}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {position.openPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {position.currentPrice || position.openPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      position.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(position.profit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {position.openTime ? formatDistanceToNow(new Date(position.openTime), { addSuffix: true }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleClosePosition(position.ticket)}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title={`Close position ${position.ticket}`}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No Results */}
        {sortedPositions.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No positions match your filters</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};