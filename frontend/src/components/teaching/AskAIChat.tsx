import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AskAIChatProps {
  quotedText: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AskAIChat({ quotedText, isOpen, onClose }: AskAIChatProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = () => {
    if (!inputText.trim() && messages.length === 0) {
      // First message with just quoted text
      const userMessage = `I have a question about: "${quotedText}"`;
      setMessages([{ role: 'user', content: userMessage }]);
      simulateAIResponse(userMessage);
    } else if (inputText.trim()) {
      const fullMessage = messages.length === 0 
        ? `Regarding "${quotedText}": ${inputText}`
        : inputText;
      setMessages(prev => [...prev, { role: 'user', content: fullMessage }]);
      setInputText('');
      simulateAIResponse(fullMessage);
    }
  };

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    setTimeout(() => {
      const mockResponses = [
        "Great question! This concept is foundational to understanding Newton's laws. The key idea is that force and acceleration are directly proportional - when you double the force, you double the acceleration (assuming mass stays constant).",
        "Think of it this way: imagine pushing a shopping cart vs pushing a car. Same force, but very different accelerations because of the mass difference. This is exactly what F = ma describes!",
        "The mathematical relationship F = ma tells us that acceleration depends on both the force applied AND the mass of the object. Heavier objects need more force to achieve the same acceleration.",
      ];
      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="mt-3 rounded-2xl border border-border bg-card shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Ask AI</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quoted Text */}
          <div className="p-3 bg-accent/30 border-b border-border">
            <p className="text-xs text-muted-foreground mb-1">Asking about:</p>
            <p className="text-sm text-foreground italic line-clamp-2">"{quotedText}"</p>
          </div>

          {/* Messages */}
          <div className="max-h-48 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-sm rounded-xl p-3",
                  msg.role === 'user' 
                    ? "bg-primary/10 text-foreground ml-8" 
                    : "bg-muted text-foreground mr-4"
                )}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="bg-muted rounded-xl p-3 mr-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={messages.length === 0 ? "Add more context or just click send..." : "Ask a follow-up question..."}
                className="flex-1 px-3 py-2 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleSubmit}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
