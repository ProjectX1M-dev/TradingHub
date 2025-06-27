import { create } from 'zustand';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { ChatMessage, ChatbotResponse } from '../types/chatbot';
import toast from 'react-hot-toast';

interface ChatbotState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setError: (error: string | null) => void;
}

// Format response with numbered steps and better structure
const formatResponse = (text: string): string => {
  // Add markdown formatting for numbered lists
  let formattedText = text;
  
  // Convert "1) Step one" or "1. Step one" patterns to proper markdown numbered lists
  formattedText = formattedText.replace(/(\d+[\)\.]\s+)([^\n]+)/g, '$1 $2');
  
  // Add bold to section titles that end with a colon
  formattedText = formattedText.replace(/(^|\n)([^:\n]+):\s*(\n|$)/g, '$1**$2:**$3');
  
  // Add emphasis to important terms
  const importantTerms = [
    'trading robots', 'TradingView', 'webhook', 'signals', 'risk management',
    'tokens', 'VPS', 'bot token', 'User ID', 'JSON payload'
  ];
  
  importantTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    formattedText = formattedText.replace(regex, `**${term}**`);
  });
  
  return formattedText;
};

export const useChatbotStore = create<ChatbotState>((set, get) => ({
  messages: [
    {
      id: '1',
      role: 'system',
      content: 'Hi there! I\'m your MT5 Trading Platform assistant. How can I help you today?',
      timestamp: new Date(),
      relatedQuestions: [
        'How do I create a trading robot?',
        'How do I set up TradingView webhooks?',
        'What are tokens used for?'
      ]
    }
  ],
  isLoading: false,
  error: null,

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...message
    };

    set(state => ({
      messages: [...state.messages, newMessage]
    }));
  },

  sendMessage: async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    get().addMessage({
      role: 'user',
      content: content.trim()
    });

    // Add loading message
    const loadingMessageId = (Date.now() + 1).toString();
    set(state => ({
      messages: [...state.messages, {
        id: loadingMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true
      }],
      isLoading: true
    }));

    try {
      // Get previous messages for context (excluding system messages)
      const previousMessages = get().messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Call the chatbot API
      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          query: content.trim(),
          previousMessages
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: ChatbotResponse = await response.json();

      // Remove loading message
      set(state => ({
        messages: state.messages.filter(m => m.id !== loadingMessageId),
        isLoading: false
      }));

      // Format the response with better structure
      const formattedAnswer = formatResponse(data.answer);

      // Add assistant response
      get().addMessage({
        role: 'assistant',
        content: formattedAnswer,
        relatedQuestions: data.relatedQuestions,
        relatedDocuments: data.category ? [`${data.category} Documentation`] : undefined
      });
    } catch (error) {
      console.error('Error fetching chatbot response:', error);
      
      // Remove loading message
      set(state => ({
        messages: state.messages.filter(m => m.id !== loadingMessageId),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get response'
      }));
      
      // Add error message
      get().addMessage({
        role: 'assistant',
        content: "I'm having trouble connecting to the server. Please try again later."
      });
      
      toast.error('Failed to get chatbot response');
    }
  },

  clearMessages: () => {
    set({
      messages: [
        {
          id: '1',
          role: 'system',
          content: 'Hi there! I\'m your MT5 Trading Platform assistant. How can I help you today?',
          timestamp: new Date(),
          relatedQuestions: [
            'How do I create a trading robot?',
            'How do I set up TradingView webhooks?',
            'What are tokens used for?'
          ]
        }
      ]
    });
  },

  setError: (error) => {
    set({ error });
  }
}));