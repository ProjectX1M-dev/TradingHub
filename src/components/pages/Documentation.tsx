import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronLeft, Search, Book, Code, FileText, ArrowRight, ChevronDown, ChevronUp, Users } from 'lucide-react';

export const Documentation: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'getting-started': true,
    'broker-connection': false,
    'trading-robots': false,
    'tradingview-webhooks': false,
    'vps-hosting': false,
    'risk-management': false
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Filter documentation sections based on search term
  const filterSections = (sections: any[]) => {
    if (!searchTerm) return sections;
    
    return sections.filter(section => 
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Documentation sections
  const documentationSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="w-5 h-5 text-blue-600" />,
      content: `
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Welcome to Trading Hub</h3>
        <p class="mb-4">This guide will help you get started with our platform and set up your first trading robot.</p>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Quick Start Steps</h4>
        <ol class="list-decimal pl-5 mb-6 space-y-2">
          <li>Create an account or sign in</li>
          <li>Connect your MT5 broker</li>
          <li>Choose between Algorithmic Trading or Live Trading</li>
          <li>Create your first trading robot</li>
          <li>Set up TradingView webhooks (optional)</li>
          <li>Monitor your trades and performance</li>
        </ol>
        
        <p class="mb-4">The platform offers two main modes:</p>
        <ul class="list-disc pl-5 mb-6 space-y-2">
          <li><strong>Algorithmic Trading</strong> - Create and manage automated trading robots</li>
          <li><strong>Live Trading</strong> - Execute manual trades with advanced tools</li>
        </ul>
        
        <p>Each section of this documentation covers a specific aspect of the platform in detail.</p>
      `
    },
    {
      id: 'broker-connection',
      title: 'Broker Connection',
      icon: <FileText className="w-5 h-5 text-green-600" />,
      content: `
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Connecting Your MT5 Broker</h3>
        <p class="mb-4">To use the platform, you need to connect your MetaTrader 5 (MT5) broker account.</p>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Connection Steps</h4>
        <ol class="list-decimal pl-5 mb-6 space-y-2">
          <li>Go to the Broker Setup page after login</li>
          <li>Select your account type (Live or Prop)</li>
          <li>Enter your MT5 account number</li>
          <li>Enter your MT5 password</li>
          <li>Select your broker's server from the dropdown</li>
          <li>Click "Connect Broker"</li>
        </ol>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 class="font-semibold text-yellow-800 mb-2">Important Notes</h4>
          <ul class="list-disc pl-5 space-y-1 text-yellow-700">
            <li>Your MT5 credentials are securely encrypted</li>
            <li>We never store your password in plain text</li>
            <li>You can connect multiple MT5 accounts</li>
            <li>Prop accounts may use symbols with .raw extension</li>
          </ul>
        </div>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Supported Brokers</h4>
        <p class="mb-2">We support a wide range of MT5 brokers, including:</p>
        <ul class="list-disc pl-5 mb-6 space-y-1">
          <li>RoboForex-ECN</li>
          <li>ACGMarkets-Main</li>
          <li>Alpari-MT5-Demo</li>
          <li>FXCM-USDDemo01</li>
          <li>ICMarkets-Demo02</li>
          <li>And many others...</li>
        </ul>
        
        <p>If your broker isn't listed, contact our support team for assistance.</p>
      `
    },
    {
      id: 'trading-robots',
      title: 'Trading Robots',
      icon: <FileText className="w-5 h-5 text-purple-600" />,
      content: `
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Creating and Managing Trading Robots</h3>
        <p class="mb-4">Trading robots automate your trading strategies based on predefined rules.</p>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Creating a Robot</h4>
        <ol class="list-decimal pl-5 mb-6 space-y-2">
          <li>Go to the Algorithmic Trading dashboard</li>
          <li>Click "Create Robot"</li>
          <li>Follow the 3-step wizard:
            <ul class="list-disc pl-5 mt-2 space-y-1">
              <li>Basic Info - Name, symbol, strategy</li>
              <li>Risk Settings - Risk level, lot size, stop loss, take profit</li>
              <li>Review - Confirm and create</li>
            </ul>
          </li>
          <li>Activate your robot to start trading</li>
        </ol>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Available Strategies</h4>
        <ul class="list-disc pl-5 mb-6 space-y-2">
          <li><strong>Scalping</strong> - Quick trades capturing small price movements</li>
          <li><strong>Trend Following</strong> - Follow market trends for sustained moves</li>
          <li><strong>Mean Reversion</strong> - Trade when price deviates from average</li>
          <li><strong>Breakout</strong> - Trade when price breaks key levels</li>
          <li><strong>Grid Trading</strong> - Place orders at regular intervals</li>
        </ul>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Risk Levels</h4>
        <ul class="list-disc pl-5 mb-6 space-y-2">
          <li><strong>LOW</strong> - Conservative approach with smaller position sizes</li>
          <li><strong>MEDIUM</strong> - Balanced approach with moderate risk</li>
          <li><strong>HIGH</strong> - Aggressive approach with larger position sizes</li>
        </ul>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Managing Robots</h4>
        <p class="mb-2">You can manage your robots from the dashboard:</p>
        <ul class="list-disc pl-5 mb-6 space-y-1">
          <li>Activate/deactivate robots</li>
          <li>View performance metrics</li>
          <li>Edit robot settings</li>
          <li>Delete robots</li>
        </ul>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-semibold text-blue-800 mb-2">Pro Tip</h4>
          <p class="text-blue-700">
            Create multiple robots with different strategies and risk levels to diversify your trading approach.
          </p>
        </div>
      `
    },
    {
      id: 'tradingview-webhooks',
      title: 'TradingView Webhooks',
      icon: <FileText className="w-5 h-5 text-orange-600" />,
      content: `
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Setting Up TradingView Webhooks</h3>
        <p class="mb-4">TradingView webhooks allow you to automatically execute trades based on TradingView alerts.</p>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Setup Process</h4>
        <ol class="list-decimal pl-5 mb-6 space-y-2">
          <li>Go to the Webhooks tab in the dashboard</li>
          <li>Copy your unique webhook URL</li>
          <li>Copy your User ID (critical for authentication)</li>
          <li>In TradingView, create an alert:
            <ul class="list-disc pl-5 mt-2 space-y-1">
              <li>Select "Webhook" as the notification</li>
              <li>Paste the webhook URL</li>
              <li>Create a JSON payload with required fields</li>
            </ul>
          </li>
          <li>Save the alert</li>
        </ol>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">JSON Payload Format</h4>
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 relative">
          <pre class="overflow-x-auto text-sm">
{
  "symbol": "EURUSD",
  "action": "BUY",
  "userId": "your-user-id",
  "volume": 0.01,
  "stopLoss": 1.0800,
  "takeProfit": 1.0900,
  "timestamp": "{{time}}",
  "strategy": "Your Strategy Name",
  "botToken": "your-bot-token"
}
          </pre>
        </div>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Required Fields</h4>
        <ul class="list-disc pl-5 mb-6 space-y-1">
          <li><strong>symbol</strong> - Trading pair (e.g., "EURUSD")</li>
          <li><strong>action</strong> - "BUY", "SELL", or "CLOSE"</li>
          <li><strong>userId</strong> - Your unique ID from the platform</li>
        </ul>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Optional Fields</h4>
        <ul class="list-disc pl-5 mb-6 space-y-1">
          <li><strong>volume</strong> - Trade size in lots (defaults to robot's max lot size)</li>
          <li><strong>stopLoss/takeProfit</strong> - Price levels (if omitted, robot settings are used)</li>
          <li><strong>timestamp</strong> - Use {{time}} for TradingView's dynamic time</li>
          <li><strong>strategy</strong> - Description of the signal</li>
          <li><strong>botToken</strong> - Target a specific robot (if omitted, any matching robot will execute)</li>
        </ul>
        
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 class="font-semibold text-red-800 mb-2">Important</h4>
          <p class="text-red-700">
            The <strong>userId</strong> field is required in every webhook payload. Without it, signals will not be processed.
          </p>
        </div>
      `
    },
    {
      id: 'vps-hosting',
      title: 'VPS Hosting',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      content: `
        <h3 class="text-xl font-semibold text-gray-900 mb-4">VPS Hosting for 24/7 Trading</h3>
        <p class="mb-4">VPS (Virtual Private Server) hosting allows your trading robots to run continuously, even when your computer is off.</p>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Benefits of VPS Hosting</h4>
        <ul class="list-disc pl-5 mb-6 space-y-2">
          <li><strong>24/7 Operation</strong> - Your robots trade continuously without interruption</li>
          <li><strong>Reduced Latency</strong> - Servers located close to broker data centers for faster execution</li>
          <li><strong>Reliability</strong> - Enterprise-grade infrastructure with 99.9% uptime</li>
          <li><strong>Resource Monitoring</strong> - Track CPU, memory, and network usage</li>
          <li><strong>Advanced Features</strong> - Access to trailing stops and other premium features</li>
        </ul>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Available Plans</h4>
        <div class="overflow-x-auto mb-6">
          <table class="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg overflow-hidden">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Robots</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-300">
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Basic</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10</td>
                <td class="px-6 py-4 text-sm text-gray-500">24/7 trading, basic trailing stops</td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Pro</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">250</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">50</td>
                <td class="px-6 py-4 text-sm text-gray-500">Advanced trailing stops, priority execution</td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Enterprise</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">500</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Unlimited</td>
                <td class="px-6 py-4 text-sm text-gray-500">Custom algorithms, API access, white label options</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">How to Purchase</h4>
        <ol class="list-decimal pl-5 mb-6 space-y-2">
          <li>Go to the VPS Hosting page</li>
          <li>Select your desired plan</li>
          <li>Purchase using your token balance</li>
          <li>Your robots will be automatically deployed to the VPS</li>
          <li>Monitor performance from your dashboard</li>
        </ol>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-semibold text-blue-800 mb-2">Pro Tip</h4>
          <p class="text-blue-700">
            VPS hosting is especially valuable for strategies that require quick reaction times or 24/7 monitoring of the markets.
          </p>
        </div>
      `
    },
    {
      id: 'risk-management',
      title: 'Risk Management',
      icon: <FileText className="w-5 h-5 text-red-600" />,
      content: `
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Risk Management Tools</h3>
        <p class="mb-4">Effective risk management is crucial for long-term trading success. Our platform offers several tools to help you manage risk.</p>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Position Sizing</h4>
        <p class="mb-4">The platform can automatically calculate optimal position sizes based on your risk parameters:</p>
        <ol class="list-decimal pl-5 mb-6 space-y-2">
          <li>In the trading panel, set your stop loss level</li>
          <li>Click the calculator button next to volume</li>
          <li>The system will calculate the optimal lot size based on:
            <ul class="list-disc pl-5 mt-2 space-y-1">
              <li>Your account balance</li>
              <li>The currency pair's pip value</li>
              <li>The stop loss distance</li>
              <li>Your risk percentage (default 2%)</li>
            </ul>
          </li>
        </ol>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Risk Manager Settings</h4>
        <p class="mb-2">Configure these settings in the Risk Manager tab:</p>
        <ul class="list-disc pl-5 mb-6 space-y-2">
          <li><strong>Max Risk Per Trade</strong> - Limit risk for individual trades (1-2% recommended)</li>
          <li><strong>Max Daily Loss</strong> - Set a maximum daily loss limit (5-10% recommended)</li>
          <li><strong>Max Drawdown</strong> - Set a maximum account drawdown limit</li>
          <li><strong>Max Open Positions</strong> - Limit the number of simultaneous open positions</li>
          <li><strong>Max Lot Size</strong> - Set a maximum lot size for all trades</li>
        </ul>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Risk Analysis</h4>
        <p class="mb-2">The platform provides real-time risk analysis:</p>
        <ul class="list-disc pl-5 mb-6 space-y-1">
          <li>Current risk exposure by position</li>
          <li>Portfolio-level risk metrics</li>
          <li>Correlation between open positions</li>
          <li>Risk-adjusted performance metrics</li>
        </ul>
        
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Best Practices</h4>
        <ul class="list-disc pl-5 mb-6 space-y-2">
          <li><strong>The 2% Rule</strong> - Never risk more than 2% of your account on a single trade</li>
          <li><strong>Diversification</strong> - Trade multiple symbols and strategies to spread risk</li>
          <li><strong>Correlation Awareness</strong> - Avoid highly correlated positions</li>
          <li><strong>Always Use Stop Losses</strong> - Never trade without downside protection</li>
          <li><strong>Regular Review</strong> - Analyze your trading performance weekly</li>
        </ul>
        
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 class="font-semibold text-red-800 mb-2">Important</h4>
          <p class="text-red-700">
            Remember that all trading involves risk. No risk management system can eliminate risk entirely. Never trade with money you cannot afford to lose.
          </p>
        </div>
      `
    }
  ];

  const filteredSections = filterSections(documentationSections);

  return (
    <div className="min-h-screen bg-white">
      {/* Simple header with just logo and back button */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Trading Hub</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive guides to help you get the most out of the Trading Hub platform
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h3>
              <nav className="space-y-1">
                {documentationSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      const element = document.getElementById(section.id);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                      setExpandedSections(prev => ({
                        ...prev,
                        [section.id]: true
                      }));
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      expandedSections[section.id]
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {section.icon}
                    <span>{section.title}</span>
                  </button>
                ))}
              </nav>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Resources</h4>
                <div className="space-y-3">
                  <a 
                    href="/api-reference"
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Code className="w-4 h-4 text-gray-500" />
                    <span>API Reference</span>
                  </a>
                  <a 
                    href="/community"
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>Community Forum</span>
                  </a>
                  <a 
                    href="/blog"
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Book className="w-4 h-4 text-gray-500" />
                    <span>Blog Tutorials</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredSections.length === 0 ? (
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 text-center">
                <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any documentation matching "{searchTerm}"
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredSections.map((section) => (
                  <div 
                    key={section.id} 
                    id={section.id}
                    className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <div 
                      className="p-6 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {section.icon}
                        <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                      </div>
                      {expandedSections[section.id] ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    {expandedSections[section.id] && (
                      <div className="p-6">
                        <div 
                          className="prose prose-lg max-w-none"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Need More Help */}
            <div className="mt-12 bg-blue-50 rounded-xl p-8 border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Need More Help?</h3>
              <p className="text-gray-600 mb-6">
                If you couldn't find what you're looking for in our documentation, there are several ways to get additional help:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Support</h4>
                  <p className="text-gray-600 mb-4">
                    Our support team is available to help you with any questions or issues.
                  </p>
                  <a 
                    href="/contact"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>Contact Support</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Join the Community</h4>
                  <p className="text-gray-600 mb-4">
                    Connect with other traders and get help from the community.
                  </p>
                  <a 
                    href="/community"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>Visit Community Forum</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Trading Hub</h3>
              <p className="text-gray-400 text-sm">
                Next-generation algorithmic trading platform for professional traders.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/features/algorithmic-trading" className="hover:text-white transition-colors">Algorithmic Trading</a></li>
                <li><a href="/features/risk-management" className="hover:text-white transition-colors">Risk Management</a></li>
                <li><a href="/features/real-time-signals" className="hover:text-white transition-colors">Real-time Signals</a></li>
                <li><a href="/features/vps-hosting" className="hover:text-white transition-colors">VPS Hosting</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/documentation" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="/api-reference" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="/community" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/about-us" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Trading Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Documentation;