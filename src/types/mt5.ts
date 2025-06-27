export interface MT5Credentials {
  username: string;
  password: string;
  server: string;
  email: string;
  accountType: 'demo' | 'live' | 'prop';
  nickname?: string;
  mt5AccountId?: string; // Added to store the user_accounts.id
}

export interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
  accountNumber: string;
  accountName: string;
  serverName: string;
  leverage: number;
  profit: number;
  credit: number;
  accountType?: 'demo' | 'live' | 'prop';
}

export interface Position {
  ticket: number;
  symbol: string;
  type: 'Buy' | 'Sell';
  volume: number;
  rawVolume?: number; // Store raw volume for API operations
  openPrice: number;
  currentPrice?: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
  comment: string;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  volume: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
  timestamp: string;
  source: 'tradingview' | 'manual';
  botToken?: string; // Bot token to target specific robot
  ticket?: number; // Added ticket field for targeted position closing
}

export interface Robot {
  id: string;
  name: string;
  symbol: string | null; // Made nullable to allow "All Symbols" robots
  isActive: boolean;
  strategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  maxLotSize: number;
  stopLoss: number;
  takeProfit: number;
  createdAt: string;
  botToken: string; // Add unique bot token
  mt5AccountId?: string; // Added to link robot to specific MT5 account
  performance: {
    totalTrades: number;
    winRate: number;
    profit: number;
  };
}

export interface WebhookPayload {
  symbol: string;
  action: string;
  price?: number;
  volume?: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: string;
  strategy?: string;
  botToken?: string; // Bot token to target specific robot
  ticket?: number; // Added ticket field for targeted position closing
}

export interface ConnectionResponse {
  success: boolean;
  token?: string | null; // Updated to accept null values
  message: string;
}