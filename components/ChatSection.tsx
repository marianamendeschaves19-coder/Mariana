
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatConfig, UserRole } from '../types';

interface ChatSectionProps {
  currentUser: User;
  users: User[];
  messages: ChatMessage[];
  config: ChatConfig;
  onSendMessage: (content: string, receiverId: string) => void;
  availableContacts: User[];
}

const ChatSection: React.FC<ChatSectionProps> = ({ currentUser, messages, config, onSendMessage, availableContacts }) => {
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedContact]);

  const now = new Date();
  const currentHour = now.getHours();
  const isChatOpen = currentUser.role === UserRole.MANAGER || (currentHour >= config.startHour && currentHour < config.endHour);

  const filteredMessages = messages.filter(m => 
    (m.senderId === currentUser.id && m.receiverId === selectedContact?.id) ||
    (m.senderId === selectedContact?.id && m.receiverId === currentUser.id)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const handleSend = () => {
    if (!messageText.trim() || !selectedContact) return;
    onSendMessage(messageText, selectedContact.id);
    setMessageText('');
  };

  return (
    <div className="bg-white rounded-[2rem] card-shadow border border-orange-50 overflow-hidden flex flex-col md:flex-row h-[600px]">
      {/* Lista de Contatos */}
      <div className="w-full md:w-80 border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-50 bg-orange-50/30">
          <h3 className="font-black text-orange-600 text-xs uppercase tracking-widest">Conversas</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {availableContacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedContact?.id === contact.id ? 'bg-orange-500 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${selectedContact?.id === contact.id ? 'bg-white/20' : 'gradient-aquarela text-white'}`}>
                {contact.name.charAt(0)}
              </div>
              <div className="text-left overflow-hidden">
                <p className="font-bold text-sm truncate">{contact.name}</p>
                <p className={`text-[9px] uppercase font-black opacity-60 ${selectedContact?.id === contact.id ? 'text-white' : 'text-orange-400'}`}>
                  {contact.role === UserRole.MANAGER ? 'GESTÃO' : contact.role === UserRole.TEACHER ? 'PROFESSOR' : 'RESPONSÁVEL'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Janela de Conversa */}
      <div className="flex-1 flex flex-col bg-gray-50/50">
        {selectedContact ? (
          <>
            <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 gradient-aquarela rounded-full flex items-center justify-center text-white text-xs font-black">{selectedContact.name.charAt(0)}</div>
              <h4 className="font-bold text-gray-800">{selectedContact.name}</h4>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl text-sm shadow-sm ${msg.senderId === currentUser.id ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[9px] mt-1 font-bold ${msg.senderId === currentUser.id ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white border-t border-gray-100">
              {!isChatOpen ? (
                <div className="bg-red-50 p-4 rounded-2xl text-center border border-red-100">
                  <p className="text-red-500 font-bold text-xs uppercase tracking-widest">
                    ⚠️ Chat Indisponível (Fora do Horário Pedagógico)
                  </p>
                  <p className="text-[10px] text-red-400 mt-1">Horário de atendimento: {config.startHour}:00 às {config.endHour}:00</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escreva sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 p-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-400 text-sm font-medium"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                    className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
              <span className="text-5xl">💬</span>
            </div>
            <h4 className="text-lg font-bold text-gray-600 mb-2">Canal Direto</h4>
            <p className="text-sm max-w-xs mx-auto">Selecione um contato na lateral para iniciar uma conversa pedagógica.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSection;
