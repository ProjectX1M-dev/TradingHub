import React, { useState } from 'react';
import { X, Copy, Check, Bot, ExternalLink, Zap, BookOpen } from 'lucide-react';
import { Robot } from '../types/mt5';
import { formatPrice, calculateSLTP } from '../utils/tradingUtils';
import toast from 'react-hot-toast';

interface RobotSetupCompletionModalProps {
  robot: Robot;
  userId: string;
  webhookUrl: string;
  onClose: () => void;
}

export const RobotSetupCompletionModal: React.FC<RobotSetupCompletionModalProps> = ({
  robot,
  userId,
  webhookUrl,
  onClose
}) => {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [showTutorials, setShowTutorials] = useState(false);

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

  // Generate dynamic webhook payloads with calculated SL/TP using the new utility
  const buyPrice = robot.symbol?.includes('JPY') ? 150.25 : 
                   robot.symbol?.includes('XAU') ? 2050.50 : 1.0850;
  const buySLTP = calculateSLTP(buyPrice, 'BUY', robot.symbol || 'EURUSD', robot.stopLoss, robot.takeProfit);

  // Simple JSON payload without SL/TP - will use robot's settings automatically
  const dynamicSLTPPayload = {
    symbol: robot.symbol || "EURUSD",
    action: "SELL",
    volume: robot.maxLotSize,
    timestamp: "{{time}}",
    strategy: robot.strategy,
    userId: userId,
    botToken: robot.botToken
  };

  // Enhanced targeted webhook payload with dynamic SL/TP
  const targetedWebhookPayload = {
    symbol: robot.symbol || "EURUSD",
    action: "BUY",
    volume: robot.maxLotSize,
    stopLoss: buySLTP.stopLoss,
    takeProfit: buySLTP.takeProfit,
    timestamp: "{{time}}",
    strategy: robot.strategy,
    userId: userId,
    botToken: robot.botToken
  };

  // Close action payload for all positions of a symbol
  const closeExamplePayload = {
    symbol: robot.symbol || "EURUSD",
    action: "CLOSE",
    timestamp: "{{time}}",
    strategy: `Close ${robot.symbol || "EURUSD"} positions`,
    userId: userId,
    botToken: robot.botToken
  };

  // Close action payload for a specific position by ticket
  const closeSpecificPositionPayload = {
    symbol: robot.symbol || "EURUSD",
    action: "CLOSE",
    timestamp: "{{time}}",
    strategy: `Close specific position`,
    userId: userId,
    botToken: robot.botToken,
    ticket: 12345678 // Example ticket number - user will replace with actual ticket
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Bot className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">🎉 Robot Created Successfully!</h2>
                <p className="text-sm text-gray-500">Your trading robot is ready with enhanced features</p>
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

        <div className="p-6 space-y-6">
          {/* Robot Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Robot Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700"><strong>Name:</strong> {robot.name}</p>
                <p className="text-blue-700"><strong>Symbol:</strong> {robot.symbol}</p>
                <p className="text-blue-700"><strong>Strategy:</strong> {robot.strategy}</p>
                <p className="text-blue-700"><strong>Risk Level:</strong> {robot.riskLevel}</p>
              </div>
              <div>
                <p className="text-blue-700"><strong>Max Lot Size:</strong> {robot.maxLotSize}</p>
                <p className="text-blue-700"><strong>Stop Loss:</strong> {robot.stopLoss} pips</p>
                <p className="text-blue-700"><strong>Take Profit:</strong> {robot.takeProfit} pips</p>
                <p className="text-blue-700"><strong>Status:</strong> {robot.isActive ? '🟢 Active' : '🔴 Inactive'}</p>
              </div>
            </div>
          </div>

          {/* Quick Setup - Main Focus */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-600" />
              🚀 Ready to Use - Copy This JSON
            </h3>
            
            <p className="text-gray-700 text-sm mb-4">
              Copy this JSON payload and paste it into your TradingView alert message. That's it!
            </p>

            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm font-mono">
                {JSON.stringify(dynamicSLTPPayload, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                ✅ <strong>Auto SL/TP:</strong> Robot will use its configured {robot.stopLoss}/{robot.takeProfit} pip settings
              </p>
              <button
                onClick={() => handleCopy(JSON.stringify(dynamicSLTPPayload, null, 2), 'Quick Setup JSON')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {copiedItems.has('Quick Setup JSON') ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedItems.has('Quick Setup JSON') ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          {/* Webhook URL */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">🔗 TradingView Webhook URL</h3>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-white border border-purple-300 rounded-lg p-3 font-mono text-sm text-gray-800 break-all">
                {webhookUrl}
              </div>
              <button
                onClick={() => handleCopy(webhookUrl, 'Webhook URL')}
                className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {copiedItems.has('Webhook URL') ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedItems.has('Webhook URL') ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => setShowTutorials(!showTutorials)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>{showTutorials ? 'Hide' : 'Show'} Advanced Options & Tutorials</span>
            </button>

            {showTutorials && (
              <div className="mt-6 space-y-6">
                {/* Bot Token */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-yellow-900 font-medium mb-2">🤖 Bot Token (Advanced)</h4>
                  <p className="text-yellow-700 text-sm mb-3">
                    For targeting this specific robot in complex setups
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white border border-yellow-300 rounded-lg p-2 font-mono text-xs text-gray-800 break-all">
                      {robot.botToken}
                    </div>
                    <button
                      onClick={() => handleCopy(robot.botToken, 'Bot Token')}
                      className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
                    >
                      {copiedItems.has('Bot Token') ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* BUY Example with SL/TP */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📊 BUY Example with Pre-calculated SL/TP</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm font-mono">
                      {JSON.stringify(targetedWebhookPayload, null, 2)}
                    </pre>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-gray-600">
                      Pre-calculated SL/TP: {formatPrice(buySLTP.stopLoss, robot.symbol || 'EURUSD')} / {formatPrice(buySLTP.takeProfit, robot.symbol || 'EURUSD')}
                    </p>
                    <button
                      onClick={() => handleCopy(JSON.stringify(targetedWebhookPayload, null, 2), 'BUY Example')}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      {copiedItems.has('BUY Example') ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* CLOSE All Positions Example */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📊 CLOSE All Positions Example</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm font-mono">
                      {JSON.stringify(closeExamplePayload, null, 2)}
                    </pre>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-gray-600">
                      Closes all positions for the specified symbol
                    </p>
                    <button
                      onClick={() => handleCopy(JSON.stringify(closeExamplePayload, null, 2), 'CLOSE Example')}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      {copiedItems.has('CLOSE Example') ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* CLOSE Specific Position Example */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📊 CLOSE Specific Position Example</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm font-mono">
                      {JSON.stringify(closeSpecificPositionPayload, null, 2)}
                    </pre>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-gray-600">
                      Closes only the position with the specified ticket number
                    </p>
                    <button
                      onClick={() => handleCopy(JSON.stringify(closeSpecificPositionPayload, null, 2), 'CLOSE Specific Example')}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      {copiedItems.has('CLOSE Specific Example') ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Tutorial Links */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-blue-800 font-medium mb-2">📚 Tutorials & Documentation</h4>
                  <div className="space-y-2 text-sm">
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>How to set up TradingView alerts (Coming Soon)</span>
                    </button>
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>Advanced robot configuration (Coming Soon)</span>
                    </button>
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>Risk management best practices (Coming Soon)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Test */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-green-800 font-medium mb-2">🧪 Quick Test</h4>
            <p className="text-green-700 text-sm mb-3">
              Create a TradingView alert with the JSON above to test your setup. 
              The system will use your robot's settings for Stop Loss and Take Profit.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <ExternalLink className="w-4 h-4 text-green-600" />
              <a 
                href="https://www.tradingview.com/chart/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 underline"
              >
                Open TradingView to create your first alert
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => handleCopy(JSON.stringify(dynamicSLTPPayload, null, 2), 'Final JSON')}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📋 Copy JSON for TradingView
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};