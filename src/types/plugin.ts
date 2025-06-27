export interface Plugin {
  id: string;
  name: string;
  description: string;
  tokenCost: number;
  features?: PluginFeature[];
  isActive: boolean;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PluginFeature {
  name: string;
  description: string;
}

export interface UserPlugin extends Plugin {
  userId: string;
}