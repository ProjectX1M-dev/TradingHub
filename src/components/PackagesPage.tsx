import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, X, CreditCard, Bitcoin, ArrowRight, ChevronRight, ChevronLeft, Tag, Percent, AlertCircle, Loader, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  tokens: number;
  features: string[];
  popular?: boolean;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
}

interface PromoCodeResponse {
  isValid: boolean;
  discountPercent: number;
  message: string;
}

const PACKAGES: Package[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for beginners',
    price: 49,
    tokens: 100,
    features: [
      '3 Trading Robots',
      'Basic Risk Management',
      'TradingView Webhooks',
      'Email Support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For serious traders',
    price: 99,
    tokens: 500,
    features: [
      'Unlimited Trading Robots',
      'Advanced Risk Management',
      '24/7 VPS Hosting',
      'Priority Support',
      'Multi-Account Management'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For institutional traders',
    price: 299,
    tokens: 1500,
    features: [
      'Everything in Professional',
      'Custom Strategy Development',
      'Dedicated Account Manager',
      'API Access',
      'White-label Options'
    ]
  }
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 
  'Germany', 'France', 'Spain', 'Italy', 'Japan', 'China',
  'India', 'Brazil', 'Mexico', 'South Africa', 'Russia'
];

export const PackagesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userTokens, fetchUserTokens } = useAuthStore();
  
  // Get package ID from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const packageIdFromUrl = queryParams.get('package');
  
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [step, setStep] = useState<'package' | 'payment' | 'confirmation'>('package');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [promoCode, setPromoCode] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [validPromo, setValidPromo] = useState<PromoCodeResponse | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    country: 'United States',
    postalCode: '',
    phone: ''
  });

  // Set the selected package based on URL parameter
  useEffect(() => {
    if (packageIdFromUrl) {
      const pkg = PACKAGES.find(p => p.id === packageIdFromUrl);
      if (pkg) {
        setSelectedPackage(pkg);
        setStep('payment');
      }
    }
  }, [packageIdFromUrl]);

  // Fetch user tokens when component mounts
  useEffect(() => {
    if (userTokens === null) {
      fetchUserTokens();
    }
  }, [fetchUserTokens, userTokens]);

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setStep('payment');
    // Update URL without navigating
    const newUrl = `${window.location.pathname}?package=${pkg.id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleBackToPackages = () => {
    setSelectedPackage(null);
    setStep('package');
    setValidPromo(null);
    setPromoCode('');
    // Remove query parameter
    navigate('/packages');
  };

  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setIsValidatingPromo(true);
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/validate-promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ code: promoCode.trim() })
      });
      
      const data: PromoCodeResponse = await response.json();
      
      if (data.isValid) {
        setValidPromo(data);
        toast.success(`Promo code applied: ${data.discountPercent}% discount`);
      } else {
        setValidPromo(null);
        toast.error(data.message || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast.error('Failed to validate promo code');
      setValidPromo(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const clearPromoCode = () => {
    setPromoCode('');
    setValidPromo(null);
  };

  const calculateDiscountedPrice = () => {
    if (!selectedPackage) return 0;
    
    if (validPromo && validPromo.isValid) {
      const discountAmount = (selectedPackage.price * validPromo.discountPercent) / 100;
      return selectedPackage.price - discountAmount;
    }
    
    return selectedPackage.price;
  };

  const validateForm = () => {
    if (!selectedPackage) return false;
    
    // Validate customer info
    const requiredFields = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' }
    ];
    
    const missingFields = requiredFields.filter(
      field => !customerInfo[field.key as keyof CustomerInfo]
    ).map(field => field.label);
    
    // Check terms agreement
    if (!agreedToTerms) {
      missingFields.push('Terms and Conditions agreement');
    }
    
    setFormErrors(missingFields);
    
    return missingFields.length === 0;
  };

  const handleProcessPayment = async () => {
    if (!selectedPackage) return;
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fill in all required fields and agree to the Terms of Service');
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      // Get current user ID
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        toast.error('You must be logged in to make a purchase');
        navigate('/login');
        return;
      }
      
      // Process payment
      const response = await fetch(`${supabaseUrl}/functions/v1/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          amount: calculateDiscountedPrice(),
          tokens: selectedPackage.tokens,
          userId: session.user.id,
          promoCode: validPromo ? promoCode : undefined,
          paymentMethod,
          paymentDetails: {
            // In a real app, this would include card details or crypto transaction info
            // For this demo, we're just simulating a successful payment
            success: true
          },
          customerInfo
        })
      });

      const result = await response.json();

      if (result.success) {
        setStep('confirmation');
        toast.success(result.message || 'Payment successful!');
        
        // Refresh user tokens
        setTimeout(() => {
          fetchUserTokens();
        }, 1000);
      } else {
        toast.error(result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

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
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-8">
          <button 
            onClick={() => navigate('/')}
            className="hover:text-gray-700 transition-colors"
          >
            Home
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button 
            onClick={handleBackToPackages}
            className={`hover:text-gray-700 transition-colors ${step !== 'package' ? '' : 'font-medium text-gray-900'}`}
          >
            Packages
          </button>
          {step !== 'package' && (
            <>
              <ChevronRight className="w-4 h-4 mx-2" />
              <button 
                onClick={() => setStep('payment')}
                className={`hover:text-gray-700 transition-colors ${step === 'payment' ? 'font-medium text-gray-900' : ''}`}
              >
                Payment
              </button>
            </>
          )}
          {step === 'confirmation' && (
            <>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="font-medium text-gray-900">Confirmation</span>
            </>
          )}
        </div>

        {/* Package Selection */}
        {step === 'package' && (
          <div>
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Package</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Select the package that best fits your trading needs and budget
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PACKAGES.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  className={`bg-white rounded-xl overflow-hidden border ${
                    pkg.popular 
                      ? 'border-blue-500 shadow-lg shadow-blue-50/50' 
                      : 'border-gray-200 shadow'
                  }`}
                >
                  {pkg.popular && (
                    <div className="bg-blue-500 text-white text-center py-2 font-semibold">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <p className="text-gray-600 mb-6">{pkg.description}</p>
                    <div className="flex items-baseline mb-6">
                      <span className="text-4xl font-bold text-gray-900">${pkg.price}</span>
                      <span className="text-gray-500 ml-2">/month</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700 font-semibold">{pkg.tokens} Tokens</span>
                      </li>
                    </ul>
                    <button
                      onClick={() => handleSelectPackage(pkg)}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center ${
                        pkg.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      Select Package <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Current Token Balance */}
            {userTokens && (
              <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Current Token Balance</h3>
                    <p className="text-blue-700">
                      You currently have <span className="font-bold">{userTokens.balance} tokens</span> available.
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <button
                      onClick={() => navigate('/vps')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Explore VPS Options
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Step */}
        {step === 'payment' && selectedPackage && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
                
                {formErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-medium">Please fix the following errors:</p>
                        <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                          {formErrors.map((error, index) => (
                            <li key={index}>{error} is required</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={customerInfo.firstName}
                      onChange={handleCustomerInfoChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.includes('First Name') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={customerInfo.lastName}
                      onChange={handleCustomerInfoChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.includes('Last Name') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleCustomerInfoChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.includes('Email') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={customerInfo.address}
                      onChange={handleCustomerInfoChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.includes('Address') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={customerInfo.city}
                      onChange={handleCustomerInfoChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.includes('City') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      name="country"
                      value={customerInfo.country}
                      onChange={handleCustomerInfoChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.includes('Country') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    >
                      {COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={customerInfo.postalCode}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-blue-500' : 'text-gray-500'}`} />
                    <span className={paymentMethod === 'card' ? 'font-medium text-blue-700' : 'text-gray-700'}>Credit Card</span>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('crypto')}
                    className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'crypto'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Bitcoin className={`w-5 h-5 ${paymentMethod === 'crypto' ? 'text-purple-500' : 'text-gray-500'}`} />
                    <span className={paymentMethod === 'crypto' ? 'font-medium text-purple-700' : 'text-gray-700'}>Cryptocurrency</span>
                  </button>
                </div>
                
                {paymentMethod === 'card' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiration Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVC
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'crypto' && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                      <h3 className="font-medium text-purple-800 mb-2">Cryptocurrency Payment</h3>
                      <p className="text-purple-700 text-sm mb-4">
                        We accept Bitcoin (BTC), Ethereum (ETH), and USDT. After clicking "Complete Purchase", you'll receive payment instructions.
                      </p>
                      <div className="flex space-x-4">
                        <div className="bg-white p-2 rounded border border-purple-200">
                          <Bitcoin className="w-8 h-8 text-orange-500" />
                        </div>
                        <div className="bg-white p-2 rounded border border-purple-200">
                          <svg className="w-8 h-8" viewBox="0 0 784.37 1277.39" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#343434" d="m392.07 0-8.57 29.11v844.63l8.57 8.55 392.06-231.75z"/>
                            <path fill="#8C8C8C" d="m392.07 0-392.07 650.54 392.07 231.75v-882.29z"/>
                            <path fill="#3C3C3B" d="m392.07 956.52-4.83 5.89v300.87l4.83 14.1 392.3-552.49z"/>
                            <path fill="#8C8C8C" d="m392.07 1277.38v-320.86l-392.07-231.63z"/>
                            <path fill="#141414" d="m392.07 882.29 392.06-231.75-392.06-178.21z"/>
                            <path fill="#393939" d="m0 650.54 392.07 231.75v-409.96z"/>
                          </svg>
                        </div>
                        <div className="bg-white p-2 rounded border border-purple-200">
                          <svg className="w-8 h-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#26A17B" d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z"/>
                            <path fill="#fff" d="M15.97 11.47c-.065 0-1.615.08-1.615.08s-1.835-.115-1.835.8c0 .915 1.835.8 1.835.8h1.615s1.835.115 1.835-.8c0-.915-1.835-.8-1.835-.8zm-3.97 0c-.065 0-1.615.08-1.615.08s-1.835-.115-1.835.8c0 .915 1.835.8 1.835.8H12s1.835.115 1.835-.8c0-.915-1.835-.8-1.835-.8H12zm3.97-1.47c.065 0 1.615-.08 1.615-.08s1.835.115 1.835-.8c0-.915-1.835-.8-1.835-.8h-1.615s-1.835-.115-1.835.8c0 .915 1.835.8 1.835.8zm-3.97 0c.065 0 1.615-.08 1.615-.08s1.835.115 1.835-.8c0-.915-1.835-.8-1.835-.8H12s-1.835-.115-1.835.8c0 .915 1.835.8 1.835.8H12z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Promo Code */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Promo Code</h2>
                
                {validPromo ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Tag className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">{promoCode.toUpperCase()}</p>
                        <p className="text-sm text-green-700">
                          {validPromo.discountPercent}% discount applied
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearPromoCode}
                      className="text-green-700 hover:text-green-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Tag className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={validatePromoCode}
                      disabled={isValidatingPromo || !promoCode.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isValidatingPromo ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Validating...</span>
                        </>
                      ) : (
                        <>
                          <Percent className="w-4 h-4" />
                          <span>Apply</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{selectedPackage.name} Package</span>
                    <span className="font-medium">${selectedPackage.price.toFixed(2)}</span>
                  </div>
                  
                  {validPromo && validPromo.isValid && (
                    <div className="flex justify-between text-green-600">
                      <span>Promo Discount ({validPromo.discountPercent}%)</span>
                      <span>-${((selectedPackage.price * validPromo.discountPercent) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-4 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${calculateDiscountedPrice().toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">You will receive:</span>
                  </div>
                  <p className="text-blue-700 text-lg font-bold">
                    {selectedPackage.tokens} Tokens
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Use tokens to access premium features and VPS hosting
                  </p>
                </div>
                
                {/* Terms and Conditions Checkbox */}
                <div className="mb-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="terms"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className={`w-4 h-4 text-blue-600 border rounded focus:ring-blue-500 ${
                          formErrors.includes('Terms and Conditions agreement') ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                      I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                  {formErrors.includes('Terms and Conditions agreement') && (
                    <p className="mt-1 text-sm text-red-600">You must agree to the Terms of Service</p>
                  )}
                </div>
                
                <button
                  onClick={handleProcessPayment}
                  disabled={isProcessingPayment}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Purchase <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
                
                <div className="mt-4 text-center">
                  <button
                    onClick={handleBackToPackages}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Back to packages
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Step */}
        {step === 'confirmation' && selectedPackage && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Payment Successful!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Thank you for your purchase. Your tokens have been added to your account.
              </p>
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8 inline-block">
                <p className="text-blue-800 font-medium mb-2">Your new token balance:</p>
                <p className="text-3xl font-bold text-blue-900">
                  {userTokens ? userTokens.balance + selectedPackage.tokens : selectedPackage.tokens} Tokens
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleBackToDashboard}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                
                <button
                  onClick={() => navigate('/vps')}
                  className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Explore VPS Options
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};