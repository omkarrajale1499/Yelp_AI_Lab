import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AIChat = () => {
  // --- REDUX SWAP ---
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am your YelpAI assistant. What kind of food are you in the mood for today?', recommendations: [] }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  if (!isAuthenticated) return null;

  const quickActions = [
    "Find dinner tonight",
    "Best rated near me",
    "Vegan options"
  ];

  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const formattedHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);

    try {
      const token = localStorage.getItem('token');
      
      // THE FIX: Point directly to the new AI Microservice on Port 8004
      const response = await fetch('http://localhost:8004/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: textToSend,
          conversation_history: formattedHistory
        })
      });

      if (!response.ok) throw new Error("Failed to connect to AI Service");
      
      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          recommendations: data.recommendations || []
        }
      ]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Oops! I had a little trouble connecting to my brain. Make sure Ollama is running and your AI service is up!', recommendations: [] }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: 'Chat cleared! What are we hungry for now?', recommendations: [] }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen ? (
        <div className="bg-white w-96 sm:w-[26rem] rounded-2xl shadow-2xl border border-gray-200 flex flex-col h-[600px] overflow-hidden transition-all duration-300 transform scale-100">
          
          <div className="bg-red-600 text-white p-4 flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="text-2xl">🤖</span> YelpAI Assistant
              </h3>
              <p className="text-red-100 text-xs mt-1">Powered by LangChain & Llama 3.1</p>
            </div>
            <div className="flex gap-3">
              <button onClick={clearChat} title="Clear Chat" className="text-red-100 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <button onClick={() => setIsOpen(false)} title="Close" className="text-red-100 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                
                <div className={`p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>

                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2 w-full">
                    {msg.recommendations.map((rec, i) => (
                      <div 
                        key={rec.id || `web-${i}`} 
                        onClick={() => rec.id ? navigate(`/restaurant/${rec.id}`) : null}
                        className={`bg-white text-black p-3 rounded-xl border shadow-sm transition-all group 
                          ${rec.id 
                            ? 'border-gray-200 cursor-pointer hover:border-red-500 hover:shadow-md' 
                            : 'border-blue-200 cursor-default'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className={`font-bold text-sm transition-colors ${rec.id ? 'group-hover:text-red-600' : 'text-blue-900'}`}>
                            {rec.name}
                          </p>
                          <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">
                            {Number(rec.rating).toFixed(1)} ★
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-xs font-medium">
                          <span className="text-gray-500">{rec.price}</span>
                          <span className="text-gray-300">•</span>
                          
                          {/* Conditional Badge: Show ID for DB, or Web tag for Tavily */}
                          {rec.id ? (
                             <span className="text-gray-500 flex items-center gap-1">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                               Database Options
                             </span>
                          ) : (
                             <span className="text-blue-600 font-bold flex items-center gap-1">
                               🌍 Live Web Result
                             </span>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 p-2 rounded border border-gray-100 mt-2">
                           <p className="text-xs text-gray-600 italic border-l-2 border-red-300 pl-2">
                             "{rec.reason}"
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isThinking && (
              <div className="self-start bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-3">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {quickActions.map(action => (
                  <button 
                    key={action}
                    onClick={() => handleSend(action)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1.5 px-3 rounded-full transition-colors border border-gray-200"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 relative">
              <input 
                type="text" 
                className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-red-500 focus:border-red-500 block w-full pl-4 pr-12 py-3 shadow-sm transition-colors"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for recommendations..."
                disabled={isThinking}
              />
              <button 
                onClick={() => handleSend()} 
                disabled={isThinking || !input.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
        >
          <span className="text-2xl mr-2 group-hover:animate-pulse">✨</span>
          <span className="font-bold">Ask AI</span>
        </button>
      )}
    </div>
  );
};

export default AIChat;