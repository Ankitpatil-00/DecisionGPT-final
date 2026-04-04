import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  BarChart2, 
  TrendingUp,
  Paperclip
} from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string | React.ReactNode;
  timestamp: string;
}

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatAssistant({ isOpen, onClose }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm DecisionGPT, your business intelligence copilot. Ask me anything about your retail transactions, sales trends, or customer patterns.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      let responseContent: string | React.ReactNode = "";
      
      const lowerInput = String(userMsg.content).toLowerCase();
      if (lowerInput.includes('product') && lowerInput.includes('most')) {
        responseContent = (
          <div className="space-y-3">
            <p>Based on your recent data, <strong>Wireless Earbuds</strong> is the top-selling product, generating ₹125,000 in revenue this quarter.</p>
            <div className="bg-background/50 rounded-lg p-3 border border-border mt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Top 3 Products</span>
                <BarChart2 size={14} className="text-primary" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Wireless Earbuds</span>
                    <span className="font-bold">4,500 units</span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Yoga Mat</span>
                    <span className="font-bold">2,800 units</span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } else if (lowerInput.includes('predict') || lowerInput.includes('next month')) {
        responseContent = (
          <div className="space-y-3">
            <p>My forecast model predicts a <strong>14.2% increase</strong> in revenue for next month, targeting roughly <strong>₹120,450</strong>.</p>
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium mt-2 p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp size={16} />
              <span>High confidence (94.8% accuracy)</span>
            </div>
          </div>
        );
      } else {
        responseContent = "That's an interesting question! Based on the current dataset 'Retail_Transactions_2023', I notice strong weekend sales patterns. Can you specify which category or time range you'd like to dive into?";
      }

      const aiMsg: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-6 lg:right-10 w-[350px] sm:w-[400px] h-[600px] max-h-[80vh] z-50 glass rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm">DecisionGPT</h3>
                <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Online and ready
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-primary-foreground/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${msg.type === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.type === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-primary/20 text-primary'
                }`}>
                  {msg.type === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                </div>
                <div>
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.type === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-card border border-border text-foreground rounded-tl-none shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className={`text-[10px] text-muted-foreground mt-1 block ${
                    msg.type === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex gap-3 max-w-[85%]"
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border rounded-tl-none shadow-sm flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t border-border shrink-0">
            <div className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your data..."
                className="w-full bg-background border border-border rounded-full pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              />
              <Paperclip size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full disabled:opacity-50 hover:bg-primary-hover transition-colors"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setInput("Which product sells the most?")} className="shrink-0 text-xs px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors whitespace-nowrap">
                Top products?
              </button>
              <button onClick={() => setInput("Predict sales for next month")} className="shrink-0 text-xs px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors whitespace-nowrap">
                Forecast next month
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
