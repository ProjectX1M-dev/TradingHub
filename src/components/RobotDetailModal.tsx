import React, { useState } from 'react';
import { X, Copy, Check, Bot, Settings, Play, Pause, Trash2, Eye, EyeOff, Target, DollarSign, TrendingUp, Award, Activity, Globe, Calendar, Zap, AlertTriangle } from 'lucide-react';
import { Robot } from '../types/mt5';
import { useTradingStore } from '../stores/tradingStore';
import toast from 'react-hot-toast';

interface RobotDetailModalProps {
  robot: Robot;
  onClose: () => void;
}

export const RobotDetailModal: React.FC<RobotDetailModalProps> = ({ robot, onClose }) => {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [showBotToken, setShowBotToken] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { toggleRobot, deleteRobot } = useTradingStore();

  const handleCopy = async (text: string, itemName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemName));
      toast.success(`${itemName} copied to clipboard`);
      
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemName);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error(`Failed to copy ${itemName}`);
    }
  };

  const handleToggleRobot = async () => {
    await toggleRobot(robot.id);
  };

  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteRobot = async () => {
    try {
      await deleteRobot(robot.id);
      toast.success(`Robot "${robot.name}" deleted successfully`);
      onClose();
    } catch (error) {
      console.error('Error deleting robot:', error);
      toast.error('Failed to delete robot');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const getRiskColor = (risk: Robot['riskLevel']) => {
    switch (risk) {
      case 'LOW': return 'bg-green-50 text-green-700 border-green-200';
      case 'MEDIUM': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'HIGH': return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getPerformanceColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-600';
    if (winRate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${
                robot.isActive 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-gray-50 text-gray-600'
              }`}>
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{robot.name}</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center space-x-1">
                    {robot.symbol ? (
                      <>
                        <Target className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{robot.symbol}</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">All Symbols</span>
                      </>
                    )}
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{robot.strategy}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskColor(robot.riskLevel)}`}>
                    {robot.riskLevel}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                robot.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`}></div>
              <span className={`text-sm font-medium ${
                robot.isActive ? 'text-green-600' : 'text-gray-500'
              }`}>
                {robot.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Total Trades</p>
                  <p className="text-xl font-bold text-blue-800">{robot.performance.totalTrades}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Win Rate</p>
                  <p className={`text-xl font-bold ${getPerformanceColor(robot.performance.winRate)}`}>
                    {robot.performance.winRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Total Profit</p>
                  <p className={`text-xl font-bold ${
                    robot.performance.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${robot.performance.profit.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-600">Max Lot</p>
                  <p className="text-xl font-bold text-yellow-800">{robot.maxLotSize}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trading Parameters */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Trading Parameters
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Symbol:</span>
                  <span className="font-medium">{robot.symbol || 'All Symbols'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Strategy:</span>
                  <span className="font-medium">{robot.strategy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk Level:</span>
                  <span className={`font-medium ${
                    robot.riskLevel === 'LOW' ? 'text-green-600' :
                    robot.riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {robot.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Lot Size:</span>
                  <span className="font-medium">{robot.maxLotSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stop Loss:</span>
                  <span className="font-medium">{robot.stopLoss} pips</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Take Profit:</span>
                  <span className="font-medium">{robot.takeProfit} pips</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk:Reward:</span>
                  <span className="font-medium">1:{(robot.takeProfit / robot.stopLoss).toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Robot Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Robot Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-sm">{formatDate(robot.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    robot.isActive ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {robot.isActive ? 'Active & Trading' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Performance:</span>
                  <span className={`font-medium ${getPerformanceColor(robot.performance.winRate)}`}>
                    {robot.performance.winRate >= 70 ? 'Excellent' :
                     robot.performance.winRate >= 50 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg P&L per Trade:</span>
                  <span className={`font-medium ${
                    robot.performance.totalTrades > 0 && (robot.performance.profit / robot.performance.totalTrades) >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {robot.performance.totalTrades > 0 
                      ? `$${(robot.performance.profit / robot.performance.totalTrades).toFixed(2)}`
                      : '$0.00'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bot Token Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Bot Token for TradingView
              </h3>
              <button
                onClick={() => setShowBotToken(!showBotToken)}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                {showBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-sm">{showBotToken ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            
            <p className="text-blue-700 text-sm mb-3">
              Use this unique token in your TradingView webhook payload to target this specific robot.
            </p>

            {showBotToken && (
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-white border border-blue-300 rounded-lg p-3 font-mono text-sm text-gray-800 break-all">
                  {robot.botToken}
                </div>
                <button
                  onClick={() => handleCopy(robot.botToken, 'Bot Token')}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copiedItems.has('Bot Token') ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedItems.has('Bot Token') ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggleRobot}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  robot.isActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {robot.isActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Deactivate Robot</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Activate Robot</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Edit Settings</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleOpenDeleteModal}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Robot</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Edit Mode Notice */}
          {isEditing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Edit Mode:</strong> Robot editing functionality will be available in the next update. 
                For now, you can create a new robot with different settings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start space-x-4 mb-4">
              <div className="bg-red-100 p-3 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Robot</h3>
                <p className="text-gray-600 mt-1">
                  Are you sure you want to delete <span className="font-medium">{robot.name}</span>?
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Warning</p>
                  <p className="text-red-700 text-sm mt-1">
                    Deleting this robot will permanently remove it from your account. All trades associated with this robot will be closed, and any active positions may be affected.
                  </p>
                  <p className="text-red-700 text-sm mt-2">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRobot}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Robot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};