import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Loader2, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { getMomoRecommendation } from '../services/momoAIService';
import { Vendor } from '@/lib/supabase';
import MomoMascot from './momo/MomoMascot';
import { momoSound } from '@/utils/momoSoundEffects';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MomoChatProps {
  vendors: Vendor[];
}

const MomoChat: React.FC<MomoChatProps> = ({ vendors }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => momoSound.isEnabled());

  useEffect(() => {
    return momoSound.subscribe((enabled) => setIsSoundOn(enabled));
  }, []);

  // Initialize with welcome message when vendors are loaded
  useEffect(() => {
    if (vendors.length > 0 && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `“Hi! I’m Momo 😊 I’ll help you find the right vendors for your event.”\n\nI have complete knowledge of all **${vendors.length} vendors** on Happy Moments, including:\n\n✅ Services, portfolios & packages\n✅ Real pricing ranges & budget fits\n✅ Experience levels & verified reviews\n✅ Location coverage & availability\n\nWhat kind of event are you planning? Ask me anything!`,
          timestamp: new Date()
        }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors.length]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    momoSound.playBubblePop();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use AI service for intelligent recommendations
      const response = await getMomoRecommendation(userMessage.content, vendors);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      momoSound.playHamsterSqueak();
    } catch (error) {
      console.error('Error getting response from Momo:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered a temporary error. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-full flex flex-col bg-white/95 backdrop-blur-md border-2 border-orange-200 shadow-2xl">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                onClick={() => momoSound.playRandomCuteSound()}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-orange-200 cursor-pointer overflow-hidden group hover:scale-105 transition-transform"
                title="Click Momo to hear cute sounds!"
              >
                <MomoMascot size={42} isWaving={true} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-800">Momo</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100/90 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-2.5 h-2.5 text-orange-600" />
                    AI Event Advisor
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Knows all {vendors.length} vendors on Happy Moments</p>
              </div>
            </div>

            {/* Cute Sound Toggle */}
            <button
              onClick={() => momoSound.toggleSound()}
              className="p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-100/80 transition-colors cursor-pointer"
              title={isSoundOn ? 'Sound is ON (Click to mute)' : 'Sound is MUTED (Click to hear cute sounds)'}
              aria-label={isSoundOn ? 'Mute Momo cute sounds' : 'Enable Momo cute sounds'}
            >
              {isSoundOn ? (
                <Volume2 className="w-5 h-5 text-orange-500" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-white to-orange-50/20">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div
                  onClick={() => momoSound.playRandomCuteSound()}
                  className="w-8 h-8 rounded-full bg-white border border-orange-200 flex items-center justify-center flex-shrink-0 shadow-sm cursor-pointer hover:scale-110 transition-transform overflow-hidden"
                  title="Click Momo for a cute squeak!"
                >
                  <MomoMascot size={28} isWaving={false} />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm'
                    : 'bg-white border-2 border-orange-100 text-gray-800 shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className={`text-[10px] mt-1.5 font-medium ${message.role === 'user' ? 'text-orange-100' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-white border border-orange-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                <MomoMascot size={28} isWaving={true} />
              </div>
              <div className="bg-white border-2 border-orange-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2 text-xs font-semibold text-orange-600">
                <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                <span>Momo is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 sm:p-5 border-t border-orange-100 bg-white">
          <div className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Momo about vendors, recommendations, or event planning..."
              className="flex-1 px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-orange-50/20"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-5 sm:px-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 text-center font-medium">
            🐹 Momo has complete access to verified vendor pricing, reviews, and portfolio data
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MomoChat;


