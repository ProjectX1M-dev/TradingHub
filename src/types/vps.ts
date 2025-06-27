export interface VPSPlan {
  id: string;
  name: string;
  description: string;
  tokenCost: number;
  features: VPSFeature[];
  limits: VPSLimits;
  duration: 'monthly' | 'yearly' | 'lifetime';
  isActive: boolean;
}

export interface VPSFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface VPSLimits {
  maxRobots: number;
  maxPositions: number;
  trailingStops: boolean;
  advancedRiskManagement: boolean;
  priorityExecution: boolean;
  customAlgorithms: boolean;
  apiAccess: boolean;
  notifications: ('email' | 'sms' | 'webhook')[];
}

export interface UserVPSSubscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  tokensSpent: number;
  isActive: boolean;
  serverInstance?: VPSInstance;
}

export interface VPSInstance {
  id: string;
  userId: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  serverRegion: string;
  ipAddress?: string;
  lastHeartbeat: string;
  uptime: number;
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

export interface UserTokens {
  id: string;
  userId: string;
  balance: number;
  earned: number;
  spent: number;
  transactions: TokenTransaction[];
}

export interface TokenTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'purchased';
  amount: number;
  description: string;
  relatedService?: string;
  timestamp: string;
}