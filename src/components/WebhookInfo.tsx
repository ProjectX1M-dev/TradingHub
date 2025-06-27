import React, { useState, useEffect } from 'react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { useTradingStore } from '../stores/tradingStore';
import { Webhook, Copy, Check, ExternalLink, Code, User, AlertTriangle, Bot } from 'lucide-react';
import toast from 'react-hot-toast';

export const WebhookInfo: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [userIdCopied, setUserIdCopied] = useState(false);
  const [showPayloadExample, setShowPayloadExample] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { robots } = useTradingStore();

  const webhookUrl = `${supabaseUrl}/functions/v1/tradingview-webhook`;

  useEffect(() => {
    // Get the current user's ID
    const getCurrentUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (session?.user?.id) {
          setCurrentUserId(session.user.id);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };

    getCurrentUser();
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success('Webhook URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const handleCopyUserId = async () => {
    if (!currentUserId) {
      toast.error('User ID not available');
      return;
    }

    try {
      await navigator.clipboard.writeText(currentUserId);
      setUserIdCopied(true);
      toast.success('User ID copied to clipboard');
      setTimeout(() => setUserIdCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy User ID');
    }
  };

  // Example with bot token for targeted robot
  const botTokenExample = robots.length > 0 ? {
    symbol: "EURUSD",
    action: "BUY",
    volume: 0.1,
    price: "{{close}}", // Use TradingView's dynamic price variable
    stopLoss: 1.0800,
    takeProfit: 1.0900,
    timestamp: "{{time}}",
    strategy: "Your Strategy Name",
    botToken: robots[0].botToken, // Use first robot's token
    ...(currentUserId && { userId: currentUserId })
  } : null;

  // Example without bot token (uses any active robot)
  const generalExample = {
    symbol: "EURUSD",
    action: "BUY",
    volume: 0.1,
    price: "{{close}}", // Use TradingView's dynamic price variable
    stopLoss: 1.0800,
    takeProfit: 1.0900,
    timestamp: "{{time}}",
    strategy: "Your Strategy Name",
    ...(currentUserId && { userId: currentUserId })
  };

  const closeExamplePayload = {
    symbol: "EURUSD",
    action: "CLOSE",
    price: "{{close}}", // Use TradingView's dynamic price variable
    timestamp: "{{time}}",
    strategy: "Close All EURUSD",
    ...(currentUserId && { userId: currentUserId })
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Webhook className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">TradingView Webhook</h2>
            <p className="text-sm text-gray-500">Configure your TradingView alerts for automatic signal execution</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook URL
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm text-gray-800 break-all">
              {webhookUrl}
            </div>
            <button
              onClick={handleCopyUrl}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* User ID Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <User className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-800 text-sm font-medium mb-2">Your User ID (Required)</p>
              <p className="text-yellow-700 text-sm mb-3">
                You must include this User ID in your TradingView JSON payload for signals to appear in your dashboard and for automatic execution.
              </p>
              
              {currentUserId ? (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-white border border-yellow-300 rounded-lg p-2 font-mono text-sm text-gray-800 break-all">
                    {currentUserId}
                  </div>
                  <button
                    onClick={handleCopyUserId}
                    className="flex items-center space-x-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    {userIdCopied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{userIdCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-yellow-300 rounded-lg p-2 text-sm text-gray-500">
                  Loading user ID...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bot Token Targeting */}
        {robots.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Bot className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-800 text-sm font-medium mb-2">Bot Token Targeting (Optional)</p>
                <p className="text-blue-700 text-sm mb-3">
                  Include a specific robot's <code className="bg-blue-100 px-1 rounded">botToken</code> in your webhook payload to target that robot specifically. 
                  Without a botToken, any active robot matching the symbol will execute the signal.
                </p>
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Your Active Robots:</p>
                  <ul className="mt-1 space-y-1">
                    {robots.filter(r => r.isActive).map(robot => (
                      <li key={robot.id} className="flex items-center space-x-2">
                        <span>• {robot.name}</span>
                        <span className="text-blue-600">({robot.symbol || 'All Symbols'})</span>
                        <code className="bg-blue-100 px-1 rounded text-xs">{robot.botToken.substring(0, 12)}...</code>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Automatic Execution Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 text-sm font-medium mb-2">Automatic Execution</p>
              <p className="text-green-700 text-sm">
                When you have active trading robots and your MT5 account is connected, signals will be automatically executed. 
                The system will use your robot's settings for volume, stop loss, and take profit calculations.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Setup Instructions</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Create and activate trading robots</li>
              <li>Open your TradingView alert</li>
              <li>Set "Webhook URL" to the URL above</li>
              <li><strong>Include your User ID in the JSON payload</strong></li>
              <li>Optionally include botToken for specific robot targeting</li>
              <li>Configure the JSON payload (see examples below)</li>
              <li>Test your alert</li>
            </ol>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Supported Actions</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• <strong>BUY</strong> - Open long position (auto-executed if robot active)</li>
              <li>• <strong>SELL</strong> - Open short position (auto-executed if robot active)</li>
              <li>• <strong>CLOSE</strong> - Close all positions for symbol</li>
            </ul>
          </div>
        </div>

        <div>
          <button
            onClick={() => setShowPayloadExample(!showPayloadExample)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Code className="w-4 h-4" />
            <span>{showPayloadExample ? 'Hide' : 'Show'} JSON Payload Examples</span>
          </button>

          {showPayloadExample && (
            <div className="mt-4 space-y-4">
              {/* Bot Token Targeting Example */}
              {botTokenExample && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Targeted Robot Signal (with botToken):</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm font-mono">
                      {JSON.stringify(botTokenExample, null, 2)}
                    </pre>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    This will target the specific robot with the provided botToken.
                  </p>
                </div>
              )}

              {/* General Example */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">General Signal (any active robot):</h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono">
                    {JSON.stringify(generalExample, null, 2)}
                  </pre>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This will use any active robot that matches the symbol (or all-symbol robots).
                </p>
              </div>

              {/* CLOSE Example */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">CLOSE Signal Example:</h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono">
                    {JSON.stringify(closeExamplePayload, null, 2)}
                  </pre>
                </div>
              </div>
              
              {currentUserId && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    <strong>✓ Your User ID is included in these examples.</strong> Copy these exact JSON structures and paste them into your TradingView alert message.
                  </p>
                </div>
              )}

              {/* Enhanced Features */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Enhanced Features:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Bot Token Targeting:</strong> Use botToken to target specific robots</li>
                  <li>• <strong>Symbol Normalization:</strong> Automatically handles symbol variations (e.g., EURUSD.raw → EURUSD)</li>
                  <li>• <strong>Market Price Fallback:</strong> If no price provided, system fetches current market price</li>
                  <li>• <strong>Robot Priority:</strong> Symbol-specific robots take priority over "All Symbols" robots</li>
                  <li>• <strong>Pre-calculated SL/TP:</strong> Include exact SL/TP prices in your webhook</li>
                  <li>• <strong>Volume Control:</strong> Respects robot's maximum lot size settings</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExternalLink className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 text-sm font-medium">Important: User ID Required</p>
              <p className="text-red-700 text-sm mt-1">
                Without the <code className="bg-red-100 px-1 rounded">userId</code> field in your JSON payload, 
                signals will not appear in your dashboard and automatic execution will not work. Make sure to copy your User ID from above and 
                include it in every TradingView alert.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};