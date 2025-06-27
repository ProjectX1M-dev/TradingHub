# MT5 Trading Platform

A comprehensive MetaTrader 5 trading platform with automated signal processing, robot trading, and TradingView webhook integration.

## Features

### 🔐 MT5 Authentication
- Secure connection to MT5 servers
- Support for multiple brokers (RoboForex-ECN, ACGMarkets-Main, etc.)
- Real-time account information and balance tracking

### 📊 Trading Dashboard
- Live account summary with balance, equity, and margin
- Real-time positions monitoring
- Profit/loss tracking with visual indicators

### 🤖 Automated Trading Robots
- Create custom trading robots with different strategies
- Risk management with configurable lot sizes and stop losses
- Performance tracking with win rates and profit metrics
- Start/stop robots with one click

### 📡 TradingView Integration
- Webhook endpoint for TradingView alerts
- Automatic signal processing and execution
- Support for BUY, SELL, and CLOSE signals
- Real-time signal history and status tracking

### 🔄 Signal Management
- Manual and automated signal execution
- Configurable stop loss and take profit levels
- Signal source tracking (TradingView, manual)
- Execution status monitoring

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase (Database + Edge Functions)
- **Trading API**: MT5 API (mt5.mtapi.io)
- **Deployment**: Netlify

## Getting Started

### Prerequisites
- Node.js 18+ 
- MT5 trading account
- Supabase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Database Setup

The platform uses Supabase for data storage. Run the migration file to set up the required tables:

- `user_accounts` - MT5 account connections
- `trading_signals` - Signal history and status
- `trading_robots` - Automated trading bots
- `webhook_logs` - TradingView webhook logs

### TradingView Webhook Setup

1. Deploy the Supabase Edge Functions
2. Use the webhook URL in your TradingView alerts:
   ```
   https://your-project.supabase.co/functions/v1/tradingview-webhook
   ```

3. Configure your TradingView alert with JSON payload:
   ```json
   {
     "symbol": "EURUSD",
     "action": "BUY",
     "volume": 0.1,
     "price": 1.0850,
     "stopLoss": 1.0800,
     "takeProfit": 1.0900,
     "timestamp": "{{time}}",
     "strategy": "Your Strategy Name"
   }
   ```

## Supported Brokers

The platform supports various MT5 brokers including:
- RoboForex-ECN
- ACGMarkets-Main
- Alpari-MT5-Demo
- FXCM-USDDemo01
- ICMarkets-Demo02

## Security Features

- Row Level Security (RLS) on all database tables
- Secure MT5 API token handling
- User-specific data isolation
- Webhook payload validation

## Trading Robot Strategies

The platform supports multiple trading strategies:
- Scalping
- Trend Following
- Mean Reversion
- Breakout
- Grid Trading

Each robot can be configured with:
- Risk levels (Low, Medium, High)
- Maximum lot sizes
- Stop loss and take profit levels
- Symbol-specific trading

## API Integration

### MT5 API Endpoints Used:
- `/ConnectEx` - Authentication
- `/AccountSummary` - Account balance and equity
- `/AccountDetails` - Account information
- `/Positions` - Open positions
- `/OrderSend` - Place trades

### Webhook Processing:
- Automatic signal creation from TradingView alerts
- Robot activation based on signal criteria
- Trade execution with risk management
- Performance tracking and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the documentation
- Review the MT5 API documentation at https://mt5.mtapi.io/swagger/v1/swagger.json
- Open an issue on GitHub

## Disclaimer

This software is for educational and research purposes. Trading involves risk, and you should never trade with money you cannot afford to lose. Always test strategies on demo accounts before using real money.