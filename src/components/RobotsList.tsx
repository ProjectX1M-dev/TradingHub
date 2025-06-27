import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../stores/tradingStore';
import { Robot } from '../types/mt5';
import { Bot, Plus, Play, Pause, Trash2, Eye, Globe, Target, DollarSign, Award, Activity, TrendingUp, BarChart3, Clock, Zap, Grid3X3, AlertTriangle } from 'lucide-react';
import { CreateRobotModal } from './CreateRobotModal';
import { RobotDetailModal } from './RobotDetailModal';
import toast from 'react-hot-toast';

export const RobotsList: React.FC = () => {
  const { robots, toggleRobot, deleteRobot, fetchRobots } = useTradingStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [robotToDelete, setRobotToDelete] = useState<Robot | null>(null);

  // Fetch robots on component mount and set up refresh interval
  useEffect(() => {
    // Initial fetch
    fetchRobots();
    
    // Set up interval to refresh robot data every 2 seconds for real-time updates
    // This is a more sustainable rate than 50ms while still providing near real-time data
    const interval = setInterval(() => {
      fetchRobots();
    }, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [fetchRobots]);

  // Listen for the custom event from Dashboard
  useEffect(() => {
    const handleOpenCreateModal = () => {
      setShowCreateModal(true);
    };

    window.addEventListener('openCreateRobotModal', handleOpenCreateModal);
    return () => {
      window.removeEventListener('openCreateRobotModal', handleOpenCreateModal);
    };
  }, []);

  const getRiskColor = (risk: Robot['riskLevel']) => {
    switch (risk) {
      case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HIGH': return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const getPerformanceColor = (winRate: number) => {
    if (winRate >= 70) return 'text-emerald-600';
    if (winRate >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  // Enhanced gradient system with better shades based on profit and win rate
  const getProfitGradientClass = (profit: number, winRate: number) => {
    // For losing robots (negative profit)
    if (profit < -100) {
      return 'bg-gradient-to-br from-rose-100 to-rose-200 border-rose-300 shadow-rose-100/50';
    } else if (profit < -50) {
      return 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 shadow-rose-50/50';
    } else if (profit < -10) {
      return 'bg-gradient-to-br from-white to-rose-50 border-rose-100 shadow-rose-50/30';
    } else if (profit < 0) {
      return 'bg-gradient-to-br from-white to-rose-50/50 border-rose-50 shadow-gray-100/30';
    } 
    // For break-even robots
    else if (profit === 0) {
      return 'bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-slate-100/50';
    } 
    // For profitable robots with good win rate
    else if (profit > 0 && winRate >= 60) {
      if (profit <= 10) {
        return 'bg-gradient-to-br from-white to-emerald-50 border-emerald-50 shadow-gray-100/30';
      } else if (profit <= 50) {
        return 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-100 shadow-emerald-50/30';
      } else if (profit <= 100) {
        return 'bg-gradient-to-br from-emerald-50 to-emerald-200 border-emerald-200 shadow-emerald-50/50';
      } else {
        return 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-300 shadow-emerald-100/50';
      }
    }
    // For profitable robots with medium win rate
    else if (profit > 0 && winRate >= 40) {
      if (profit <= 50) {
        return 'bg-gradient-to-br from-white to-blue-50 border-blue-100 shadow-blue-50/30';
      } else {
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-blue-50/50';
      }
    }
    // For profitable robots with low win rate
    else {
      if (profit <= 50) {
        return 'bg-gradient-to-br from-white to-yellow-50 border-yellow-100 shadow-yellow-50/30';
      } else {
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-yellow-50/50';
      }
    }
  };

  // Compact strategy display
  const getStrategyAbbreviation = (strategy: string) => {
    const abbreviations: { [key: string]: string } = {
      'Scalping': 'SCALP',
      'Trend Following': 'TREND',
      'Mean Reversion': 'MEAN-REV',
      'Breakout': 'BREAK',
      'Grid Trading': 'GRID'
    };
    return abbreviations[strategy] || strategy.substring(0, 8).toUpperCase();
  };

  const getProfitStatus = (profit: number) => {
    if (profit < -50) {
      return { text: 'Heavy Loss', color: 'text-rose-700', bgColor: 'bg-rose-100/80' };
    } else if (profit < -10) {
      return { text: 'Drawdown', color: 'text-rose-600', bgColor: 'bg-rose-50/80' };
    } else if (profit < 0) {
      return { text: 'Small Loss', color: 'text-rose-500', bgColor: 'bg-rose-25/80' };
    } else if (profit === 0) {
      return { text: 'Break Even', color: 'text-slate-600', bgColor: 'bg-slate-100/80' };
    } else if (profit <= 10) {
      return { text: 'Small Gain', color: 'text-emerald-500', bgColor: 'bg-emerald-25/80' };
    } else if (profit <= 50) {
      return { text: 'Good Profit', color: 'text-emerald-600', bgColor: 'bg-emerald-50/80' };
    } else {
      return { text: 'Excellent', color: 'text-emerald-700', bgColor: 'bg-emerald-100/80' };
    }
  };

  const handleToggleRobot = async (robotId: string) => {
    const robot = robots.find(r => r.id === robotId);
    if (!robot) return;

    console.log(`🤖 UI: User clicked toggle for robot "${robot.name}" (currently ${robot.isActive ? 'ACTIVE' : 'INACTIVE'})`);
    
    const newState = !robot.isActive;
    const action = newState ? 'Activating' : 'Deactivating';
    toast(`${action} robot "${robot.name}"...`, { duration: 1000 });
    
    await toggleRobot(robotId);
  };

  // Handle opening the delete confirmation modal
  const handleOpenDeleteModal = (robot: Robot) => {
    setRobotToDelete(robot);
    setShowDeleteModal(true);
  };

  // Handle closing the delete confirmation modal
  const handleCloseDeleteModal = () => {
    setRobotToDelete(null);
    setShowDeleteModal(false);
  };

  // Handle confirming the robot deletion
  const handleConfirmDelete = async () => {
    if (!robotToDelete) return;
    
    try {
      await deleteRobot(robotToDelete.id);
      toast.success(`Robot "${robotToDelete.name}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting robot:', error);
      toast.error('Failed to delete robot');
    } finally {
      handleCloseDeleteModal();
    }
  };

  // Calculate overall stats
  const totalRobots = robots.length;
  const activeRobots = robots.filter(r => r.isActive).length;
  const totalTrades = robots.reduce((sum, r) => sum + r.performance.totalTrades, 0);
  const avgWinRate = totalRobots > 0 ? robots.reduce((sum, r) => sum + r.performance.winRate, 0) / totalRobots : 0;
  const totalProfit = robots.reduce((sum, r) => sum + r.performance.profit, 0);

  // Get strategy icon
  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'Scalping': return Zap;
      case 'Trend Following': return TrendingUp;
      case 'Mean Reversion': return BarChart3;
      case 'Breakout': return TrendingUp;
      case 'Grid Trading': return Grid3X3;
      default: return Activity;
    }
  };

  return (
    <>
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b-2 border-blue-500 pb-1 inline-block">
              Trading Robots
            </h2>
            {/* Removed Create Robot button since it's now in the header */}
          </div>

          {/* Enhanced Stats Overview with Better Colors */}
          {totalRobots > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Active Robots</p>
                    <p className="text-lg font-bold text-blue-800">{activeRobots}/{totalRobots}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Avg Win Rate</p>
                    <p className={`text-lg font-bold ${getPerformanceColor(avgWinRate)}`}>
                      {avgWinRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-purple-600 font-medium">Total Trades</p>
                    <p className="text-lg font-bold text-purple-800">{totalTrades}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-xs text-amber-600 font-medium">Total Profit</p>
                    <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ${totalProfit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Redesigned Robot Cards - More Compact and Better Layout */}
        <div className="p-6">
          {robots.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No trading robots created</p>
              <p className="text-sm text-gray-400 mt-2">
                Create automated trading robots to execute strategies
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Robot</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {robots.map((robot) => {
                const profitGradientClass = getProfitGradientClass(robot.performance.profit, robot.performance.winRate);
                const profitStatus = getProfitStatus(robot.performance.profit);
                const StrategyIcon = getStrategyIcon(robot.strategy);
                
                return (
                  <div 
                    key={robot.id} 
                    className={`${profitGradientClass} border-2 rounded-xl p-4 hover:shadow-xl transition-all duration-300 relative overflow-hidden group hover:scale-[1.02]`}
                  >
                    {/* Profit Status Badge - Top Right */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${profitStatus.color} ${profitStatus.bgColor} backdrop-blur-sm border border-white/20`}>
                        {profitStatus.text}
                      </div>
                    </div>

                    {/* Robot Header - Compact */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2.5 rounded-lg shadow-sm ${
                        robot.isActive 
                          ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base truncate">{robot.name}</h3>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            {robot.symbol ? (
                              <>
                                <Target className="w-3 h-3" />
                                <span className="font-medium">{robot.symbol}</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-3 h-3" />
                                <span className="font-medium">All</span>
                              </>
                            )}
                          </div>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <StrategyIcon className="w-3 h-3" />
                            <span className="font-medium">{getStrategyAbbreviation(robot.strategy)}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full border ${getRiskColor(robot.riskLevel)}`}>
                            {robot.riskLevel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Real-Time Performance Data - Prominent Display */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-3 gap-2">
                        {/* Win Rate */}
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Award className="w-3 h-3 text-amber-600 mr-1" />
                            <p className="text-xs text-gray-600 font-medium">Win Rate</p>
                          </div>
                          <p className={`text-lg font-bold ${getPerformanceColor(robot.performance.winRate)}`}>
                            {robot.performance.winRate.toFixed(1)}%
                          </p>
                        </div>
                        
                        {/* Total Trades */}
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Activity className="w-3 h-3 text-blue-600 mr-1" />
                            <p className="text-xs text-gray-600 font-medium">Trades</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            {robot.performance.totalTrades}
                          </p>
                        </div>
                        
                        {/* Max Lot Size */}
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <DollarSign className="w-3 h-3 text-purple-600 mr-1" />
                            <p className="text-xs text-gray-600 font-medium">Max Lot</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            {robot.maxLotSize}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Profit Display - Prominent */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-lg p-3 mb-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="w-3 h-3 mr-1 text-gray-600" />
                        <p className="text-xs text-gray-600 font-medium">Total Profit</p>
                      </div>
                      <p className={`text-xl font-bold ${
                        robot.performance.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        ${robot.performance.profit.toFixed(2)}
                      </p>
                      {robot.performance.totalTrades > 0 && (
                        <p className={`text-xs ${profitStatus.color} font-medium`}>
                          ${(robot.performance.profit / robot.performance.totalTrades).toFixed(2)} per trade
                        </p>
                      )}
                    </div>

                    {/* Risk Info - Compact */}
                    <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-lg p-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 text-gray-500 mr-1" />
                          <span className="text-blue-700 font-medium">SL: {robot.stopLoss}p</span>
                        </div>
                        <span className="text-blue-700 font-medium">TP: {robot.takeProfit}p</span>
                        <span className="text-blue-700 font-medium">R:R 1:{(robot.takeProfit / robot.stopLoss).toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Action Buttons - Compact */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedRobot(robot)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Details</span>
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleRobot(robot.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            robot.isActive
                              ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                              : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                          }`}
                          title={robot.isActive ? 'Deactivate Robot' : 'Activate Robot'}
                        >
                          {robot.isActive ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleOpenDeleteModal(robot)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Robot"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Status Indicator - Bottom */}
                    <div className="mt-3 pt-2 border-t border-white/30">
                      <div className="flex items-center justify-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          robot.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`}></div>
                        <span className={`text-xs font-semibold ${
                          robot.isActive ? 'text-emerald-700' : 'text-slate-500'
                        }`}>
                          {robot.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && robotToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start space-x-4 mb-4">
              <div className="bg-red-100 p-3 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Robot</h3>
                <p className="text-gray-600 mt-1">
                  Are you sure you want to delete <span className="font-medium">{robotToDelete.name}</span>?
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
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Robot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateRobotModal onClose={() => setShowCreateModal(false)} />
      )}

      {selectedRobot && (
        <RobotDetailModal 
          robot={selectedRobot} 
          onClose={() => setSelectedRobot(null)} 
        />
      )}
    </>
  );
};