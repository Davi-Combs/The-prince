'use client';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { type: 'system', text: 'INITIALIZING PROTOCOL...' },
    { type: 'system', text: 'CONNECTING TO NEURAL LINK...' },
    { type: 'system', text: 'I AM A.L.PACA. TALK TO ME.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { type: 'user', text: `> ${input}` };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { type: 'system', text: 'THINKING...' }]);

    try {
      const res = await fetch('/api/ghost-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      
      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.text !== 'THINKING...');
        return [...newMessages, { type: 'ai', text: data.response }];
      });
    } catch (error) {
      setMessages(prev => [...prev, { type: 'error', text: 'SYSTEM CRASH.' }]);
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-purple-500 font-mono p-4 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#a855f7 1px, transparent 1px), linear-gradient(90deg, #a855f7 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div className="max-w-4xl mx-auto mt-10 border-2 border-purple-500 rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.5)] h-[80vh] flex flex-col relative z-10 bg-black/90">
        
        <div className="bg-purple-900 text-black p-2 font-bold flex justify-between items-center">
          <span>A.L.P.A.C.A. PROTOCOL</span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm md:text-lg">
          {messages.map((msg, i) => (
            <div key={i} className={`mb-2 ${msg.type === 'user' ? 'text-gray-300' : msg.type === 'error' ? 'text-red-500' : 'text-purple-400'}`}>
              {msg.type === 'ai' && <span className="mr-2">👑</span>}
              <span className="whitespace-pre-wrap">{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-purple-800 flex">
          <span className="text-purple-500 mr-2 animate-pulse">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me something..."
            className="flex-1 bg-transparent border-none outline-none text-purple-400 placeholder-purple-800"
            disabled={isLoading}
          />
        </form>
      </div>
    </main>
  );
}
