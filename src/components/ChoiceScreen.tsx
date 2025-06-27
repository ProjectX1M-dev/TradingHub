import React from 'react';
import { Bot, Activity, TrendingUp, BarChart3, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChoiceScreenProps {
  onSelectAlgoTrading: () => void;
  onSelectLiveTrading: () => void;
}

export const ChoiceScreen: React.FC<ChoiceScreenProps> = ({
  onSelectAlgoTrading,
  onSelectLiveTrading
}) => {
  const choices = [
    {
      id: 'algotrading',
      title: 'Algorithmic Trading',
      subtitle: 'Automated Trading Dashboard',
      description: 'Create and manage trading robots, set up TradingView webhooks, and automate your trading strategies with advanced risk management.',
      icon: Bot,
      gradient: 'from-blue-500 to-purple-600',
      bgGradient: 'from-blue-50 to-purple-50',
      borderColor: 'border-blue-200',
      features: [
        'Trading Robots & Automation',
        'TradingView Webhook Integration',
        'Risk Management Tools',
        'Signal Processing & Analytics'
      ],
      onClick: onSelectAlgoTrading
    },
    {
      id: 'livetrading',
      title: 'Live Trading',
      subtitle: 'Real-time Trading Terminal',
      description: 'Execute manual trades, monitor positions in real-time, analyze markets, and manage your portfolio with professional trading tools.',
      icon: Activity,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      features: [
        'Real-time Market Data',
        'Manual Trade Execution',
        'Advanced Charting Tools',
        'Portfolio Management'
      ],
      onClick: onSelectLiveTrading
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MT5 Trading Platform</h1>
              <p className="text-gray-600">Choose your trading environment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Trading Hub
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access powerful trading tools designed for both automated and manual trading. 
            Choose your preferred trading style to get started.
          </p>
        </motion.div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {choices.map((choice, index) => {
            const Icon = choice.icon;
            
            return (
              <motion.div
                key={choice.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`relative group cursor-pointer`}
                onClick={choice.onClick}
              >
                <div className={`
                  relative overflow-hidden rounded-2xl border-2 ${choice.borderColor} 
                  bg-gradient-to-br ${choice.bgGradient} 
                  p-8 transition-all duration-300 
                  hover:shadow-2xl hover:scale-105 hover:-translate-y-2
                  group-hover:border-opacity-60
                `}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`
                      inline-flex items-center justify-center w-16 h-16 rounded-xl 
                      bg-gradient-to-r ${choice.gradient} mb-6
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title & Subtitle */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {choice.title}
                      </h3>
                      <p className="text-lg text-gray-600 font-medium">
                        {choice.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {choice.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {choice.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-3">
                          <div className={`
                            w-2 h-2 rounded-full bg-gradient-to-r ${choice.gradient}
                          `}></div>
                          <span className="text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <div className={`
                      inline-flex items-center space-x-2 px-6 py-3 rounded-xl
                      bg-gradient-to-r ${choice.gradient} text-white font-semibold
                      group-hover:shadow-lg transition-all duration-300
                      group-hover:scale-105
                    `}>
                      <span>Enter {choice.title}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200 p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
            <div className="space-y-2">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">Real-time</h4>
              <p className="text-gray-600">Market data and execution</p>
            </div>
            <div className="space-y-2">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">Automated</h4>
              <p className="text-gray-600">Trading robots and signals</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};