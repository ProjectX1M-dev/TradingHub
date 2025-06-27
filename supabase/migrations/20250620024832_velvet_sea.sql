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

-- Create policy for authenticated users to view knowledge base entries (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chatbot_knowledge' 
    AND policyname = 'Authenticated users can view chatbot knowledge'
  ) THEN
    CREATE POLICY "Authenticated users can view chatbot knowledge"
      ON chatbot_knowledge
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create trigger for updated_at (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_chatbot_knowledge_updated_at'
  ) THEN
    CREATE TRIGGER update_chatbot_knowledge_updated_at
      BEFORE UPDATE ON chatbot_knowledge
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create index on keywords for faster search (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_keywords ON chatbot_knowledge USING GIN (keywords);

-- Create index on category for faster filtering (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_category ON chatbot_knowledge (category);

-- Insert initial knowledge base entries with improved formatting for steps
INSERT INTO chatbot_knowledge (question_phrase, answer_text, keywords, category) VALUES
-- General Platform Questions
('What is the MT5 Trading Platform?', 
 'The MT5 Trading Platform is a comprehensive trading solution that connects to MetaTrader 5 brokers. It offers automated trading robots, TradingView webhook integration, real-time signal processing, and advanced risk management tools. The platform supports both manual trading and algorithmic trading strategies.',
 ARRAY['platform', 'overview', 'introduction', 'about', 'mt5', 'metatrader'], 
 'General'),

('How do I get started with the platform?', 
 'To get started with the MT5 Trading Platform:\n\n1. Create an account or sign in\n2. Connect your MT5 broker by providing your account credentials\n3. Choose between Algorithmic Trading or Live Trading modes\n4. For algo trading, create a robot or set up TradingView webhooks\n5. For live trading, use the trading panel to execute trades manually\n\nRefer to our Getting Started Guide for more detailed instructions.',
 ARRAY['start', 'begin', 'setup', 'getting started', 'new user', 'onboarding'], 
 'General'),

-- Broker Connection
('How do I connect my broker?', 
 'To connect your broker:\n\n1. Go to the Broker Setup page after login\n2. Select your account type (Live or Prop)\n3. Enter your MT5 account number\n4. Enter your MT5 password\n5. Select your broker''s server from the dropdown\n6. Click "Connect Broker"\n\nYour account will be connected and you''ll be able to start trading immediately.',
 ARRAY['broker', 'connect', 'mt5', 'account', 'credentials', 'setup'], 
 'Account Setup'),

('What brokers are supported?', 
 'The platform supports various MT5 brokers including:\n\n- RoboForex-ECN\n- ACGMarkets-Main\n- Alpari-MT5-Demo\n- FXCM-USDDemo01\n- ICMarkets-Demo02\n\nAny broker that provides MT5 access should be compatible with our platform. If your broker isn''t in the dropdown list, please contact support.',
 ARRAY['brokers', 'supported', 'compatible', 'mt5', 'metatrader'], 
 'Account Setup'),

('What is the difference between Live and Prop accounts?', 
 'Live vs. Prop Accounts:\n\n**Live Accounts:**\n- Standard trading accounts with your own capital\n- Use standard symbols (e.g., EURUSD)\n- Full control over trading parameters\n\n**Prop (Proprietary) Accounts:**\n- Funded trading accounts provided by prop firms\n- Trade their capital and share profits\n- Often use symbols with .raw extension (e.g., EURUSD.raw)\n- May have specific rules and restrictions\n\nOur platform automatically handles the symbol differences based on your account type.',
 ARRAY['live', 'prop', 'account types', 'proprietary', 'funded', 'difference'], 
 'Account Setup'),

-- Trading Robots
('How do I create a trading robot?', 
 'To create a trading robot:\n\n1. Go to the Algorithmic Trading dashboard\n2. Click "Create Robot"\n3. Follow the 3-step wizard:\n   a. Enter basic info (name, symbol, strategy)\n   b. Configure risk settings (risk level, lot size, stop loss, take profit)\n   c. Review and activate\n4. Once created, you''ll receive a unique bot token for TradingView integration\n5. Use this token in your webhook payloads to target this specific robot\n\nYou can create multiple robots for different symbols and strategies.',
 ARRAY['robot', 'create', 'new', 'trading bot', 'automated', 'algorithm'], 
 'Robots'),

('What trading strategies are available for robots?', 
 'Available Trading Strategies:\n\n1. **Scalping**\n   - Quick trades capturing small price movements\n   - High frequency, small profits, quick execution\n   - Suitable for volatile markets\n\n2. **Trend Following**\n   - Follow market trends for sustained moves\n   - Medium frequency, trend-based, momentum driven\n   - Works best in trending markets\n\n3. **Mean Reversion**\n   - Trade when price deviates from average\n   - Counter-trend, statistical edge, range-bound\n   - Effective in oscillating markets\n\n4. **Breakout**\n   - Trade when price breaks key levels\n   - Volatility-based, level breaks, momentum\n   - Ideal for range breakouts\n\n5. **Grid Trading**\n   - Place orders at regular intervals\n   - Systematic, range markets, multiple orders\n   - Works in both trending and ranging markets',
 ARRAY['strategies', 'robot', 'trading styles', 'algorithms', 'methods'], 
 'Robots'),

('How do risk levels work for robots?', 
 'Risk Levels Explained:\n\n1. **LOW (Conservative)**\n   - Minimal risk with steady growth\n   - Smaller position sizes\n   - Tighter stop losses\n   - Recommended for capital preservation\n\n2. **MEDIUM (Balanced)**\n   - Moderate risk for balanced returns\n   - Standard position sizes\n   - Balanced stop loss and take profit\n   - Good for most traders\n\n3. **HIGH (Aggressive)**\n   - Higher risk for maximum returns\n   - Larger position sizes\n   - Wider stop losses\n   - For experienced traders only\n\nThe platform automatically adjusts parameters based on your selected risk level.',
 ARRAY['risk', 'levels', 'conservative', 'aggressive', 'balanced', 'robot settings'], 
 'Robots'),

('How do I activate or deactivate a robot?', 
 'To activate or deactivate a robot:\n\n1. Go to the Algorithmic Trading dashboard\n2. Find the robot you want to toggle\n3. Click the play/pause button on the robot card\n   OR\n4. Open the robot details and use the activate/deactivate button\n\nActive robots will process signals automatically, while inactive robots won''t execute any trades. You can toggle the status at any time.',
 ARRAY['activate', 'deactivate', 'toggle', 'enable', 'disable', 'robot', 'status'], 
 'Robots'),

-- TradingView Integration
('How do I set up TradingView webhooks?', 
 'Setting up TradingView Webhooks:\n\n1. Go to the Webhooks tab in the dashboard\n2. Copy your unique webhook URL\n3. Copy your User ID (critical for authentication)\n4. In TradingView, create an alert:\n   - Select "Webhook" as the notification\n   - Paste the webhook URL\n   - Create a JSON payload with required fields\n5. Include these fields in your JSON:\n   - symbol: "EURUSD"\n   - action: "BUY", "SELL", or "CLOSE"\n   - userId: "your-user-id"\n   - Optional: volume, stopLoss, takeProfit, botToken\n6. Save the alert\n\nWhen triggered, the webhook will send signals to your platform for automatic execution.',
 ARRAY['tradingview', 'webhook', 'alerts', 'integration', 'setup', 'connect'], 
 'Webhooks'),

('What should my TradingView webhook JSON look like?', 
 'TradingView Webhook JSON Format:\n\n```json\n{\n  "symbol": "EURUSD",\n  "action": "BUY",\n  "userId": "your-user-id",\n  "volume": 0.01,\n  "stopLoss": 1.0800,\n  "takeProfit": 1.0900,\n  "timestamp": "{{time}}",\n  "strategy": "Your Strategy Name",\n  "botToken": "your-bot-token"\n}\n```\n\n**Required Fields:**\n- symbol: Trading pair (e.g., "EURUSD")\n- action: "BUY", "SELL", or "CLOSE"\n- userId: Your unique ID from the platform\n\n**Optional Fields:**\n- volume: Trade size in lots (defaults to robot''s max lot size)\n- stopLoss/takeProfit: Price levels (if omitted, robot settings are used)\n- timestamp: Use {{time}} for TradingView''s dynamic time\n- strategy: Description of the signal\n- botToken: Target a specific robot (if omitted, any matching robot will execute)',
 ARRAY['json', 'webhook', 'format', 'tradingview', 'payload', 'structure'], 
 'Webhooks'),

('How do I target a specific robot with my webhook?', 
 'To target a specific robot with your webhook:\n\n1. Go to the robot details page\n2. Find and copy the "Bot Token" (unique identifier for each robot)\n3. Include this token in your TradingView webhook JSON payload:\n\n```json\n{\n  "symbol": "EURUSD",\n  "action": "BUY",\n  "userId": "your-user-id",\n  "botToken": "your-bot-token"\n}\n```\n\nThis ensures that only the specified robot processes the signal, even if you have multiple robots for the same symbol. Without a bot token, any active robot matching the symbol will process the signal.',
 ARRAY['target', 'specific', 'robot', 'bot token', 'webhook', 'tradingview'], 
 'Webhooks'),

-- Signals and Execution
('How do signals get executed?', 
 'Signal Execution Process:\n\n1. Platform receives a signal via webhook or manual input\n2. Signal is stored in the database\n3. System checks for active robots matching the symbol or bot token\n4. If a matching robot is found, the system uses the robot''s settings (lot size, SL/TP) to execute the trade\n5. The MT5 API executes the trade on your broker account\n6. Signal status is updated to "executed" or "failed"\n7. The trade appears in your positions list if successful\n\nThe entire process typically takes less than a second, ensuring timely execution of your trading signals.',
 ARRAY['execution', 'signals', 'process', 'workflow', 'trades', 'orders'], 
 'Signals'),

('Why are my signals not executing?', 
 'Common Reasons for Signal Execution Failure:\n\n1. **No Active Robot**\n   - Create and activate a robot for the symbol\n\n2. **Missing User ID**\n   - Ensure your userId is included in the webhook payload\n\n3. **MT5 Token Not Stored**\n   - Reconnect your broker to refresh the token\n\n4. **Invalid Symbol Name**\n   - Check symbol format for your account type\n   - Prop accounts may need .raw suffix\n\n5. **Insufficient Margin**\n   - Check your account balance and margin requirements\n\n6. **Market Closed**\n   - Verify market hours for the instrument\n\n7. **Invalid Parameters**\n   - Check volume, price, SL/TP values\n\nCheck the webhook logs in your dashboard for specific error messages.',
 ARRAY['troubleshoot', 'not working', 'failed', 'signals', 'execution', 'problems'], 
 'Signals'),

('How do I close a specific position?', 
 'To close a specific position:\n\n1. **Manual Closing**\n   - Go to Positions Manager\n   - Click the "Close" button next to the position\n\n2. **Automated Closing via Webhook**\n   - Send a CLOSE signal with the specific ticket number:\n\n```json\n{\n  "symbol": "EURUSD",\n  "action": "CLOSE",\n  "userId": "your-user-id",\n  "ticket": 12345678\n}\n```\n\nIncluding the ticket number ensures only that specific position is closed, rather than all positions for the symbol. You can find the ticket number in your Positions Manager.',
 ARRAY['close', 'position', 'specific', 'ticket', 'trade', 'exit'], 
 'Signals'),

-- VPS and Tokens
('What are tokens used for?', 
 'Tokens are the platform''s internal currency used for:\n\n1. **VPS Hosting Plans**\n   - 24/7 trading without your computer running\n   - Different tiers with varying features\n\n2. **Premium Plugins**\n   - Multi-Account Manager\n   - Advanced Signals\n   - Risk Manager Pro\n   - Algo Bot Pack\n\n3. **Advanced Features**\n   - Access to specialized tools and capabilities\n\nYou earn tokens through:\n- Platform usage\n- Referrals\n- Purchasing token packages\n\nYour token balance is displayed in the top right of the dashboard.',
 ARRAY['tokens', 'currency', 'points', 'credits', 'purchase', 'premium'], 
 'Tokens'),

('How does VPS hosting work?', 
 'VPS (Virtual Private Server) Hosting:\n\n1. **Purpose**\n   - Allows your trading robots to run 24/7\n   - Continues trading even when your computer is off\n\n2. **How to Set Up**\n   - Purchase a VPS plan using tokens\n   - Your robots are automatically deployed to our secure cloud servers\n   - No technical setup required on your part\n\n3. **Benefits**\n   - 24/7 uninterrupted trading\n   - Faster execution speeds\n   - Advanced features like trailing stops\n   - Reduced latency to broker servers\n\n4. **Monitoring**\n   - Track VPS performance from your dashboard\n   - View uptime, resource usage, and trading activity\n\nVPS plans vary in price based on features and capacity.',
 ARRAY['vps', 'hosting', '24/7', 'server', 'cloud', 'always on'], 
 'VPS'),

-- Risk Management
('How do I manage risk effectively?', 
 'Effective Risk Management Strategies:\n\n1. **Set Maximum Risk Per Trade**\n   - Use the Risk Manager tool\n   - 1-2% of account balance per trade is recommended\n\n2. **Set Daily Loss Limits**\n   - 5-10% of account balance is recommended\n   - Platform can automatically stop trading when reached\n\n3. **Use Proper Position Sizing**\n   - Let the platform calculate optimal lot sizes\n   - Based on account balance and stop loss distance\n\n4. **Always Use Stop Losses**\n   - Never trade without downside protection\n   - Set at logical market levels, not arbitrary prices\n\n5. **Diversify Your Trading**\n   - Trade multiple symbols and strategies\n   - Avoid correlated positions\n\n6. **Monitor Performance Analytics**\n   - Identify and improve underperforming strategies\n   - Focus on win rate and risk-reward ratio\n\n7. **Use Trailing Stops**\n   - Lock in profits as trades move in your favor\n   - Available with VPS hosting plans',
 ARRAY['risk', 'management', 'protect', 'capital', 'drawdown', 'loss'], 
 'Risk Management'),

('What is the optimal position size?', 
 'Calculating Optimal Position Size:\n\n1. **The 2% Rule**\n   - Never risk more than 2% of your account on a single trade\n   - This is the most widely recommended approach\n\n2. **Automatic Calculation**\n   - In the trading panel, set your stop loss level\n   - Click the calculator button next to volume\n   - The system calculates optimal lot size based on:\n     - Your account balance\n     - The currency pair''s pip value\n     - The stop loss distance\n\n3. **Manual Calculation Formula**\n   Risk Amount = Account Balance × Risk Percentage\n   Position Size = Risk Amount ÷ (Stop Loss Distance × Pip Value)\n\n4. **Example**\n   - $10,000 account with 2% risk = $200 risk per trade\n   - EURUSD with 50 pip stop loss\n   - 50 pips × $10 per pip per standard lot = $500 per standard lot\n   - $200 ÷ $500 = 0.4 lots\n\nThis ensures consistent risk management across different symbols and market conditions.',
 ARRAY['position', 'size', 'lot', 'volume', 'risk', 'optimal', 'calculation'], 
 'Risk Management'),

-- Plugins
('What plugins are available?', 
 'Available Premium Plugins:\n\n1. **Multi-Account Manager**\n   - Connect multiple MT5 accounts simultaneously\n   - Copy trades between accounts\n   - Individual risk settings per account\n   - Consolidated reporting\n   - Cost: 200 tokens\n\n2. **Algo Bot Pack**\n   - Advanced algorithmic trading strategies\n   - Machine learning optimization\n   - Custom indicators\n   - Backtesting tools\n   - Cost: 300 tokens\n\n3. **Advanced Signals**\n   - Premium trading signals\n   - Real-time market alerts\n   - Performance tracking\n   - Custom notification settings\n   - Cost: 250 tokens\n\n4. **Risk Manager Pro**\n   - Portfolio-level risk analysis\n   - Drawdown protection\n   - Correlation monitoring\n   - Risk-adjusted position sizing\n   - Cost: 150 tokens\n\nPlugins can be purchased using tokens from the Plugins tab in the dashboard.',
 ARRAY['plugins', 'extensions', 'add-ons', 'premium', 'features', 'tools'], 
 'Plugins'),

-- Troubleshooting
('Why can''t I connect to my broker?', 
 'Broker Connection Troubleshooting:\n\n1. **Incorrect Account Number**\n   - Verify your MT5 login ID\n   - Should be numeric only\n\n2. **Wrong Password**\n   - Check for typos and case sensitivity\n   - Reset password if necessary\n\n3. **Incorrect Server**\n   - Select the exact server name from your broker\n   - Check broker''s documentation for server names\n\n4. **Account Type Mismatch**\n   - Ensure you selected the right account type (Live/Prop)\n\n5. **Broker Maintenance**\n   - Check if your broker is undergoing maintenance\n   - Try again later\n\n6. **Internet Connection Issues**\n   - Verify your connection\n   - Try a different network\n\n7. **Firewall Blocking**\n   - Check your firewall settings\n\nTry logging into the MT5 desktop app first to verify your credentials.',
 ARRAY['connection', 'broker', 'login', 'failed', 'cannot connect', 'error'], 
 'Troubleshooting'),

('How do I report a bug or request a feature?', 
 'To Report a Bug or Request a Feature:\n\n1. **Go to Your Profile Page**\n   - Click on your username in the top right\n   - Select "Profile" from the dropdown\n\n2. **Find the Support Section**\n   - Scroll down to the "Support" section\n\n3. **Select Report Type**\n   - Click "Report Bug" or "Feature Request"\n\n4. **Complete the Form**\n   - Provide a clear title\n   - Include detailed information\n   - Add screenshots if applicable\n   - Specify steps to reproduce (for bugs)\n\n5. **Submit the Form**\n   - Click the "Submit" button\n\nOur team will review your submission and respond as soon as possible. For urgent issues, you can also contact support directly at support@mt5platform.com.',
 ARRAY['bug', 'report', 'feature', 'request', 'support', 'help', 'contact'], 
 'Support');