import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, LogIn, ArrowRight, ChevronRight, CheckCircle, 
  BarChart3, Bot, Zap, Shield, Server, 
  Users, DollarSign, Laptop, Play, Pause,
  ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('algo');
  const [investmentAmount, setInvestmentAmount] = useState(10000);
  const [monthlyReturn, setMonthlyReturn] = useState(8);
  const videoRef = useRef<HTMLVideoElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const [priceTicker, setPriceTicker] = useState([
    { symbol: 'EURUSD', price: 1.0850, change: 0.0012, changePercent: 0.11, direction: 'up' },
    { symbol: 'GBPUSD', price: 1.2650, change: -0.0008, changePercent: -0.06, direction: 'down' },
    { symbol: 'USDJPY', price: 150.25, change: 0.15, changePercent: 0.10, direction: 'up' },
    { symbol: 'BTCUSD', price: 45000, change: -120, changePercent: -0.27, direction: 'down' },
    { symbol: 'XAUUSD', price: 2050.50, change: 5.25, changePercent: 0.26, direction: 'up' }
  ]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Calculate ROI for the investment calculator
  const calculateROI = () => {
    const monthlyReturnDecimal = monthlyReturn / 100;
    const yearlyReturn = Math.pow(1 + monthlyReturnDecimal, 12) - 1;
    const yearlyProfit = investmentAmount * yearlyReturn;
    const monthlyProfit = yearlyProfit / 12;
    
    return {
      monthly: monthlyProfit,
      yearly: yearlyProfit,
      percentage: yearlyReturn * 100
    };
  };

  const roi = calculateROI();

  useEffect(() => {
    // Auto-play video on desktop devices
    const handleVideoAutoplay = () => {
      if (videoRef.current && window.innerWidth >= 1024) {
        videoRef.current.play().catch(() => {
          // Autoplay was prevented
          console.log('Autoplay prevented');
        });
        setIsVideoPlaying(true);
      }
    };

    handleVideoAutoplay();
    window.addEventListener('resize', handleVideoAutoplay);

    return () => {
      window.removeEventListener('resize', handleVideoAutoplay);
    };
  }, []);

  // Simulate live price updates
  useEffect(() => {
    const updatePrices = () => {
      setPriceTicker(prev => prev.map(item => {
        // Generate random price movement
        const movement = (Math.random() - 0.5) * (item.symbol.includes('BTC') ? 50 : item.symbol.includes('XAU') ? 0.5 : 0.0015);
        const newPrice = item.price + movement;
        const newChange = item.change + movement;
        const newChangePercent = (newChange / newPrice) * 100;
        const newDirection = movement >= 0 ? 'up' : 'down';
        
        return {
          ...item,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          direction: newDirection
        };
      }));
    };
    
    const interval = setInterval(updatePrices, 1500);
    return () => clearInterval(interval);
  }, []);

  // Particle animation effect
  const ParticleBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-20"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
            }}
            animate={{ 
              x: [null, Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [null, Math.random() * window.innerHeight, Math.random() * window.innerHeight]
            }}
            transition={{ 
              duration: 20 + Math.random() * 30,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with Login Button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Trading Hub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-8 text-gray-400">
                <button 
                  onClick={() => scrollToSection(featuresRef)}
                  className="hover:text-white transition-colors"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection(techRef)}
                  className="hover:text-white transition-colors"
                >
                  Technology
                </button>
                <button 
                  onClick={() => scrollToSection(calculatorRef)}
                  className="hover:text-white transition-colors"
                >
                  Calculator
                </button>
                <button 
                  onClick={() => navigate('/packages')}
                  className="hover:text-white transition-colors"
                >
                  Pricing
                </button>
              </nav>
              <button
                onClick={handleLogin}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with 3D Animation */}
      <div className="relative pt-20 overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        {/* Live Price Ticker */}
        <div className="w-full overflow-hidden bg-gray-800/50 backdrop-blur-sm border-y border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide">
              <div className="flex items-center space-x-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm whitespace-nowrap">{new Date().toLocaleTimeString()}</span>
              </div>
              {priceTicker.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="font-medium whitespace-nowrap">{item.symbol}</span>
                  <span className="font-mono whitespace-nowrap">
                    {item.symbol.includes('JPY') ? item.price.toFixed(3) : 
                     item.symbol.includes('BTC') ? item.price.toFixed(1) : 
                     item.symbol.includes('XAU') ? item.price.toFixed(2) : 
                     item.price.toFixed(5)}
                  </span>
                  <span className={`flex items-center whitespace-nowrap ${
                    item.direction === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {item.direction === 'up' ? 
                      <ArrowUpRight className="w-3 h-3 mr-1" /> : 
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    }
                    {item.changePercent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <ParticleBackground />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Next-Gen <span className="text-blue-500">Algorithmic</span> Trading Platform
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Automate your trading strategies with AI-powered algorithms, real-time signals, and professional risk management tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetStarted}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg flex items-center justify-center"
                >
                  Start Trading Now <ArrowRight className="ml-2 w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection(featuresRef)}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  Explore Features <ChevronRight className="ml-2 w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-800">
                {/* TradingView-style Chart Visualization */}
                <div className="w-full h-[400px] relative">
                  {/* Chart Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`h-${i}`} className="w-full h-px bg-gray-700/50" style={{ top: `${(i+1) * 16.66}%`, position: 'absolute' }}></div>
                    ))}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`v-${i}`} className="h-full w-px bg-gray-700/50" style={{ left: `${(i+1) * 16.66}%`, position: 'absolute' }}></div>
                    ))}
                  </div>
                  
                  {/* Simulated Chart Line */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Main chart line */}
                    <path 
                      d="M0,300 C50,280 100,320 150,280 C200,240 250,260 300,220 C350,180 400,200 450,150 C500,100 550,120 600,80 C650,40 700,60 750,100 C800,140 850,120 900,160 C950,200 1000,180 1000,180 L1000,400 L0,400 Z" 
                      fill="url(#chartGradient)" 
                      stroke="#3b82f6" 
                      strokeWidth="2"
                    />
                    {/* Secondary chart line */}
                    <path 
                      d="M0,320 C50,300 100,340 150,300 C200,260 250,280 300,240 C350,200 400,220 450,170 C500,120 550,140 600,100 C650,60 700,80 750,120 C800,160 850,140 900,180 C950,220 1000,200 1000,200" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="2"
                      opacity="0.7"
                    />
                  </svg>
                  
                  {/* Chart Overlay Elements */}
                  <div className="absolute top-4 left-4 flex items-center space-x-3">
                    <div className="bg-blue-500/20 backdrop-blur-sm px-3 py-1 rounded text-blue-400 text-sm font-medium">
                      EURUSD
                    </div>
                    <div className="bg-gray-800/80 backdrop-blur-sm px-3 py-1 rounded text-gray-300 text-sm">
                      1D
                    </div>
                  </div>
                  
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <div className="bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded text-green-400 text-xs">
                      BUY
                    </div>
                    <div className="bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded text-red-400 text-xs">
                      SELL
                    </div>
                  </div>
                  
                  {/* Price Labels */}
                  <div className="absolute right-3 top-1/4 bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded text-gray-300 text-xs">
                    1.0850
                  </div>
                  <div className="absolute right-3 top-2/4 bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded text-gray-300 text-xs">
                    1.0825
                  </div>
                  <div className="absolute right-3 top-3/4 bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded text-gray-300 text-xs">
                    1.0800
                  </div>
                  
                  {/* Time Labels */}
                  <div className="absolute bottom-3 left-0 w-full flex justify-between px-4">
                    <span className="text-gray-400 text-xs">09:30</span>
                    <span className="text-gray-400 text-xs">12:00</span>
                    <span className="text-gray-400 text-xs">15:30</span>
                    <span className="text-gray-400 text-xs">19:00</span>
                  </div>
                  
                  {/* Video Controls */}
                  <button 
                    onClick={handlePlayPause}
                    className="absolute bottom-4 right-4 z-10 bg-gray-700/80 backdrop-blur-sm p-3 rounded-full hover:bg-gray-600 transition-colors"
                    aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isVideoPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
                
                {/* Chart Bottom Panel */}
                <div className="bg-gray-800 border-t border-gray-700 p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Open</p>
                      <p className="text-sm font-mono font-medium text-white">1.0825</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">High</p>
                      <p className="text-sm font-mono font-medium text-green-400">1.0852</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Low</p>
                      <p className="text-sm font-mono font-medium text-red-400">1.0798</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -bottom-6 -left-6 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Active Traders</p>
                    <p className="text-lg font-bold text-white">10,000+</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute -top-6 -right-6 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Daily Volume</p>
                    <p className="text-lg font-bold text-white">$2.5M+</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        {/* Market Stats Bar */}
        <div className="w-full bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500/20 p-2 rounded-full">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Market Signals</p>
                  <p className="text-lg font-bold text-white">247 Today</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-green-500/20 p-2 rounded-full">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Win Rate</p>
                  <p className="text-lg font-bold text-white">68.5%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Active Robots</p>
                  <p className="text-lg font-bold text-white">5,280</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-500/20 p-2 rounded-full">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Executions</p>
                  <p className="text-lg font-bold text-white">12.4M</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section with Interactive Tabs */}
      <div ref={featuresRef} className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Powerful Trading Features
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Our platform combines cutting-edge technology with user-friendly interfaces to give you the edge in today's markets
              </p>
            </motion.div>
          </div>

          {/* Feature Tabs */}
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-4 mb-12 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
              <button
                onClick={() => setActiveTab('algo')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'algo'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Algorithmic Trading
              </button>
              <button
                onClick={() => setActiveTab('risk')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'risk'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Risk Management
              </button>
              <button
                onClick={() => setActiveTab('signals')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'signals'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Real-time Signals
              </button>
              <button
                onClick={() => setActiveTab('vps')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'vps'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                24/7 VPS Hosting
              </button>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-gray-900/30 p-8 rounded-xl border border-gray-700">
              {/* Tab Content - Algorithmic Trading */}
              {activeTab === 'algo' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-4 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                      <div className="bg-blue-500/20 p-3 rounded-lg">
                        <Bot className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Algorithmic Trading</h3>
                    </div>
                    <p className="text-lg text-gray-300">
                      Create and deploy sophisticated trading algorithms without writing a single line of code. Our visual strategy builder makes it easy.
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Pre-built Strategy Templates</h4>
                          <p className="text-gray-300">Choose from proven strategies like Trend Following, Mean Reversion, Breakout, and more.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Customizable Parameters</h4>
                          <p className="text-gray-300">Fine-tune your strategies with adjustable risk levels, lot sizes, and take profit targets.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Performance Analytics</h4>
                          <p className="text-gray-300">Track win rates, profit metrics, and optimize your strategies based on real data.</p>
                        </div>
                      </li>
                    </ul>
                    <button
                      onClick={handleGetStarted}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center"
                    >
                      Start Building Robots <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="rounded-xl shadow-xl overflow-hidden border border-gray-700 bg-gray-800">
                      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bot className="w-5 h-5 text-blue-400" />
                          <span className="font-medium text-white">Trend Following Strategy</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Active</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="h-64 relative">
                          {/* Chart visualization */}
                          <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                            <path 
                              d="M0,150 C20,140 40,160 60,140 C80,120 100,130 120,110 C140,90 160,100 180,80 C200,60 220,70 240,50 C260,30 280,40 300,60 C320,80 340,70 360,90 C380,110 400,100 400,100" 
                              fill="none" 
                              stroke="#3b82f6" 
                              strokeWidth="2"
                            />
                            <path 
                              d="M0,150 C20,140 40,160 60,140 C80,120 100,130 120,110 C140,90 160,100 180,80 C200,60 220,70 240,50 C260,30 280,40 300,60 C320,80 340,70 360,90 C380,110 400,100 400,100" 
                              fill="url(#blueGradient)" 
                              strokeWidth="0"
                              opacity="0.2"
                            />
                            <defs>
                              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                          </svg>
                          
                          {/* Trade markers */}
                          <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-green-500/20 border border-green-500 transform -translate-x-1/2 -translate-y-1/2"></div>
                          <div className="absolute top-2/3 left-1/2 w-4 h-4 rounded-full bg-red-500/20 border border-red-500 transform -translate-x-1/2 -translate-y-1/2"></div>
                          <div className="absolute top-1/3 left-3/4 w-4 h-4 rounded-full bg-green-500/20 border border-green-500 transform -translate-x-1/2 -translate-y-1/2"></div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-gray-400">Win Rate</p>
                            <p className="text-lg font-bold text-green-400">72.5%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Profit</p>
                            <p className="text-lg font-bold text-green-400">+$1,245</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Trades</p>
                            <p className="text-lg font-bold text-white">124</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Tab Content - Risk Management */}
              {activeTab === 'risk' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-4 bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                      <div className="bg-purple-500/20 p-3 rounded-lg">
                        <Shield className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Risk Management</h3>
                    </div>
                    <p className="text-lg text-gray-300">
                      Protect your capital with advanced risk management tools designed to minimize losses and maximize gains.
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Position Sizing Calculator</h4>
                          <p className="text-gray-300">Automatically calculate optimal position sizes based on your risk tolerance and account balance.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Stop-Loss Automation</h4>
                          <p className="text-gray-300">Set and forget with automated stop-losses that protect your downside on every trade.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Portfolio Correlation Analysis</h4>
                          <p className="text-gray-300">Identify and avoid correlated risks across your trading portfolio.</p>
                        </div>
                      </li>
                    </ul>
                    <button
                      onClick={handleGetStarted}
                      className="px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors inline-flex items-center"
                    >
                      Explore Risk Tools <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="rounded-xl shadow-xl overflow-hidden border border-gray-700 bg-gray-800">
                      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Shield className="w-5 h-5 text-purple-400" />
                          <span className="font-medium text-white">Risk Analysis Dashboard</span>
                        </div>
                      </div>
                      <div className="p-4">
                        {/* Risk Meter */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-300">Portfolio Risk Level</span>
                            <span className="text-sm font-medium text-yellow-400">Medium</span>
                          </div>
                          <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" style={{width: '65%'}}></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Low</span>
                            <span>Medium</span>
                            <span>High</span>
                          </div>
                        </div>
                        
                        {/* Risk Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">Max Drawdown</p>
                            <p className="text-lg font-bold text-red-400">-4.2%</p>
                            <div className="mt-2 h-1 w-full bg-gray-600 rounded-full">
                              <div className="h-full bg-red-500 rounded-full" style={{width: '42%'}}></div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">Risk per Trade</p>
                            <p className="text-lg font-bold text-green-400">1.5%</p>
                            <div className="mt-2 h-1 w-full bg-gray-600 rounded-full">
                              <div className="h-full bg-green-500 rounded-full" style={{width: '15%'}}></div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">Correlation Risk</p>
                            <p className="text-lg font-bold text-yellow-400">Medium</p>
                            <div className="mt-2 h-1 w-full bg-gray-600 rounded-full">
                              <div className="h-full bg-yellow-500 rounded-full" style={{width: '60%'}}></div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">Exposure</p>
                            <p className="text-lg font-bold text-blue-400">32.5%</p>
                            <div className="mt-2 h-1 w-full bg-gray-600 rounded-full">
                              <div className="h-full bg-blue-500 rounded-full" style={{width: '32.5%'}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Tab Content - Real-time Signals */}
              {activeTab === 'signals' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-4 bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                      <div className="bg-green-500/20 p-3 rounded-lg">
                        <Zap className="w-6 h-6 text-green-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Real-time Signals</h3>
                    </div>
                    <p className="text-lg text-gray-300">
                      Receive and execute trading signals in real-time from TradingView or our proprietary signal providers.
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">TradingView Webhook Integration</h4>
                          <p className="text-gray-300">Connect your TradingView alerts directly to our platform for automated execution.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Automated Execution</h4>
                          <p className="text-gray-300">Signals are automatically executed according to your predefined risk parameters.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Signal Performance Tracking</h4>
                          <p className="text-gray-300">Analyze the performance of different signal sources to optimize your strategy.</p>
                        </div>
                      </li>
                    </ul>
                    <button
                      onClick={handleGetStarted}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors inline-flex items-center"
                    >
                      Set Up Signals <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="rounded-xl shadow-xl overflow-hidden border border-gray-700 bg-gray-800">
                      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-5 h-5 text-green-400" />
                          <span className="font-medium text-white">Signal Feed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Live</span>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-700">
                        {/* Signal 1 */}
                        <div className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-500/20 p-2 rounded-lg">
                              <ArrowUpRight className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">BUY EURUSD</p>
                              <p className="text-xs text-gray-400">1.0850 • SL: 1.0820 • TP: 1.0900</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">2m ago</div>
                        </div>
                        
                        {/* Signal 2 */}
                        <div className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="bg-red-500/20 p-2 rounded-lg">
                              <ArrowDownRight className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">SELL GBPUSD</p>
                              <p className="text-xs text-gray-400">1.2650 • SL: 1.2680 • TP: 1.2600</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">5m ago</div>
                        </div>
                        
                        {/* Signal 3 */}
                        <div className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-500/20 p-2 rounded-lg">
                              <ArrowUpRight className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">BUY XAUUSD</p>
                              <p className="text-xs text-gray-400">2050.50 • SL: 2045.00 • TP: 2060.00</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">12m ago</div>
                        </div>
                        
                        {/* Signal 4 */}
                        <div className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-500/20 p-2 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">CLOSE USDJPY</p>
                              <p className="text-xs text-gray-400">150.25 • Profit: +35 pips</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">18m ago</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {/* Tab Content - VPS Hosting */}
              {activeTab === 'vps' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-4 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                      <div className="bg-yellow-500/20 p-3 rounded-lg">
                        <Server className="w-6 h-6 text-yellow-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">24/7 VPS Hosting</h3>
                    </div>
                    <p className="text-lg text-gray-300">
                      Our VPS hosting ensures your trading robots run continuously, even when your computer is off.
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Cloud-based Execution</h4>
                          <p className="text-gray-300">Your strategies run on our secure, high-performance servers with 99.9% uptime.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Low-Latency Connections</h4>
                          <p className="text-gray-300">Strategically located servers ensure minimal latency to major exchanges.</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white">Resource Monitoring</h4>
                          <p className="text-gray-300">Real-time monitoring of your VPS performance and resource utilization.</p>
                        </div>
                      </li>
                    </ul>
                    <button
                      onClick={handleGetStarted}
                      className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors inline-flex items-center"
                    >
                      Get VPS Hosting <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="rounded-xl shadow-xl overflow-hidden border border-gray-700 bg-gray-800">
                      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Server className="w-5 h-5 text-yellow-400" />
                          <span className="font-medium text-white">VPS Dashboard</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Online</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">CPU Usage</p>
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-bold text-white">24%</p>
                              <div className="w-2/3 h-2 bg-gray-600 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{width: '24%'}}></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">Memory</p>
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-bold text-white">42%</p>
                              <div className="w-2/3 h-2 bg-gray-600 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{width: '42%'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white">Active Robots</p>
                            <p className="text-sm font-medium text-green-400">5/10</p>
                          </div>
                          <div className="space-y-2">
                            {['EURUSD Scalper', 'Gold Trend', 'USDJPY Breakout'].map((robot, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-gray-300">{robot}</span>
                                </div>
                                <span className="text-gray-400">Running</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <p className="text-sm font-medium text-white mb-2">Server Status</p>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Uptime</span>
                              <span className="text-gray-300">99.98%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Region</span>
                              <span className="text-gray-300">US-East</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Latency</span>
                              <span className="text-green-400">12ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Bandwidth</span>
                              <span className="text-gray-300">2.4 GB/day</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Technology Section */}
      <div ref={techRef} className="py-20 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Powered by Advanced Technology
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Our platform leverages cutting-edge technologies to provide you with the best trading experience
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting lines between tech cards */}
            <div className="absolute inset-0 hidden lg:block">
              <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                <path 
                  d="M250,150 L750,150 M500,50 L500,250" 
                  stroke="#3b82f6" 
                  strokeWidth="1" 
                  strokeDasharray="5,5"
                  opacity="0.3"
                />
              </svg>
            </div>
            
            {/* Tech 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-8 border border-blue-500/20 text-center relative z-10"
            >
              <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-blue-500/20">
                <Server className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cloud Infrastructure</h3>
              <p className="text-gray-300">
                Enterprise-grade servers with 99.9% uptime guarantee and global distribution for minimal latency.
              </p>
            </motion.div>

            {/* Tech 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-8 border border-purple-500/20 text-center relative z-10"
            >
              <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-purple-500/20">
                <Bot className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-300">
                Machine learning algorithms that analyze market patterns and optimize trading strategies in real-time.
              </p>
            </motion.div>

            {/* Tech 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-8 border border-green-500/20 text-center relative z-10"
            >
              <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-green-500/20">
                <Laptop className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cross-Platform Access</h3>
              <p className="text-gray-300">
                Access your trading dashboard from any device with our responsive web app and native mobile applications.
              </p>
            </motion.div>

            {/* Tech 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-8 border border-yellow-500/20 text-center relative z-10"
            >
              <div className="bg-yellow-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-yellow-500/20">
                <Shield className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Enterprise Security</h3>
              <p className="text-gray-300">
                Bank-grade encryption, two-factor authentication, and regular security audits to protect your data.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Investment Calculator Section */}
      <div ref={calculatorRef} className="py-20 bg-gradient-to-br from-gray-800 to-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Calculate Your Trading ROI
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                See how our algorithmic trading platform can help maximize your returns
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Calculator */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700"
            >
              <div className="flex items-center space-x-3 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Investment Calculator</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Initial Investment Amount ($)
                  </label>
                  <input
                    type="range"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    min="1000"
                    max="100000"
                    step="1000"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>$1,000</span>
                    <span className="font-medium text-white">${investmentAmount.toLocaleString()}</span>
                    <span>$100,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expected Monthly Return (%)
                  </label>
                  <input
                    type="range"
                    value={monthlyReturn}
                    onChange={(e) => setMonthlyReturn(Number(e.target.value))}
                    min="1"
                    max="15"
                    step="0.5"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>1%</span>
                    <span className="font-medium text-white">{monthlyReturn}%</span>
                    <span>15%</span>
                  </div>
                </div>

                <div className="bg-blue-900/30 rounded-lg p-6 border border-blue-500/30">
                  <h4 className="text-lg font-semibold text-blue-300 mb-4">Projected Returns</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-300">Monthly Profit</p>
                      <p className="text-2xl font-bold text-blue-100">${roi.monthly.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300">Yearly Profit</p>
                      <p className="text-2xl font-bold text-blue-100">${roi.yearly.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300">Annual ROI</p>
                      <p className="text-2xl font-bold text-blue-100">{roi.percentage.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-300">After 5 Years</p>
                      <p className="text-2xl font-bold text-blue-100">${(investmentAmount * Math.pow(1 + roi.percentage / 100, 5)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Comparison */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Traditional vs. Algorithmic Trading</h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">Traditional Trading</p>
                      <p className="text-lg font-semibold text-white">${(investmentAmount * 0.02).toFixed(2)}/year</p>
                      <p className="text-xs text-gray-500">2% management fee</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Algorithmic Trading</p>
                      <p className="text-lg font-semibold text-green-400">${(investmentAmount * 0.005).toFixed(2)}/year</p>
                      <p className="text-xs text-gray-500">0.5% platform fee</p>
                    </div>
                  </div>
                  
                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-green-300">Your Savings</p>
                      <p className="text-xl font-bold text-green-400">${(investmentAmount * 0.015).toFixed(2)}/year</p>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl shadow-lg p-8 text-white border border-blue-500/30">
                <h3 className="text-xl font-bold mb-4">Why Choose Algorithmic Trading?</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Eliminates emotional trading decisions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Executes trades 24/7 without your intervention</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Backtested strategies with proven performance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Diversify across multiple markets simultaneously</span>
                  </li>
                </ul>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetStarted}
                  className="mt-6 w-full py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Start Trading Now
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Interactive CTA Section */}
      <div className="py-20 bg-gradient-to-br from-blue-700 to-purple-800 text-white border-t border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Trading?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Join thousands of traders who are already using our platform to automate their trading strategies and maximize returns.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="px-8 py-4 bg-white text-blue-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-xl"
            >
              Get Started Now
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-12 border-t border-gray-800">
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
                <li><a href="#" onClick={() => scrollToSection(featuresRef)} className="hover:text-white transition-colors">Algorithmic Trading</a></li>
                <li><a href="#" onClick={() => setActiveTab('risk')} className="hover:text-white transition-colors">Risk Management</a></li>
                <li><a href="#" onClick={() => setActiveTab('signals')} className="hover:text-white transition-colors">Real-time Signals</a></li>
                <li><a href="#" onClick={() => setActiveTab('vps')} className="hover:text-white transition-colors">VPS Hosting</a></li>
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
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Trading Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};