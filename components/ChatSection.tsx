
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
  const [showMobileChat, setShowMobileChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, selectedContact, showMobileChat]);

  const isChatOpen = currentUser.role === UserRole.MANAGER || (new Date().getHours() >= config.startHour && new Date().getHours() < config.endHour);
  const filteredMessages = messages.filter(m => (m.senderId === currentUser.id && m.receiverId === selectedContact?.id) || (m.senderId === selectedContact?.id && m.receiverId === currentUser.id)).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const handleSend = () => {
    if (!messageText.trim() || !selectedContact) return;
    onSendMessage(messageText, selectedContact.id);
    setMessageText('');
  };

  const handleSelectContact = (contact: User) => {
    setSelectedContact(contact);
    setShowMobileChat(true);
  };

  return (
    <div className="bg-white rounded-[2rem] card-shadow border border-orange-50 overflow-hidden flex flex-col md:flex-row h-[70vh] md:h-[600px] font-['Quicksand'] relative">
      {/* Lista de Contatos */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-50 bg-orange-50/30">
          <h3 className="font-black text-orange-600 text-xs uppercase tracking-widest">Mensagens</h3>
          <p className="text-[9px] text-orange-400 font-bold mt-1">Selecione alguém para conversar</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {availableContacts.map(contact => (
            <button 
              key={contact.id} 
              onClick={() => handleSelectContact(contact)} 
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all group ${selectedContact?.id === contact.id ? 'bg-orange-500 text-white shadow-lg scale-[1.02]' : 'hover:bg-orange-50 text-gray-700'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-colors ${selectedContact?.id === contact.id ? 'bg-white/20 text-white' : 'gradient-aquarela text-white'}`}>
                {contact.name.charAt(0)}
              </div>
              <div className="text-left overflow-hidden flex-1">
                <p className="font-black text-sm truncate">{contact.name}</p>
                <p className={`text-[9px] uppercase font-black opacity-60 ${selectedContact?.id === contact.id ? 'text-white' : 'text-gray-400'}`}>
                  {contact.role === UserRole.MANAGER ? 'Gestão' : 'Professor(a)'}
                </p>
              </div>
              <div className={`w-2 h-2 rounded-full bg-orange-400 opacity-0 group-hover:opacity-100 transition-opacity ${selectedContact?.id === contact.id ? 'hidden' : ''}`} />
            </button>
          ))}
          {availableContacts.length === 0 && (
            <div className="text-center py-10 opacity-40">
              <p className="text-xs font-bold">Nenhum contato disponível</p>
            </div>
          )}
        </div>
      </div>

      {/* Área de Chat */}
      <div className={`flex-1 flex flex-col bg-gray-50/50 ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedContact ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 md:p-6 bg-white border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10">
              <button 
                onClick={() => setShowMobileChat(false)} 
                className="md:hidden p-2 -ml-2 text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="w-10 h-10 rounded-xl gradient-aquarela flex items-center justify-center text-white font-black text-sm shadow-sm">
                {selectedContact.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-gray-900 text-sm truncate leading-tight">{selectedContact.name}</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Online agora</span>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
              {filteredMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                  <div className="text-4xl">👋</div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Diga olá para {selectedContact.name.split(' ')[0]}!</p>
                </div>
              )}
              {filteredMessages.map((msg, idx) => {
                const isMine = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-[1.5rem] text-sm shadow-sm font-bold leading-relaxed ${
                      isMine 
                        ? 'bg-orange-500 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-orange-50 rounded-tl-none'
                    }`}>
                      {msg.content}
                      <div className={`text-[8px] mt-1 font-black uppercase opacity-50 text-right ${isMine ? 'text-white' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 md:p-6 bg-white border-t border-gray-100">
              {isChatOpen ? (
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Sua mensagem..." 
                      value={messageText} 
                      onChange={(e) => setMessageText(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                      className="w-full p-4 pr-12 rounded-2xl bg-gray-50 text-sm font-bold text-black border-2 border-transparent focus:border-orange-200 outline-none transition-all shadow-inner" 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl opacity-30">✨</div>
                  </div>
                  <button 
                    onClick={handleSend} 
                    disabled={!messageText.trim()}
                    className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
                  <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">
                    ⚠️ Chat disponível das {config.startHour}h às {config.endHour}h
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center">
            <div className="w-24 h-24 bg-orange-50 rounded-[2rem] flex items-center justify-center mb-6 rotate-6 shadow-inner">
              <span className="text-5xl">💬</span>
            </div>
            <h4 className="text-xl font-black text-gray-800">Suas Conversas</h4>
            <p className="text-sm font-bold text-gray-400 max-w-xs mt-2">Escolha um contato na lista ao lado para começar a conversar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSection;
