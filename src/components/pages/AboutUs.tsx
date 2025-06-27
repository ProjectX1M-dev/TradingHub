import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Globe, Award, ChevronLeft, Building, Calendar } from 'lucide-react';

export const AboutUs: React.FC = () => {
  const navigate = useNavigate();

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Trading Hub</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Revolutionizing algorithmic trading with cutting-edge technology and user-friendly solutions
          </p>
        </div>
        
        {/* Our Story */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-lg text-gray-600 mb-4">
                Trading Hub was founded in 2023 by a team of experienced traders and software engineers who recognized a gap in the market for accessible, powerful algorithmic trading tools.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Our founders had spent years developing proprietary trading systems for institutional clients but realized that individual traders and smaller firms lacked access to the same powerful tools.
              </p>
              <p className="text-lg text-gray-600">
                With a mission to democratize algorithmic trading, we built a platform that combines institutional-grade technology with an intuitive interface, making advanced trading strategies accessible to everyone from beginners to professional traders.
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-8 border border-blue-100">
              <div className="flex items-center space-x-4 mb-6">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Our Timeline</h3>
                  <p className="text-gray-600">Key milestones in our journey</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex">
                  <div className="flex-shrink-0 w-24 font-bold text-blue-600">2023</div>
                  <div>Trading Hub founded with seed funding</div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 w-24 font-bold text-blue-600">2023 Q3</div>
                  <div>Beta launch with 500 early adopters</div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 w-24 font-bold text-blue-600">2024 Q1</div>
                  <div>Official platform launch with MT5 integration</div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 w-24 font-bold text-blue-600">2024 Q2</div>
                  <div>VPS hosting and plugins marketplace introduced</div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 w-24 font-bold text-blue-600">2025</div>
                  <div>Reached 10,000+ active traders worldwide</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Our Mission */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-12 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl mb-8">
              To empower traders of all levels with institutional-grade algorithmic trading tools that are accessible, affordable, and easy to use.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="font-bold text-xl mb-2">Democratize</h3>
                <p className="text-blue-100">Make advanced trading technology accessible to everyone</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="font-bold text-xl mb-2">Innovate</h3>
                <p className="text-blue-100">Continuously improve our platform with cutting-edge features</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="font-bold text-xl mb-2">Educate</h3>
                <p className="text-blue-100">Help traders develop profitable strategies and risk management skills</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Our Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Team Member 1 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Alex Morgan</h3>
              <p className="text-blue-600 mb-2">CEO & Co-Founder</p>
              <p className="text-gray-600 text-sm">
                Former hedge fund quant with 15+ years of algorithmic trading experience
              </p>
            </div>
            
            {/* Team Member 2 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Sarah Chen</h3>
              <p className="text-blue-600 mb-2">CTO & Co-Founder</p>
              <p className="text-gray-600 text-sm">
                Software architect with expertise in financial technology and cloud infrastructure
              </p>
            </div>
            
            {/* Team Member 3 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Michael Rodriguez</h3>
              <p className="text-blue-600 mb-2">Head of Product</p>
              <p className="text-gray-600 text-sm">
                Former professional trader with a passion for creating intuitive trading interfaces
              </p>
            </div>
            
            {/* Team Member 4 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Emma Wilson</h3>
              <p className="text-blue-600 mb-2">Head of Customer Success</p>
              <p className="text-gray-600 text-sm">
                Dedicated to ensuring traders get the most out of our platform with exceptional support
              </p>
            </div>
          </div>
        </div>
        
        {/* Company Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
              <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excellence</h3>
              <p className="text-gray-600">
                We strive for excellence in everything we do, from code quality to customer support. We're never satisfied with "good enough" and continuously push the boundaries of what's possible.
              </p>
            </div>
            
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
              <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Transparency</h3>
              <p className="text-gray-600">
                We believe in complete transparency with our users. From our pricing model to our platform's performance, we share everything openly and honestly.
              </p>
            </div>
            
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
              <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600">
                We're building more than just a platform; we're creating a community of like-minded traders who support each other and grow together.
              </p>
            </div>
          </div>
        </div>
        
        {/* Join Us */}
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Journey</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            We're on a mission to transform the world of trading. Whether you're a seasoned professional or just getting started, we invite you to join us.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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

export default AboutUs;