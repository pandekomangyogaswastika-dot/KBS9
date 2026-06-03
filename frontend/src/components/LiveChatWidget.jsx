import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, apiError } from '@/lib/apiClient';
import { toast } from 'sonner';

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'bot',
      text: 'Halo! 👋 Saya asisten virtual KTI. Ada yang bisa saya bantu?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const quickReplies = [
    { id: 1, text: 'Info Layanan', icon: '💼' },
    { id: 2, text: 'Konsultasi', icon: '📞' },
    { id: 3, text: 'Harga', icon: '💰' },
    { id: 4, text: 'Portofolio', icon: '🎨' },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response or call backend
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: getBotResponse(input),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (question) => {
    const q = question.toLowerCase();
    if (q.includes('layanan') || q.includes('service')) {
      return 'Kami menyediakan berbagai layanan IT seperti Custom Software, Web & Mobile Development, Cloud Infrastructure, AI & Automation, dan konsultasi IT. Mau tahu lebih detail yang mana?';
    }
    if (q.includes('harga') || q.includes('biaya') || q.includes('price')) {
      return 'Harga disesuaikan dengan kebutuhan dan scope project. Untuk mendapatkan estimasi yang akurat, silakan isi form konsultasi atau hubungi tim sales kami di +62 21 5000 1234.';
    }
    if (q.includes('konsultasi') || q.includes('contact')) {
      return 'Konsultasi awal gratis! Silakan klik tombol "Jadwalkan Konsultasi" atau langsung hubungi kami di halo@kubusteknologi.id';
    }
    if (q.includes('portfolio') || q.includes('portofolio') || q.includes('project')) {
      return 'Kami telah menyelesaikan 120+ project untuk berbagai industri. Lihat portfolio lengkap kami di halaman Portfolio atau Case Studies.';
    }
    return 'Terima kasih atas pertanyaannya! Tim kami akan segera merespon. Atau Anda bisa langsung hubungi kami di +62 21 5000 1234 atau halo@kubusteknologi.id';
  };

  const handleQuickReply = (reply) => {
    setInput(reply.text);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            data-testid="live-chat-button"
            className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full shadow-[0_8px_30px_rgba(124,104,225,0.4)] transition-all"
            style={{
              zIndex: 99999,
              background: 'linear-gradient(135deg, #7C68E1 0%, #73D1AD 100%)',
            }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '60px' : '600px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[380px] rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: 'rgba(11,13,23,0.98)',
              border: '1px solid rgba(124,104,225,0.3)',
              backdropFilter: 'blur(20px)',
              zIndex: 99999,
            }}
            data-testid="live-chat-window"
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(124,104,225,0.2) 0%, rgba(115,209,173,0.1) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Chat dengan KTI</h3>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  data-testid="chat-minimize-button"
                >
                  <Minimize2 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  data-testid="chat-close-button"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <div className="h-[440px] overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`chat-message-${msg.type}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <span className="text-[10px] opacity-60 mt-1 block">
                        {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Quick Replies */}
            {!isMinimized && messages.length === 1 && (
              <div className="px-4 pb-3">
                <p className="text-xs text-white/50 mb-2">Topik populer:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.id}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                      style={{
                        background: 'rgba(124,104,225,0.15)',
                        border: '1px solid rgba(124,104,225,0.3)',
                        color: 'rgba(232,234,242,0.8)',
                      }}
                      data-testid={`quick-reply-${reply.id}`}
                    >
                      {reply.icon} {reply.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            {!isMinimized && (
              <div 
                className="p-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ketik pesan..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                    data-testid="chat-input"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                    style={{
                      background: input.trim() ? 'linear-gradient(135deg, #7C68E1 0%, #73D1AD 100%)' : 'rgba(255,255,255,0.1)',
                    }}
                    data-testid="chat-send-button"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
