import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './AIChatBot.css';

const AIChatBot = ({ onAction, selectedPart, changeType, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hello! I'm your Windchill PLM assistant.\n\nI can help you with:\n🔹 **Risk Analysis:** Assess impact of part changes\n🔹 **Process Guidance:** ECN/ECR workflows\n🔹 **Part Management:** Search and analyze components\n🔹 **Best Practices:** Change management recommendations\n\nWhat would you like to know?",
      suggestions: [
        "Analyze risk for a part",
        "How to create an ECN?",
        "What can you help with?"
      ],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Build smart context from UI state
  const buildContext = () => {
    const context = {
      page: currentPage || getPageFromRoute(location.pathname),
      route: location.pathname
    };

    // Add selected part context if available
    if (selectedPart) {
      context.selected_part = {
        id: selectedPart.id,
        part_number: selectedPart.partNumber,
        name: selectedPart.name,
        lifecycle_state: selectedPart.lifecycleState,
        revision: selectedPart.revision,
        iteration: selectedPart.iteration
      };
    }

    // Add change type if on AI demo page
    if (changeType) {
      context.change_type = changeType;
    }

    return context;
  };

  const getPageFromRoute = (pathname) => {
    if (pathname.includes('/ai-demo')) return 'ai-demo';
    if (pathname.includes('/parts')) return 'parts';
    if (pathname.includes('/worklist')) return 'worklist';
    if (pathname.includes('/changes')) return 'changes';
    return 'unknown';
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext();
      
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: input,
          context: context,
          sessionId: `web-${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const data = result.data || result;

      const assistantMessage = {
        role: 'assistant',
        text: data.text || "I received your message!",
        suggestions: data.suggestions || [],
        actions: data.actions || [],
        actionParams: data.actionParams || data.action_params,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle special actions
      if (data.actions && data.actions.length > 0 && onAction) {
        data.actions.forEach(action => {
          onAction(action, data.actionParams || data.action_params);
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "⚠️ Sorry, I'm having trouble connecting right now.\n\nThis usually means:\n• ML service is starting up\n• Network connectivity issue\n• Service temporarily unavailable\n\nPlease try again in a moment.",
        suggestions: [
          "Try again",
          "Check system status"
        ],
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    // Auto-send after short delay
    setTimeout(() => {
      const textarea = document.querySelector('.ai-chat-input textarea');
      if (textarea && document.activeElement !== textarea) {
        // Manually trigger send since input state update is async
        handleSendWithText(suggestion);
      }
    }, 100);
  };

  const handleSendWithText = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext();
      
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: text,
          context: context,
          sessionId: `web-${Date.now()}`
        })
      });

      const result = await response.json();
      const data = result.data || result;

      const assistantMessage = {
        role: 'assistant',
        text: data.text || "I received your message!",
        suggestions: data.suggestions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.actions && onAction) {
        data.actions.forEach(action => onAction(action, data.actionParams || data.action_params));
      }

    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          className="ai-chat-bubble"
          onClick={() => setIsOpen(true)}
          title="Ask AI Assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="11" r="1" fill="currentColor"/>
            <circle cx="8" cy="11" r="1" fill="currentColor"/>
            <circle cx="16" cy="11" r="1" fill="currentColor"/>
          </svg>
          <span className="chat-bubble-badge">AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <div className="ai-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <strong>PLM Assistant</strong>
                <small>Context-Aware AI</small>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="btn-close-chat"
              title="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message chat-message--${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="message-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2"/>
                    </svg>
                  </div>
                )}
                <div className="message-content">
                  <div className="message-text">{msg.text}</div>
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="message-suggestions">
                      {msg.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="suggestion-chip"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message chat-message--assistant">
                <div className="message-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-chat-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about PLM..."
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="btn-send"
              title="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;