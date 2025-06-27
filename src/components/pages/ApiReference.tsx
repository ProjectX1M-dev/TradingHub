import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronLeft, Code, Search, Copy, Check, Server, Database, Shield, Zap } from 'lucide-react';

export const ApiReference: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeEndpoint, setActiveEndpoint] = useState('account-get');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Define API endpoint categories and endpoints
  const apiCategories = [
    {
      id: 'account',
      name: 'Account',
      icon: Server,
      endpoints: [
        { id: 'account-get', method: 'GET', path: '/v1/account', description: 'Get account information' },
        { id: 'account-balance', method: 'GET', path: '/v1/account/balance', description: 'Get account balance' },
        { id: 'account-tokens', method: 'GET', path: '/v1/account/tokens', description: 'Get token balance' }
      ]
    },
    {
      id: 'trading',
      name: 'Trading',
      icon: Zap,
      endpoints: [
        { id: 'positions-get', method: 'GET', path: '/v1/positions', description: 'Get open positions' },
        { id: 'orders-post', method: 'POST', path: '/v1/orders', description: 'Place a new order' },
        { id: 'positions-delete', method: 'DELETE', path: '/v1/positions/{ticket}', description: 'Close a position' },
        { id: 'symbols-get', method: 'GET', path: '/v1/symbols', description: 'Get available symbols' }
      ]
    },
    {
      id: 'robots',
      name: 'Robots',
      icon: Database,
      endpoints: [
        { id: 'robots-get', method: 'GET', path: '/v1/robots', description: 'Get all robots' },
        { id: 'robot-get', method: 'GET', path: '/v1/robots/{id}', description: 'Get a specific robot' },
        { id: 'robots-post', method: 'POST', path: '/v1/robots', description: 'Create a new robot' },
        { id: 'robots-put', method: 'PUT', path: '/v1/robots/{id}', description: 'Update a robot' },
        { id: 'robots-delete', method: 'DELETE', path: '/v1/robots/{id}', description: 'Delete a robot' },
        { id: 'robots-toggle', method: 'PUT', path: '/v1/robots/{id}/toggle', description: 'Toggle robot active status' }
      ]
    },
    {
      id: 'signals',
      name: 'Signals',
      icon: Shield,
      endpoints: [
        { id: 'signals-get', method: 'GET', path: '/v1/signals', description: 'Get trading signals' },
        { id: 'signals-post', method: 'POST', path: '/v1/signals', description: 'Create a new signal' }
      ]
    }
  ];

  // Filter endpoints based on search term
  const filteredCategories = apiCategories.map(category => ({
    ...category,
    endpoints: category.endpoints.filter(endpoint => 
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.endpoints.length > 0);

  // Get the active endpoint details
  const getEndpointDetails = () => {
    for (const category of apiCategories) {
      const endpoint = category.endpoints.find(e => e.id === activeEndpoint);
      if (endpoint) {
        return { ...endpoint, category: category.name };
      }
    }
    return null;
  };

  const activeEndpointDetails = getEndpointDetails();

  // Method color mapping
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Reference</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete reference documentation for the Trading Hub API
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search API endpoints..."
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h3>
              <nav className="space-y-4">
                {filteredCategories.map((category) => {
                  const CategoryIcon = category.icon;
                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-2">
                        <CategoryIcon className="w-4 h-4 text-gray-500" />
                        <span>{category.name}</span>
                      </div>
                      {category.endpoints.map((endpoint) => (
                        <button
                          key={endpoint.id}
                          onClick={() => setActiveEndpoint(endpoint.id)}
                          className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeEndpoint === endpoint.id
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <span className="text-left truncate">{endpoint.path}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
                
                {filteredCategories.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No endpoints found matching "{searchTerm}"</p>
                  </div>
                )}
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
              {activeEndpointDetails ? (
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium ${getMethodColor(activeEndpointDetails.method)}`}>
                      {activeEndpointDetails.method}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900">{activeEndpointDetails.path}</h2>
                  </div>
                  
                  <p className="text-lg text-gray-600 mb-6">{activeEndpointDetails.description}</p>
                  
                  {/* Endpoint Details */}
                  {activeEndpoint === 'account-get' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Request</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="relative">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`GET /v1/account HTTP/1.1
Host: api.tradinghub.com
Authorization: Bearer YOUR_API_KEY`}
                            </pre>
                            <button
                              onClick={() => handleCopy(`GET /v1/account HTTP/1.1
Host: api.tradinghub.com
Authorization: Bearer YOUR_API_KEY`)}
                              className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              {copiedText === `GET /v1/account HTTP/1.1
Host: api.tradinghub.com
Authorization: Bearer YOUR_API_KEY` ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Response</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="relative">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`HTTP/1.1 200 OK
Content-Type: application/json

{
  "accountNumber": "12345678",
  "serverName": "RoboForex-ECN",
  "balance": 10000.00,
  "equity": 10050.25,
  "margin": 250.50,
  "freeMargin": 9799.75,
  "marginLevel": 4011.28,
  "currency": "USD",
  "leverage": 100,
  "profit": 50.25
}`}
                            </pre>
                            <button
                              onClick={() => handleCopy(`HTTP/1.1 200 OK
Content-Type: application/json

{
  "accountNumber": "12345678",
  "serverName": "RoboForex-ECN",
  "balance": 10000.00,
  "equity": 10050.25,
  "margin": 250.50,
  "freeMargin": 9799.75,
  "marginLevel": 4011.28,
  "currency": "USD",
  "leverage": 100,
  "profit": 50.25
}`)}
                              className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              {copiedText === `HTTP/1.1 200 OK
Content-Type: application/json

{
  "accountNumber": "12345678",
  "serverName": "RoboForex-ECN",
  "balance": 10000.00,
  "equity": 10050.25,
  "margin": 250.50,
  "freeMargin": 9799.75,
  "marginLevel": 4011.28,
  "currency": "USD",
  "leverage": 100,
  "profit": 50.25
}` ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Response Fields</h3>
                        <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg overflow-hidden">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-300">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">accountNumber</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                              <td className="px-6 py-4 text-sm text-gray-500">MT5 account number</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">serverName</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                              <td className="px-6 py-4 text-sm text-gray-500">MT5 server name</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">balance</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Account balance</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">equity</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Account equity (balance + floating P/L)</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">margin</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Used margin</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">freeMargin</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Free margin available for new positions</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">marginLevel</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Margin level percentage</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">currency</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Account currency</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">leverage</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Account leverage</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">profit</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Current floating profit/loss</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Error Responses</h3>
                        <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg overflow-hidden">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Code</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-300">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">401</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Unauthorized - Invalid or missing API key</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">403</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Forbidden - Insufficient permissions</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">500</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Internal Server Error - Server-side error</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Code Examples</h3>
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">JavaScript</h4>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="relative">
                                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`// Using fetch
const getAccountInfo = async () => {
  const response = await fetch('https://api.tradinghub.com/v1/account', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`Error: \${response.status}\`);
  }
  
  const data = await response.json();
  console.log('Account Info:', data);
  return data;
};

getAccountInfo().catch(console.error);`}
                                </pre>
                                <button
                                  onClick={() => handleCopy(`// Using fetch
const getAccountInfo = async () => {
  const response = await fetch('https://api.tradinghub.com/v1/account', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`Error: \${response.status}\`);
  }
  
  const data = await response.json();
  console.log('Account Info:', data);
  return data;
};

getAccountInfo().catch(console.error);`)}
                                  className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                  {copiedText === `// Using fetch
const getAccountInfo = async () => {
  const response = await fetch('https://api.tradinghub.com/v1/account', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`Error: \${response.status}\`);
  }
  
  const data = await response.json();
  console.log('Account Info:', data);
  return data;
};

getAccountInfo().catch(console.error);` ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Python</h4>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="relative">
                                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`import requests

def get_account_info():
    url = "https://api.tradinghub.com/v1/account"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY"
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raise exception for 4XX/5XX responses
    
    data = response.json()
    print("Account Info:", data)
    return data

try:
    get_account_info()
except requests.exceptions.RequestException as e:
    print("Error:", e)`}
                                </pre>
                                <button
                                  onClick={() => handleCopy(`import requests

def get_account_info():
    url = "https://api.tradinghub.com/v1/account"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY"
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raise exception for 4XX/5XX responses
    
    data = response.json()
    print("Account Info:", data)
    return data

try:
    get_account_info()
except requests.exceptions.RequestException as e:
    print("Error:", e)`)}
                                  className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                  {copiedText === `import requests

def get_account_info():
    url = "https://api.tradinghub.com/v1/account"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY"
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raise exception for 4XX/5XX responses
    
    data = response.json()
    print("Account Info:", data)
    return data

try:
    get_account_info()
except requests.exceptions.RequestException as e:
    print("Error:", e)` ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeEndpoint === 'orders-post' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Request</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="relative">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`POST /v1/orders HTTP/1.1
Host: api.tradinghub.com
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "symbol": "EURUSD",
  "action": "BUY",
  "volume": 0.01,
  "stopLoss": 1.0800,
  "takeProfit": 1.0900
}`}
                            </pre>
                            <button
                              onClick={() => handleCopy(`POST /v1/orders HTTP/1.1
Host: api.tradinghub.com
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "symbol": "EURUSD",
  "action": "BUY",
  "volume": 0.01,
  "stopLoss": 1.0800,
  "takeProfit": 1.0900
}`)}
                              className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              {copiedText === `POST /v1/orders HTTP/1.1
Host: api.tradinghub.com
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "symbol": "EURUSD",
  "action": "BUY",
  "volume": 0.01,
  "stopLoss": 1.0800,
  "takeProfit": 1.0900
}` ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Request Parameters</h3>
                        <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg overflow-hidden">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-300">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">symbol</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Yes</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Trading symbol (e.g., "EURUSD")</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">action</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">string</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Yes</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Order type: "BUY", "SELL", or "CLOSE"</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">volume</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Yes</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Trade size in lots (e.g., 0.01)</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">stopLoss</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Stop loss price level</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">takeProfit</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">number</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Take profit price level</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Response</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="relative">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "orderId": 12345678,
  "message": "Order executed successfully"
}`}
                            </pre>
                            <button
                              onClick={() => handleCopy(`HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "orderId": 12345678,
  "message": "Order executed successfully"
}`)}
                              className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              {copiedText === `HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "orderId": 12345678,
  "message": "Order executed successfully"
}` ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Error Responses</h3>
                        <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg overflow-hidden">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Code</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Example</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-300">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">400</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Bad Request - Invalid parameters</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <pre className="bg-gray-100 p-2 rounded text-xs">
{`{
  "error": true,
  "code": "invalid_parameter",
  "message": "Invalid symbol"
}`}
                                </pre>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">401</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Unauthorized - Invalid or missing API key</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <pre className="bg-gray-100 p-2 rounded text-xs">
{`{
  "error": true,
  "code": "unauthorized",
  "message": "Invalid API key"
}`}
                                </pre>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">403</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Forbidden - Insufficient permissions</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <pre className="bg-gray-100 p-2 rounded text-xs">
{`{
  "error": true,
  "code": "forbidden",
  "message": "Insufficient permissions"
}`}
                                </pre>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">429</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Too Many Requests - Rate limit exceeded</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <pre className="bg-gray-100 p-2 rounded text-xs">
{`{
  "error": true,
  "code": "rate_limit_exceeded",
  "message": "Rate limit exceeded"
}`}
                                </pre>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">500</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Internal Server Error</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                <pre className="bg-gray-100 p-2 rounded text-xs">
{`{
  "error": true,
  "code": "server_error",
  "message": "Internal server error"
}`}
                                </pre>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Code Examples</h3>
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">JavaScript</h4>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="relative">
                                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`// Using fetch
const placeOrder = async () => {
  const response = await fetch('https://api.tradinghub.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      symbol: 'EURUSD',
      action: 'BUY',
      volume: 0.01,
      stopLoss: 1.0800,
      takeProfit: 1.0900
    })
  });
  
  if (!response.ok) {
    throw new Error(\`Error: \${response.status}\`);
  }
  
  const data = await response.json();
  console.log('Order placed:', data);
  return data;
};

placeOrder().catch(console.error);`}
                                </pre>
                                <button
                                  onClick={() => handleCopy(`// Using fetch
const placeOrder = async () => {
  const response = await fetch('https://api.tradinghub.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      symbol: 'EURUSD',
      action: 'BUY',
      volume: 0.01,
      stopLoss: 1.0800,
      takeProfit: 1.0900
    })
  });
  
  if (!response.ok) {
    throw new Error(\`Error: \${response.status}\`);
  }
  
  const data = await response.json();
  console.log('Order placed:', data);
  return data;
};

placeOrder().catch(console.error);`)}
                                  className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                  {copiedText === `// Using fetch
const placeOrder = async () => {
  const response = await fetch('https://api.tradinghub.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      symbol: 'EURUSD',
      action: 'BUY',
      volume: 0.01,
      stopLoss: 1.0800,
      takeProfit: 1.0900
    })
  });
  
  if (!response.ok) {
    throw new Error(\`Error: \${response.status}\`);
  }
  
  const data = await response.json();
  console.log('Order placed:', data);
  return data;
};

placeOrder().catch(console.error);` ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Python</h4>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="relative">
                                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`import requests
import json

def place_order():
    url = "https://api.tradinghub.com/v1/orders"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }
    payload = {
        "symbol": "EURUSD",
        "action": "BUY",
        "volume": 0.01,
        "stopLoss": 1.0800,
        "takeProfit": 1.0900
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()  # Raise exception for 4XX/5XX responses
    
    data = response.json()
    print("Order placed:", data)
    return data

try:
    place_order()
except requests.exceptions.RequestException as e:
    print("Error:", e)`}
                                </pre>
                                <button
                                  onClick={() => handleCopy(`import requests
import json

def place_order():
    url = "https://api.tradinghub.com/v1/orders"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }
    payload = {
        "symbol": "EURUSD",
        "action": "BUY",
        "volume": 0.01,
        "stopLoss": 1.0800,
        "takeProfit": 1.0900
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()  # Raise exception for 4XX/5XX responses
    
    data = response.json()
    print("Order placed:", data)
    return data

try:
    place_order()
except requests.exceptions.RequestException as e:
    print("Error:", e)`)}
                                  className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                  {copiedText === `import requests
import json

def place_order():
    url = "https://api.tradinghub.com/v1/orders"
    headers = {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }
    payload = {
        "symbol": "EURUSD",
        "action": "BUY",
        "volume": 0.01,
        "stopLoss": 1.0800,
        "takeProfit": 1.0900
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()  # Raise exception for 4XX/5XX responses
    
    data = response.json()
    print("Order placed:", data)
    return data

try:
    place_order()
except requests.exceptions.RequestException as e:
    print("Error:", e)` ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Add more endpoint details as needed */}
                  
                </div>
              ) : (
                <div className="text-center py-12">
                  <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Select an API endpoint from the sidebar</p>
                </div>
              )}
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

export default ApiReference;