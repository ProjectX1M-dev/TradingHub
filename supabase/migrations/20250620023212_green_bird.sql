/*
  # Chatbot Knowledge Base Schema

  1. New Tables
    - `chatbot_knowledge` - Stores Q&A pairs for the chatbot
      - `id` (uuid, primary key)
      - `question_phrase` (text, not null) - Representative question or topic phrase
      - `answer_text` (text, not null) - Detailed answer the chatbot will provide
      - `keywords` (text[], null) - Array of keywords for search and matching
      - `category` (text, null) - For organizing knowledge (e.g., 'Robots', 'Signals')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `chatbot_knowledge` table
    - Add policy for authenticated users to view knowledge base entries
*/

-- Create chatbot_knowledge table
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_phrase text NOT NULL,
  answer_text text NOT NULL,
  keywords text[] DEFAULT '{}',
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE chatbot_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view knowledge base entries
CREATE POLICY "Authenticated users can view chatbot knowledge"
  ON chatbot_knowledge
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_chatbot_knowledge_updated_at
  BEFORE UPDATE ON chatbot_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on keywords for faster search
CREATE INDEX idx_chatbot_knowledge_keywords ON chatbot_knowledge USING GIN (keywords);

-- Create index on category for faster filtering
CREATE INDEX idx_chatbot_knowledge_category ON chatbot_knowledge (category);

-- Insert initial knowledge base entries
INSERT INTO chatbot_knowledge (question_phrase, answer_text, keywords, category) VALUES
-- General Platform Questions
('What is the MT5 Trading Platform?', 
 'The MT5 Trading Platform is a comprehensive trading solution that connects to MetaTrader 5 brokers. It offers automated trading robots, TradingView webhook integration, real-time signal processing, and advanced risk management tools. The platform supports both manual trading and algorithmic trading strategies.',
 ARRAY['platform', 'overview', 'introduction', 'about', 'mt5', 'metatrader'], 
 'General'),

('How do I get started with the platform?', 
 'To get started with the MT5 Trading Platform: 1) Create an account or sign in, 2) Connect your MT5 broker by providing your account credentials, 3) Choose between Algorithmic Trading or Live Trading modes, 4) For algo trading, create a robot or set up TradingView webhooks, 5) For live trading, use the trading panel to execute trades manually.',
 ARRAY['start', 'begin', 'setup', 'getting started', 'new user', 'onboarding'], 
 'General'),

-- Broker Connection
('How do I connect my broker?', 
 'To connect your broker: 1) Go to the Broker Setup page after login, 2) Select your account type (Live or Prop), 3) Enter your MT5 account number, 4) Enter your MT5 password, 5) Select your broker''s server from the dropdown, 6) Click "Connect Broker". Your account will be connected and you''ll be able to start trading.',
 ARRAY['broker', 'connect', 'mt5', 'account', 'credentials', 'setup'], 
 'Account Setup'),

('What brokers are supported?', 
 'The platform supports various MT5 brokers including: RoboForex-ECN, ACGMarkets-Main, Alpari-MT5-Demo, FXCM-USDDemo01, ICMarkets-Demo02, and many others. Any broker that provides MT5 access should be compatible with our platform.',
 ARRAY['brokers', 'supported', 'compatible', 'mt5', 'metatrader'], 
 'Account Setup'),

('What is the difference between Live and Prop accounts?', 
 'Live accounts are standard trading accounts with your own capital. Prop (proprietary) accounts are funded trading accounts provided by prop firms where you trade their capital and share profits. In our platform, the main difference is that prop accounts often use symbols with .raw extension (e.g., EURUSD.raw) while live accounts use standard symbols (e.g., EURUSD).',
 ARRAY['live', 'prop', 'account types', 'proprietary', 'funded', 'difference'], 
 'Account Setup'),

-- Trading Robots
('How do I create a trading robot?', 
 'To create a trading robot: 1) Go to the Algorithmic Trading dashboard, 2) Click "Create Robot", 3) Follow the 3-step wizard: a) Enter basic info (name, symbol, strategy), b) Configure risk settings (risk level, lot size, stop loss, take profit), c) Review and activate. Once created, you''ll receive a unique bot token for TradingView integration.',
 ARRAY['robot', 'create', 'new', 'trading bot', 'automated', 'algorithm'], 
 'Robots'),

('What trading strategies are available for robots?', 
 'The platform offers several built-in strategies for trading robots: 1) Scalping - Quick trades capturing small price movements, 2) Trend Following - Follow market trends for sustained moves, 3) Mean Reversion - Trade when price deviates from average, 4) Breakout - Trade when price breaks key levels, 5) Grid Trading - Place orders at regular intervals. Each strategy has different characteristics and is suitable for different market conditions.',
 ARRAY['strategies', 'robot', 'trading styles', 'algorithms', 'methods'], 
 'Robots'),

('How do risk levels work for robots?', 
 'Risk levels determine how aggressively your robot trades: 1) LOW (Conservative) - Minimal risk with steady growth, smaller position sizes, tighter stop losses, 2) MEDIUM (Balanced) - Moderate risk for balanced returns, 3) HIGH (Aggressive) - Higher risk for maximum returns, larger position sizes, wider stop losses. The platform automatically adjusts parameters based on your selected risk level.',
 ARRAY['risk', 'levels', 'conservative', 'aggressive', 'balanced', 'robot settings'], 
 'Robots'),

('How do I activate or deactivate a robot?', 
 'To activate or deactivate a robot: 1) Go to the Algorithmic Trading dashboard, 2) Find the robot you want to toggle, 3) Click the play/pause button on the robot card, or 4) Open the robot details and use the activate/deactivate button. Active robots will process signals automatically, while inactive robots won''t execute any trades.',
 ARRAY['activate', 'deactivate', 'toggle', 'enable', 'disable', 'robot', 'status'], 
 'Robots'),

-- TradingView Integration
('How do I set up TradingView webhooks?', 
 'To set up TradingView webhooks: 1) Go to the Webhooks tab in the dashboard, 2) Copy your unique webhook URL, 3) Copy your User ID, 4) In TradingView, create an alert and select "Webhook" as the notification, 5) Paste the webhook URL, 6) In the message field, create a JSON payload with your User ID, symbol, action, and other parameters, 7) Save the alert. When triggered, the webhook will send signals to your platform for automatic execution.',
 ARRAY['tradingview', 'webhook', 'alerts', 'integration', 'setup', 'connect'], 
 'Webhooks'),

('What should my TradingView webhook JSON look like?', 
 'Your TradingView webhook JSON should include: 1) symbol (e.g., "EURUSD"), 2) action ("BUY", "SELL", or "CLOSE"), 3) userId (your unique ID from the platform), 4) Optional: volume, stopLoss, takeProfit, botToken (to target a specific robot). Example: {"symbol": "EURUSD", "action": "BUY", "userId": "your-user-id", "botToken": "your-bot-token"}. Use {{close}} for dynamic price and {{time}} for timestamp.',
 ARRAY['json', 'webhook', 'format', 'tradingview', 'payload', 'structure'], 
 'Webhooks'),

('How do I target a specific robot with my webhook?', 
 'To target a specific robot with your webhook: 1) Go to the robot details page, 2) Find and copy the "Bot Token" (unique identifier for each robot), 3) Include this token in your TradingView webhook JSON payload as "botToken": "your-bot-token". This ensures that only the specified robot processes the signal, even if you have multiple robots for the same symbol.',
 ARRAY['target', 'specific', 'robot', 'bot token', 'webhook', 'tradingview'], 
 'Webhooks'),

-- Signals and Execution
('How do signals get executed?', 
 'Signal execution process: 1) Platform receives a signal via webhook or manual input, 2) Signal is stored in the database, 3) System checks for active robots matching the symbol or bot token, 4) If a matching robot is found, the system uses the robot''s settings (lot size, SL/TP) to execute the trade, 5) The MT5 API executes the trade on your broker account, 6) Signal status is updated to "executed" or "failed", 7) The trade appears in your positions list if successful.',
 ARRAY['execution', 'signals', 'process', 'workflow', 'trades', 'orders'], 
 'Signals'),

('Why are my signals not executing?', 
 'Common reasons for signals not executing: 1) No active robot for the symbol - create and activate a robot, 2) Missing User ID in webhook payload - ensure your userId is included, 3) MT5 token not stored - reconnect your broker, 4) Invalid symbol name - check symbol format for your account type, 5) Insufficient margin - check your account balance, 6) Market closed - verify market hours, 7) Invalid parameters - check volume, price, SL/TP values. Check the webhook logs for specific error messages.',
 ARRAY['troubleshoot', 'not working', 'failed', 'signals', 'execution', 'problems'], 
 'Signals'),

('How do I close a specific position?', 
 'To close a specific position: 1) For manual closing, go to Positions Manager and click the "Close" button next to the position, 2) For automated closing via webhook, send a CLOSE signal with the specific ticket number: {"symbol": "EURUSD", "action": "CLOSE", "userId": "your-user-id", "ticket": 12345678}. Including the ticket number ensures only that specific position is closed, rather than all positions for the symbol.',
 ARRAY['close', 'position', 'specific', 'ticket', 'trade', 'exit'], 
 'Signals'),

-- VPS and Tokens
('What are tokens used for?', 
 'Tokens are the platform''s internal currency used to purchase premium features: 1) VPS hosting plans for 24/7 trading, 2) Premium plugins like Multi-Account Manager, Advanced Signals, etc., 3) Access to advanced risk management tools. You earn tokens through platform usage, referrals, or by purchasing token packages. Your token balance is displayed in the top right of the dashboard.',
 ARRAY['tokens', 'currency', 'points', 'credits', 'purchase', 'premium'], 
 'Tokens'),

('How does VPS hosting work?', 
 'VPS (Virtual Private Server) hosting allows your trading robots to run 24/7, even when your computer is off: 1) Purchase a VPS plan using tokens, 2) Your robots are deployed to our secure cloud servers, 3) Trades execute automatically without requiring your local computer, 4) Advanced features like trailing stops become available, 5) You can monitor your VPS performance from the dashboard. VPS plans vary in price based on features and capacity.',
 ARRAY['vps', 'hosting', '24/7', 'server', 'cloud', 'always on'], 
 'VPS'),

-- Risk Management
('How do I manage risk effectively?', 
 'Effective risk management strategies: 1) Use the Risk Manager tool to set maximum risk per trade (1-2% recommended), 2) Set daily loss limits (5-10% recommended), 3) Use proper position sizing - the platform can calculate optimal lot sizes, 4) Always use stop losses - never trade without downside protection, 5) Diversify across multiple symbols and strategies, 6) Monitor correlation between positions, 7) Use the platform''s performance analytics to identify and improve underperforming strategies.',
 ARRAY['risk', 'management', 'protect', 'capital', 'drawdown', 'loss'], 
 'Risk Management'),

('What is the optimal position size?', 
 'Optimal position sizing depends on your risk tolerance, but a common approach is the 2% rule: never risk more than 2% of your account on a single trade. The platform can calculate this automatically: 1) In the trading panel, set your stop loss level, 2) Click the calculator button next to volume, 3) The system will calculate the optimal lot size based on your account balance, the currency pair, and the stop loss distance. This ensures consistent risk management across different symbols and market conditions.',
 ARRAY['position', 'size', 'lot', 'volume', 'risk', 'optimal', 'calculation'], 
 'Risk Management'),

-- Plugins
('What plugins are available?', 
 'The platform offers several premium plugins: 1) Multi-Account Manager - Connect and manage multiple MT5 accounts simultaneously, 2) Algo Bot Pack - Access advanced algorithmic trading strategies and indicators, 3) Advanced Signals - Premium trading signals and real-time alerts, 4) Risk Manager Pro - Advanced portfolio-level risk analysis and protection tools. Plugins can be purchased using tokens from the Plugins tab in the dashboard.',
 ARRAY['plugins', 'extensions', 'add-ons', 'premium', 'features', 'tools'], 
 'Plugins'),

-- Troubleshooting
('Why can''t I connect to my broker?', 
 'Common broker connection issues: 1) Incorrect account number - verify your MT5 login ID, 2) Wrong password - check for typos and case sensitivity, 3) Incorrect server - select the exact server name from your broker, 4) Account type mismatch - ensure you selected the right account type (Live/Prop), 5) Broker maintenance - check if your broker is undergoing maintenance, 6) Internet connection issues - verify your connection, 7) Firewall blocking - check your firewall settings. Try logging into the MT5 desktop app first to verify your credentials.',
 ARRAY['connection', 'broker', 'login', 'failed', 'cannot connect', 'error'], 
 'Troubleshooting'),

('How do I report a bug or request a feature?', 
 'To report a bug or request a feature: 1) Go to your Profile page, 2) Scroll down to the "Support" section, 3) Click "Report Bug" or "Feature Request", 4) Fill out the form with detailed information, 5) Submit the form. Our team will review your submission and respond as soon as possible. For urgent issues, you can also contact support directly at support@mt5platform.com.',
 ARRAY['bug', 'report', 'feature', 'request', 'support', 'help', 'contact'], 
 'Support');