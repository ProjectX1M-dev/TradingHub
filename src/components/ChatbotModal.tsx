import React, { useEffect, useRef } from 'react';
import { X, Send, Bot, User, HelpCircle, ThumbsUp, ThumbsDown, Loader, RefreshCw, BookOpen, FileText, ExternalLink } from 'lucide-react';
import { useChatbotStore } from '../stores/chatbotStore';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatbotModal: React.FC<ChatbotModalProps> = ({ isOpen, onClose }) => {
  const { messages, isLoading, sendMessage, clearMessages } = useChatbotStore();
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when modal is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleRelatedQuestionClick = (question: string) => {
    setInputValue(question);
    
    // Focus the input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFeedback = (isPositive: boolean) => {
    // In a real implementation, you would send this feedback to your backend
    toast.success(`Thank you for your ${isPositive ? 'positive' : 'negative'} feedback!`);
  };

  const handleReset = () => {
    clearMessages();
    toast.success('Conversation reset');
  };

  const handleDocumentClick = (document: string) => {
    // In a real implementation, you would open the relevant documentation
    toast.success(`Opening ${document}...`);
    // For now, we'll just show a toast
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col h-[80vh] max-h-[800px] overflow-hidden">
        {/* Chat header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <h3 className="font-medium">MT5 Trading Assistant</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              title="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
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
                            onClick={() => handleFeedback(true)}
                            className="text-gray-400 hover:text-green-500 transition-colors"
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleFeedback(false)}
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
        <div className="p-4 border-t border-gray-200 bg-white">
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
              className="bg-blue-600 text-white rounded-r-lg py-2 px-4 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};