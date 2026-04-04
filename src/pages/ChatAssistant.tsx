import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { chatWithData } from '../api';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatAssistant({ dataset, messages, setMessages }: { dataset: string | null, messages: Message[], setMessages: React.Dispatch<React.SetStateAction<Message[]>> }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !dataset) return;

    const userMsg = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const resp = await chatWithData(dataset, userMsg);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: resp.response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: "Error: " + (err.message || 'Failed to process request') }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Bot size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">AI Copilot Offline</h2>
        <p className="text-gray-500">Upload and select a dataset in the Data Manager to begin chatting.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[85vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="text-purple-500" size={24} /> DecisionGPT Copilot
          </h1>
          <p className="text-gray-500 text-sm mt-1">Chatting about dataset: <span className="font-semibold">{dataset}</span></p>
        </div>
      </div>

      <div className="flex-1 glass rounded-2xl border border-[#e2e8f0] dark:border-[#27272a] shadow-lg flex flex-col overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center mt-1 shadow-md">
                  <Bot size={18} className="text-white" />
                </div>
              )}
              
              <div 
                className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' 
                    : 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center mt-1">
                  <User size={18} className="text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center mt-1">
                <Bot size={18} className="text-white" />
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-75"></span>
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-150"></span>
              </div>
            </motion.div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-[#e2e8f0] dark:border-[#27272a]">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about revenue, top products, or trends..."
              className="w-full pl-6 pr-14 py-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-sm"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="text-center mt-3 flex justify-center gap-4 text-xs text-gray-500">
            <button className="hover:text-purple-500 transition-colors" onClick={() => setInput('Which product sells the most?')}>"Which product sells the most?"</button>
            <button className="hover:text-purple-500 transition-colors" onClick={() => setInput('What trends exist in this dataset?')}>"What trends exist in this dataset?"</button>
          </div>
        </div>
      </div>
    </div>
  );
}
