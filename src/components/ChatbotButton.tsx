import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { ChatbotWidget } from './ChatbotWidget';

interface ChatbotButtonProps {
  className?: string;
}

export const ChatbotButton: React.FC<ChatbotButtonProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={toggleChatbot}
        className={`fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center justify-center ${className}`}
        aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
      
      {isOpen && <ChatbotWidget initialOpen={true} />}
    </>
  );
};