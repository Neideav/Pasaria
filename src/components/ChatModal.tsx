import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Store, User, MessageCircle, Clock, Sparkles } from 'lucide-react';
import { Conversation, Message, User as UserType } from '../types';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatters';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  initialShopId?: number;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialShopId,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadConversations();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id);
    }
  }, [activeConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const list = await api.getConversations();
      setConversations(list || []);

      if (initialShopId) {
        const found = list.find((c: Conversation) => c.shop_id === initialShopId);
        if (found) {
          setActiveConv(found);
        } else {
          // Start conversation with this shop
          try {
            const newConv = await api.startConversation(initialShopId);
            setConversations((prev) => [newConv, ...prev]);
            setActiveConv(newConv);
          } catch (e) {
            console.warn('Start conversation error:', e);
          }
        }
      } else if (list.length > 0) {
        setActiveConv(list[0]);
      }
    } catch (e) {
      console.warn('Load conversations error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: number) => {
    try {
      const msgs = await api.getMessages(convId);
      setMessages(msgs || []);
    } catch (e) {
      console.warn('Load messages error:', e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConv || sending) return;

    const text = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const newMsg = await api.sendMessage(activeConv.id, text);
      setMessages((prev) => [...prev, newMsg]);
      // Update snippet in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, last_message: text, last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch (e) {
      console.warn('Send message error:', e);
    } finally {
      setSending(false);
    }
  };

  const quickReplies = [
    'Halo, apakah produk ini masih tersedia?',
    'Kapan pesanan saya bisa dikirim?',
    'Apakah bisa request warna lain?',
    'Terima kasih, responnya sangat cepat!',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[620px] rounded-3xl shadow-2xl border border-slate-100 flex overflow-hidden text-left">
        {/* Left: Conversation List */}
        <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#003d29]" />
              <h2 className="font-extrabold text-slate-900 text-sm">Pesan PASARIA</h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
              {conversations.length} Obrolan
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Memuat percakapan...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Belum ada percakapan.</div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                const title = conv.shop?.name || `Toko #${conv.shop_id}`;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full p-3.5 flex items-start gap-3 transition-colors text-left cursor-pointer ${
                      isSelected ? 'bg-emerald-50/70 border-l-4 border-[#003d29]' : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 font-extrabold text-[#003d29] text-xs">
                      {conv.shop?.logo ? (
                        <img src={conv.shop.logo} alt={title} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        title.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">{title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {conv.last_message || 'Belum ada pesan terbaru'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Messages Thread */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            {activeConv ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#003d29] flex items-center justify-center font-bold text-xs">
                  <Store className="w-4 h-4 text-[#003d29]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeConv.shop?.name || `Toko #${activeConv.shop_id}`}
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online · Layanan Pelanggan Resmi
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Pilih percakapan untuk memulai chat</div>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
            {activeConv ? (
              messages.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-400">
                  Belum ada pesan. Sapa penjual sekarang!
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_type === 'customer';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMine
                            ? 'bg-[#003d29] text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        {m.message}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1">
                        {formatDateTime(m.created_at)}
                      </span>
                    </div>
                  );
                })
              )
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Pilih toko dari daftar di sebelah kiri.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {activeConv && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputMessage(qr)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-[#003d29] transition-colors cursor-pointer shrink-0"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          {activeConv && (
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tulis pesan ke penjual..."
                className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 focus:bg-white text-xs border border-transparent focus:border-[#003d29] focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="w-10 h-10 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
