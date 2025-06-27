import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader, Bot, User, HelpCircle, ThumbsUp, ThumbsDown, BookOpen, FileText, ExternalLink } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  relatedQuestions?: string[];
  relatedDocuments?: string[];
  isLoading?: boolean;
}

interface ChatbotWidgetProps {
  initialOpen?: boolean;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<Message[]>([
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
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSendMessage();
    }
  };

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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Add loading message
    const loadingMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }]);

    setIsLoading(true);

    try {
      // Call the chatbot API
      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          query: userMessage.content,
          previousMessages: messages
            .filter(m => m.role !== 'system')
            .map(m => ({
              role: m.role,
              content: m.content
            }))
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Remove loading message and add real response
      setMessages(prev => prev.filter(m => m.id !== loadingMessageId));
      
      // Format the response with better structure
      const formattedAnswer = formatResponse(data.answer);
      
      const botMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: formattedAnswer,
        timestamp: new Date(),
        relatedQuestions: data.relatedQuestions,
        relatedDocuments: data.category ? [`${data.category} Documentation`] : undefined
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching chatbot response:', error);
      
      // Remove loading message and add error message
      setMessages(prev => prev.filter(m => m.id !== loadingMessageId));
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to the server. Please try again later.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get chatbot response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelatedQuestionClick = (question: string) => {
    setInputValue(question);
    
    // Focus the input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    // In a real implementation, you would send this feedback to your backend
    toast.success(`Thank you for your ${isPositive ? 'positive' : 'negative'} feedback!`);
    
    // Remove feedback buttons from this message
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { ...m, relatedQuestions: undefined } 
        : m
    ));
  };

  const handleDocumentClick = (document: string) => {
    // In a real implementation, you would open the relevant documentation
    toast.success(`Opening ${document}...`);
    // For now, we'll just show a toast
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat toggle button */}
      <button
        onClick={handleToggleChat}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center justify-center"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col transition-all duration-300 overflow-hidden">
          {/* Chat header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-medium">Trading Assistant</h3>
            </div>
            <button
              onClick={handleToggleChat}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 max-h-96 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className="mb-4">
                {message.role === 'user' ? (
                  <div className="flex items-start justify-end">
                    <div className="bg-blue-100 text-blue-900 rounded-lg py-2 px-3 max-w-[80%]">
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : message.role === 'system' ? (
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <HelpCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-200 text-gray-800 rounded-lg py-2 px-3 max-w-[80%]">
                      <p className="text-sm">{message.content}</p>
                      {message.relatedQuestions && message.relatedQuestions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-600 font-medium">You can ask me about:</p>
                          {message.relatedQuestions.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => handleRelatedQuestionClick(question)}
                              className="block text-xs text-left text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg py-2 px-3 max-w-[80%] shadow-sm">
                      {message.isLoading ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader className="w-4 h-4 text-blue-500 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <div className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          
                          {/* Related documents */}
                          {message.relatedDocuments && message.relatedDocuments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
                                <BookOpen className="w-3 h-3" />
                                <span className="font-medium">Related Documentation:</span>
                              </div>
                              <div className="space-y-1">
                                {message.relatedDocuments.map((doc, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleDocumentClick(doc)}
                                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>{doc}</span>
                                    <ExternalLink className="w-2 h-2" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Feedback buttons */}
                          <div className="mt-2 flex justify-end space-x-2">
                            <button 
                              onClick={() => handleFeedback(message.id, true)}
                              className="text-gray-400 hover:text-green-500 transition-colors"
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleFeedback(message.id, false)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {/* Related questions */}
                          {message.relatedQuestions && message.relatedQuestions.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                              <p className="text-xs text-gray-500 font-medium">Related questions:</p>
                              {message.relatedQuestions.map((question, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleRelatedQuestionClick(question)}
                                  className="block text-xs text-left text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {question}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about trading..."
                className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 text-white rounded-r-lg py-2 px-3 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Ask about robots, signals, webhooks, or any platform feature
            </div>
          </div>
        </div>
      )}
    </div>
  );
};