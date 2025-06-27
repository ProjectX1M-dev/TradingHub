import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronLeft, Users, MessageSquare, Award, Star, User, ArrowRight, Globe, Calendar } from 'lucide-react';

export const Community: React.FC = () => {
  const navigate = useNavigate();

  // Sample community members
  const topContributors = [
    { id: 1, name: 'Sarah Johnson', contributions: 156, avatar: <User className="w-8 h-8 text-blue-600" /> },
    { id: 2, name: 'Michael Chen', contributions: 142, avatar: <User className="w-8 h-8 text-blue-600" /> },
    { id: 3, name: 'David Rodriguez', contributions: 128, avatar: <User className="w-8 h-8 text-blue-600" /> },
    { id: 4, name: 'Emma Wilson', contributions: 115, avatar: <User className="w-8 h-8 text-blue-600" /> },
    { id: 5, name: 'James Taylor', contributions: 103, avatar: <User className="w-8 h-8 text-blue-600" /> }
  ];

  // Sample forum categories
  const forumCategories = [
    { id: 1, name: 'Trading Strategies', posts: 342, icon: <TrendingUp className="w-5 h-5 text-blue-600" /> },
    { id: 2, name: 'Platform Support', posts: 256, icon: <MessageSquare className="w-5 h-5 text-green-600" /> },
    { id: 3, name: 'Robot Development', posts: 189, icon: <Award className="w-5 h-5 text-purple-600" /> },
    { id: 4, name: 'TradingView Integration', posts: 175, icon: <Globe className="w-5 h-5 text-orange-600" /> },
    { id: 5, name: 'Risk Management', posts: 142, icon: <Star className="w-5 h-5 text-yellow-600" /> }
  ];

  // Sample upcoming events
  const upcomingEvents = [
    {
      id: 1,
      title: 'Algorithmic Trading Webinar',
      date: 'June 25, 2025',
      time: '2:00 PM EST',
      description: 'Learn advanced algorithmic trading strategies from professional traders.',
      host: 'Alex Morgan, CEO'
    },
    {
      id: 2,
      title: 'Platform Feature Showcase',
      date: 'July 10, 2025',
      time: '1:00 PM EST',
      description: 'Demonstration of new platform features and improvements.',
      host: 'Sarah Chen, CTO'
    },
    {
      id: 3,
      title: 'Community Q&A Session',
      date: 'July 15, 2025',
      time: '3:00 PM EST',
      description: 'Open forum for community members to ask questions and provide feedback.',
      host: 'Michael Rodriguez, Head of Product'
    }
  ];

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
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trading Hub Community</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with fellow traders, share strategies, and learn from each other in our growing community
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Join the Community
            </button>
            <button className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Browse the Forum
            </button>
          </div>
        </div>
        
        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">10,000+</h3>
            <p className="text-blue-700">Active Community Members</p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 border border-green-100 text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">25,000+</h3>
            <p className="text-green-700">Forum Posts</p>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100 text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">500+</h3>
            <p className="text-purple-700">Shared Trading Strategies</p>
          </div>
        </div>
        
        {/* Forum Categories */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Popular Forum Categories</h2>
            <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors">
              <span>View All Categories</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forumCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-gray-500">{category.posts} posts</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="text-blue-600 hover:text-blue-800 transition-colors text-sm">
                    Browse discussions →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top Contributors */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Top Contributors</h2>
            <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors">
              <span>View All Members</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contributions</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topContributors.map((contributor) => (
                  <tr key={contributor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 rounded-full p-1">
                          {contributor.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{contributor.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-900">{contributor.contributions} contributions</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-blue-600 hover:text-blue-800 transition-colors text-sm">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Upcoming Events */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
            <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors">
              <span>View All Events</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-600 font-medium">{event.date} • {event.time}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4">{event.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Host: {event.host}</p>
                  <button className="text-blue-600 hover:text-blue-800 transition-colors text-sm">
                    Register →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Community Guidelines */}
        <div className="bg-blue-50 rounded-xl p-8 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Community Values</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <div className="bg-blue-100 p-1 rounded-full mr-2 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span><strong>Respect:</strong> Treat all community members with respect and courtesy</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 p-1 rounded-full mr-2 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span><strong>Collaboration:</strong> Share knowledge and help others succeed</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 p-1 rounded-full mr-2 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span><strong>Quality:</strong> Contribute thoughtful, well-researched content</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 p-1 rounded-full mr-2 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span><strong>Integrity:</strong> Be honest and transparent in your communications</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Prohibited Behavior</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <div className="bg-red-100 p-1 rounded-full mr-2 mt-1">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                  <span>Harassment or personal attacks</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 p-1 rounded-full mr-2 mt-1">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                  <span>Spam or self-promotion</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 p-1 rounded-full mr-2 mt-1">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                  <span>Sharing of personal or sensitive information</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 p-1 rounded-full mr-2 mt-1">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                  <span>Promotion of illegal activities or market manipulation</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6 text-center">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Read Full Community Guidelines
            </button>
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

export default Community;