import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronLeft, Shield, Lock } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
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
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-gray-600 mt-2">Last Updated: {lastUpdated}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <p>
            At Trading Hub, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our trading platform.
          </p>
          
          <h2>Information We Collect</h2>
          <p>
            We collect information that you provide directly to us when you:
          </p>
          <ul>
            <li>Create an account</li>
            <li>Connect your MT5 broker</li>
            <li>Set up trading robots</li>
            <li>Configure TradingView webhooks</li>
            <li>Purchase tokens or VPS plans</li>
            <li>Contact our support team</li>
          </ul>
          
          <p>This information may include:</p>
          <ul>
            <li>Personal identification information (name, email address, phone number)</li>
            <li>Billing information (for token purchases)</li>
            <li>Trading preferences and settings</li>
            <li>MT5 account credentials (securely stored and encrypted)</li>
            <li>Trading history and performance data</li>
          </ul>
          
          <p>
            We also automatically collect certain information when you visit our website, including:
          </p>
          <ul>
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Pages visited and time spent</li>
            <li>Referral source</li>
          </ul>
          
          <h2>How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues</li>
            <li>Personalize your experience and provide content that may interest you</li>
          </ul>
          
          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access. These measures include:
          </p>
          <ul>
            <li>Encryption of sensitive data at rest and in transit</li>
            <li>Regular security assessments and penetration testing</li>
            <li>Strict access controls and authentication procedures</li>
            <li>Continuous monitoring for suspicious activities</li>
            <li>Regular backups and disaster recovery planning</li>
          </ul>
          
          <h2>Data Sharing and Disclosure</h2>
          <p>
            We may share your information with:
          </p>
          <ul>
            <li>Service providers who perform services on our behalf</li>
            <li>Financial institutions to process payments</li>
            <li>Professional advisors, such as lawyers, auditors, and insurers</li>
            <li>Regulatory authorities, law enforcement agencies, or other third parties when required by law</li>
          </ul>
          
          <p>
            We do not sell your personal information to third parties.
          </p>
          
          <h2>Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal data, including:
          </p>
          <ul>
            <li>Right to access your personal data</li>
            <li>Right to rectify inaccurate or incomplete data</li>
            <li>Right to erasure (the "right to be forgotten")</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to withdraw consent</li>
          </ul>
          
          <p>
            To exercise these rights, please contact us at privacy@tradinghub.com.
          </p>
          
          <h2>Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
          
          <h2>Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we learn we have collected personal information from a child under 18, we will delete that information.
          </p>
          
          <h2>International Data Transfers</h2>
          <p>
            Your information may be transferred to, and maintained on, computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction. If you are located outside the United States and choose to provide information to us, please note that we transfer the data to the United States and process it there.
          </p>
          
          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
          
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <ul>
            <li>Email: privacy@tradinghub.com</li>
            <li>Address: 123 Trading Street, Financial District, New York, NY 10004, United States</li>
            <li>Phone: +1 (555) 123-4567</li>
          </ul>
        </div>
        
        <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Data Security is Our Priority</h3>
              <p className="text-gray-600 mt-2">
                We employ industry-standard security measures to protect your personal information and trading data. Your MT5 credentials are encrypted and securely stored, and we continuously monitor our systems to prevent unauthorized access.
              </p>
            </div>
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

export default PrivacyPolicy;