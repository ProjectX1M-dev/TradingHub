/**
 * Utility functions for trading calculations including pip values and spread calculations
 */

/**
 * Get the pip value for a given symbol
 * Gold (XAUUSD) and Silver (XAGUSD) use 0.01 like JPY pairs
 * Most other currency pairs use 0.0001
 */
export function getPipValue(symbol: string): number {
  // Check if symbol is a valid string
  if (!symbol || typeof symbol !== 'string') {
    console.warn('getPipValue: Invalid symbol provided, using default pip value');
    return 0.0001; // Default pip value for standard forex pairs
  }

  // Handle precious metals
  if (symbol.includes('XAU')) { // Gold
    return 0.01;
  } else if (symbol.includes('XAG')) { // Silver
    return 0.01;
  } else if (symbol.includes('JPY')) { // JPY pairs
    return 0.01;
  } else if (symbol.includes('US30') || 
             symbol.includes('NAS100') || 
             symbol.includes('SPX500') ||
             symbol.includes('UK100') ||
             symbol.includes('GER30')) { // Indices
    return 0.01;
  } else if (symbol.includes('BTC')) { // Bitcoin
    return 1.0; // $1 movement is considered 1 pip for Bitcoin
  } else if (symbol.includes('ETH')) { // Ethereum
    return 0.1; // $0.1 movement is considered 1 pip for Ethereum
  } else if (symbol.includes('LTC') || 
             symbol.includes('XRP') ||
             symbol.includes('BCH')) { // Other major cryptos
    return 0.01;
  } else if (symbol.includes('OIL') || 
             symbol.includes('USOIL') || 
             symbol.includes('UKOIL')) { // Oil
    return 0.01;
  } else {
    return 0.0001; // Standard forex pairs
  }
}

/**
 * Get the pip multiplier for spread calculation
 * This is used to convert price differences to pips for display
 */
export function getPipMultiplier(symbol: string): number {
  // Check if symbol is a valid string
  if (!symbol || typeof symbol !== 'string') {
    console.warn('getPipMultiplier: Invalid symbol provided, using default pip multiplier');
    return 10000; // Default multiplier for standard forex pairs
  }

  // Handle precious metals
  if (symbol.includes('XAU')) { // Gold
    return 100;
  } else if (symbol.includes('XAG')) { // Silver
    return 100;
  } else if (symbol.includes('JPY')) { // JPY pairs
    return 100;
  } else if (symbol.includes('US30') || 
             symbol.includes('NAS100') || 
             symbol.includes('SPX500') ||
             symbol.includes('UK100') ||
             symbol.includes('GER30')) { // Indices
    return 100;
  } else if (symbol.includes('BTC')) { // Bitcoin
    return 1; // 1 pip = $1 movement
  } else if (symbol.includes('ETH')) { // Ethereum
    return 10; // 1 pip = $0.1 movement
  } else if (symbol.includes('LTC') || 
             symbol.includes('XRP') ||
             symbol.includes('BCH')) { // Other major cryptos
    return 100; // 1 pip = $0.01 movement
  } else if (symbol.includes('OIL') || 
             symbol.includes('USOIL') || 
             symbol.includes('UKOIL')) { // Oil
    return 100;
  } else {
    return 10000; // Standard forex pairs
  }
}

/**
 * Calculate stop loss and take profit prices based on pip distance
 */
export function calculateSLTP(
  entryPrice: number,
  action: 'BUY' | 'SELL',
  symbol: string,
  stopLossPips: number,
  takeProfitPips: number
): { stopLoss: number; takeProfit: number } {
  const pipValue = getPipValue(symbol);
  
  let stopLoss: number;
  let takeProfit: number;
  
  if (action === 'BUY') {
    stopLoss = entryPrice - (stopLossPips * pipValue);
    takeProfit = entryPrice + (takeProfitPips * pipValue);
  } else {
    stopLoss = entryPrice + (stopLossPips * pipValue);
    takeProfit = entryPrice - (takeProfitPips * pipValue);
  }
  
  return { stopLoss, takeProfit };
}

/**
 * Format price for display based on symbol
 */
export function formatPrice(price: number, symbol: string): string {
  // Check if symbol is a valid string
  if (!symbol || typeof symbol !== 'string') {
    return price.toFixed(5); // Default formatting
  }

  if (symbol.includes('JPY')) {
    return price.toFixed(3);
  } else if (symbol.includes('XAU') || symbol.includes('XAG')) {
    return price.toFixed(2);
  } else if (symbol.includes('BTC')) {
    return price.toFixed(1);
  } else if (symbol.includes('ETH')) {
    return price.toFixed(2);
  } else if (symbol.includes('US30') || 
             symbol.includes('NAS100') || 
             symbol.includes('SPX500') ||
             symbol.includes('UK100') ||
             symbol.includes('GER30')) {
    return price.toFixed(2);
  } else if (symbol.includes('OIL') || 
             symbol.includes('USOIL') || 
             symbol.includes('UKOIL')) {
    return price.toFixed(2);
  } else {
    return price.toFixed(5);
  }
}

/**
 * Calculate spread in pips
 */
export function calculateSpreadInPips(bid: number, ask: number, symbol: string): number {
  const spread = ask - bid;
  const pipMultiplier = getPipMultiplier(symbol);
  return spread * pipMultiplier;
}

/**
 * Calculate risk amount based on account balance, stop loss, and lot size
 * @param entryPrice Entry price
 * @param stopLossPrice Stop loss price
 * @param lotSize Lot size
 * @param symbol Trading symbol
 * @returns Risk amount in account currency
 */
export function calculateRiskAmount(
  entryPrice: number,
  stopLossPrice: number,
  lotSize: number,
  symbol: string
): number {
  if (!stopLossPrice || entryPrice === stopLossPrice) return 0;
  
  const pipValue = getPipValue(symbol);
  const priceDifference = Math.abs(entryPrice - stopLossPrice);
  const pips = priceDifference / pipValue;
  
  // Calculate pip value in account currency
  let valuePerPipPerStandardLot: number;
  
  // Check if symbol is a valid string before using includes
  if (!symbol || typeof symbol !== 'string') {
    valuePerPipPerStandardLot = 10.0; // Default value for standard forex pairs
  } else if (symbol.includes('XAU')) { // Gold
    valuePerPipPerStandardLot = 1.0; // $1 per 0.01 movement per oz
  } else if (symbol.includes('XAG')) { // Silver
    valuePerPipPerStandardLot = 0.5; // $0.50 per 0.01 movement per oz
  } else if (symbol.includes('JPY')) {
    valuePerPipPerStandardLot = 0.9; // Approx $0.90 per pip for standard lot
  } else if (symbol.includes('US30')) {
    valuePerPipPerStandardLot = 1.0; // $1 per point for US30
  } else if (symbol.includes('NAS100')) {
    valuePerPipPerStandardLot = 1.0; // $1 per point for NAS100
  } else if (symbol.includes('SPX500')) {
    valuePerPipPerStandardLot = 0.5; // $0.50 per point for SPX500
  } else if (symbol.includes('BTC')) {
    valuePerPipPerStandardLot = 1.0; // $1 per $1 movement
  } else if (symbol.includes('ETH')) {
    valuePerPipPerStandardLot = 1.0; // $1 per $0.1 movement
  } else if (symbol.includes('OIL') || symbol.includes('USOIL') || symbol.includes('UKOIL')) {
    valuePerPipPerStandardLot = 1.0; // $1 per 0.01 movement
  } else {
    valuePerPipPerStandardLot = 10.0; // Approx $10 per pip for standard lot for most forex pairs
  }
  
  // Scale by lot size (standard lot is 1.0)
  const riskPerPip = valuePerPipPerStandardLot * lotSize;
  
  // Calculate total risk
  const totalRisk = pips * riskPerPip;
  
  return totalRisk;
}

/**
 * Calculate optimal lot size based on risk percentage
 * @param balance Account balance
 * @param riskPercentage Risk percentage (1-100)
 * @param entryPrice Entry price
 * @param stopLossPrice Stop loss price
 * @param symbol Trading symbol
 * @returns Optimal lot size
 */
export function calculateOptimalLotSize(
  balance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLossPrice: number,
  symbol: string
): number {
  if (!stopLossPrice || entryPrice === stopLossPrice) return 0.01;
  
  // Calculate risk amount in account currency
  const riskAmount = balance * (riskPercentage / 100);
  
  const pipValue = getPipValue(symbol);
  const priceDifference = Math.abs(entryPrice - stopLossPrice);
  const pips = priceDifference / pipValue;
  
  // Calculate pip value in account currency for 1.0 lot
  let valuePerPipPerStandardLot: number;
  
  // Check if symbol is a valid string before using includes
  if (!symbol || typeof symbol !== 'string') {
    valuePerPipPerStandardLot = 10.0; // Default value for standard forex pairs
  } else if (symbol.includes('XAU')) { // Gold
    valuePerPipPerStandardLot = 1.0; // $1 per 0.01 movement per oz
  } else if (symbol.includes('XAG')) { // Silver
    valuePerPipPerStandardLot = 0.5; // $0.50 per 0.01 movement per oz
  } else if (symbol.includes('JPY')) {
    valuePerPipPerStandardLot = 0.9; // Approx $0.90 per pip for standard lot
  } else if (symbol.includes('US30')) {
    valuePerPipPerStandardLot = 1.0; // $1 per point for US30
  } else if (symbol.includes('NAS100')) {
    valuePerPipPerStandardLot = 1.0; // $1 per point for NAS100
  } else if (symbol.includes('SPX500')) {
    valuePerPipPerStandardLot = 0.5; // $0.50 per point for SPX500
  } else if (symbol.includes('BTC')) {
    valuePerPipPerStandardLot = 1.0; // $1 per $1 movement
  } else if (symbol.includes('ETH')) {
    valuePerPipPerStandardLot = 1.0; // $1 per $0.1 movement
  } else if (symbol.includes('OIL') || symbol.includes('USOIL') || symbol.includes('UKOIL')) {
    valuePerPipPerStandardLot = 1.0; // $1 per 0.01 movement
  } else {
    valuePerPipPerStandardLot = 10.0; // Approx $10 per pip for standard lot for most forex pairs
  }
  
  // Calculate optimal lot size
  const optimalLotSize = riskAmount / (pips * valuePerPipPerStandardLot);
  
  // Round to 2 decimal places and ensure minimum lot size
  return Math.max(0.01, Math.round(optimalLotSize * 100) / 100);
}