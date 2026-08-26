import React, { useState, useRef, useEffect } from 'react';
import { chatbotAPI } from '../../services/api';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm FoodBot, your AI assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input.trim(), sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatbotAPI.sendMessage(input.trim());
      const botReply = {
        id: Date.now() + 1,
        text: response.data.reply || "I'm here to help! Could you rephrase that?",
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      const fallbackReply = {
        id: Date.now() + 1,
        text: getFallbackResponse(input.trim()),
        sender: 'bot',
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const getFallbackResponse = (message) => {
    const lower = message.toLowerCase();
    if (lower.includes('order') && lower.includes('status')) return "You can check your order status in the 'My Orders' section. Would you like me to help with anything else?";
    if (lower.includes('delivery') || lower.includes('time')) return "Typical delivery times are 30-45 minutes. You can track your order in real-time!";
    if (lower.includes('cancel')) return "To cancel an order, go to 'My Orders' and select the order you'd like to cancel. Note that cancellation depends on order status.";
    if (lower.includes('hello') || lower.includes('hi')) return "Hello! How can I assist you with your food delivery today?";
    if (lower.includes('menu') || lower.includes('food')) return "Browse our restaurant listings to see menus! Use the search bar to find specific cuisines or dishes.";
    return "I'd be happy to help! You can ask me about orders, delivery, restaurants, or any other questions.";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar">🤖</span>
              <div>
                <h4>FoodBot</h4>
                <span className="chatbot-status">Online</span>
              </div>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message bot">
                <div className="message-bubble typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
      <style>{`
        .chatbot-toggle {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--primary);
          color: var(--white);
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: var(--shadow-lg);
          z-index: 999;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chatbot-toggle:hover {
          transform: scale(1.1);
          background: var(--primary-dark);
        }
        .chatbot-window {
          position: fixed;
          bottom: 100px;
          right: 24px;
          width: 360px;
          height: 500px;
          background: var(--white);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chatbot-header {
          background: var(--primary);
          color: var(--white);
          padding: 16px;
        }
        .chatbot-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .chatbot-avatar {
          font-size: 28px;
        }
        .chatbot-header h4 {
          font-size: 16px;
          font-weight: 700;
        }
        .chatbot-status {
          font-size: 12px;
          opacity: 0.9;
        }
        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--gray-100);
        }
        .chat-message {
          display: flex;
        }
        .chat-message.user {
          justify-content: flex-end;
        }
        .message-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.4;
        }
        .chat-message.bot .message-bubble {
          background: var(--white);
          border-bottom-left-radius: 4px;
          box-shadow: var(--shadow-sm);
        }
        .chat-message.user .message-bubble {
          background: var(--primary);
          color: var(--white);
          border-bottom-right-radius: 4px;
        }
        .message-bubble.typing {
          display: flex;
          gap: 4px;
          padding: 14px 18px;
        }
        .message-bubble.typing span {
          width: 8px;
          height: 8px;
          background: var(--gray-400);
          border-radius: 50%;
          animation: bounce 1.4s infinite;
        }
        .message-bubble.typing span:nth-child(2) { animation-delay: 0.2s; }
        .message-bubble.typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .chatbot-input {
          display: flex;
          padding: 12px;
          border-top: 1px solid var(--gray-200);
          gap: 8px;
        }
        .chat-input {
          flex: 1;
          padding: 10px 14px;
          border: 2px solid var(--gray-300);
          border-radius: 20px;
          font-size: 14px;
          font-family: inherit;
          transition: var(--transition);
        }
        .chat-input:focus {
          outline: none;
          border-color: var(--primary);
        }
        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--primary);
          color: var(--white);
          border: none;
          font-size: 16px;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .send-btn:hover:not(:disabled) {
          background: var(--primary-dark);
        }
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 480px) {
          .chatbot-window {
            right: 8px;
            left: 8px;
            width: auto;
            bottom: 90px;
          }
        }
      `}</style>
    </>
  );
}

export default Chatbot;
