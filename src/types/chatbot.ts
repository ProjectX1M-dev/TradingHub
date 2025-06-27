export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  relatedQuestions?: string[];
  relatedDocuments?: string[];
  isLoading?: boolean;
}

export interface ChatbotResponse {
  answer: string;
  source?: string;
  category?: string;
  confidence?: number;
  relatedQuestions?: string[];
}

export interface ChatbotRequest {
  query: string;
  userId?: string;
  conversationId?: string;
  previousMessages?: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}