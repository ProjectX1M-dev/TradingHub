import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronLeft, FileText, AlertTriangle } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  const navigate = useNavigate();
  const lastUpdated = "June 15, 2025";

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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-gray-600 mt-2">Last Updated: {lastUpdated}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Important Notice</h3>
              <p className="text-yellow-700 mt-1">
                Trading involves risk. Past performance is not indicative of future results. You should never trade with money you cannot afford to lose. This platform is for informational and educational purposes only and should not be considered financial advice.
              </p>
            </div>
          </div>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <p>
            Welcome to Trading Hub. By accessing or using our website and services, you agree to be bound by these Terms of Service. Please read them carefully.
          </p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Trading Hub platform, website, and services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use our Services.
          </p>
          
          <h2>2. Description of Services</h2>
          <p>
            Trading Hub provides a platform for algorithmic trading, connecting to MetaTrader 5 (MT5) brokers, creating and managing trading robots, processing trading signals, and offering VPS hosting services. Our Services are intended for informational and educational purposes only and should not be considered financial advice.
          </p>
          
          <h2>3. Account Registration</h2>
          <p>
            To use certain features of our Services, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>
          <p>
            You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
          </p>
          
          <h2>4. MT5 Broker Connection</h2>
          <p>
            Our Services allow you to connect to your MT5 broker account. You are solely responsible for:
          </p>
          <ul>
            <li>Providing accurate MT5 credentials</li>
            <li>Ensuring you have the right to use these credentials</li>
            <li>Understanding and complying with your broker's terms of service</li>
            <li>Any trading activities conducted through your broker account</li>
          </ul>
          <p>
            We store your MT5 credentials securely and use them solely for the purpose of connecting to your broker account to execute trades and retrieve account information as directed by you.
          </p>
          
          <h2>5. Trading Risks</h2>
          <p>
            Trading in financial markets involves substantial risk. You acknowledge and agree that:
          </p>
          <ul>
            <li>Past performance is not indicative of future results</li>
            <li>You should never trade with money you cannot afford to lose</li>
            <li>Automated trading systems are subject to failure and may not perform as expected</li>
            <li>Market conditions can change rapidly and unpredictably</li>
            <li>You are solely responsible for all trading decisions and outcomes</li>
          </ul>
          
          <h2>6. Token System</h2>
          <p>
            Our platform uses a token system for accessing premium features. You acknowledge that:
          </p>
          <ul>
            <li>Tokens have no cash value and cannot be redeemed for cash</li>
            <li>Token purchases are final and non-refundable</li>
            <li>We reserve the right to modify token pricing and availability</li>
            <li>Tokens may expire as specified at the time of purchase</li>
          </ul>
          
          <h2>7. VPS Hosting</h2>
          <p>
            Our VPS hosting services are subject to the following terms:
          </p>
          <ul>
            <li>VPS resources are allocated based on the plan you purchase</li>
            <li>We reserve the right to suspend or terminate VPS services that consume excessive resources</li>
            <li>We provide no guarantee of uptime, though we strive for 99.9% availability</li>
            <li>You are responsible for all activities conducted through your VPS</li>
            <li>VPS subscriptions are billed according to the terms specified at purchase</li>
          </ul>
          
          <h2>8. Intellectual Property</h2>
          <p>
            All content, features, and functionality of our Services, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, software, and the compilation thereof, are owned by Trading Hub, its licensors, or other providers of such material.
          </p>
          <p>
            You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Services without our prior written consent.
          </p>
          
          <h2>9. User Content</h2>
          <p>
            You retain ownership of any content you submit to our Services ("User Content"). By providing User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such User Content.
          </p>
          <p>
            You represent and warrant that your User Content does not violate any third-party rights and complies with all applicable laws and regulations.
          </p>
          
          <h2>10. Prohibited Uses</h2>
          <p>
            You agree not to use our Services:
          </p>
          <ul>
            <li>In any way that violates any applicable law or regulation</li>
            <li>To engage in market manipulation or other prohibited trading practices</li>
            <li>To attempt to gain unauthorized access to our systems or other users' accounts</li>
            <li>To transmit any malware, viruses, or other harmful code</li>
            <li>To interfere with the proper functioning of our Services</li>
            <li>To engage in any activity that could damage, disable, or impair our Services</li>
          </ul>
          
          <h2>11. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account and access to our Services at our sole discretion, without notice, for any reason, including if we believe you have violated these Terms.
          </p>
          
          <h2>12. Disclaimer of Warranties</h2>
          <p>
            OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE, OR THAT ANY DEFECTS WILL BE CORRECTED.
          </p>
          
          <h2>13. Limitation of Liability</h2>
          <p>
            IN NO EVENT SHALL TRADING HUB, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul>
            <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE OUR SERVICES</li>
            <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON OUR SERVICES</li>
            <li>ANY TRADING DECISIONS MADE USING OUR SERVICES</li>
            <li>ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS AND/OR ANY PERSONAL INFORMATION STORED THEREIN</li>
          </ul>
          
          <h2>14. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Trading Hub and its officers, directors, employees, and agents from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from:
          </p>
          <ul>
            <li>Your use of our Services</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another</li>
            <li>Your User Content</li>
          </ul>
          
          <h2>15. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions. Any dispute arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in New York County, New York.
          </p>
          
          <h2>16. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of any material changes by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of our Services after such changes constitutes your acceptance of the new Terms.
          </p>
          
          <h2>17. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <ul>
            <li>Email: legal@tradinghub.com</li>
            <li>Address: 123 Trading Street, Financial District, New York, NY 10004, United States</li>
            <li>Phone: +1 (555) 123-4567</li>
          </ul>
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

export default TermsOfService;