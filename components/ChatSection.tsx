
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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, selectedContact]);

  const isChatOpen = currentUser.role === UserRole.MANAGER || (new Date().getHours() >= config.startHour && new Date().getHours() < config.endHour);
  const filteredMessages = messages.filter(m => (m.senderId === currentUser.id && m.receiverId === selectedContact?.id) || (m.senderId === selectedContact?.id && m.receiverId === currentUser.id)).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const handleSend = () => {
    if (!messageText.trim() || !selectedContact) return;
    onSendMessage(messageText, selectedContact.id);
    setMessageText('');
  };

  return (
    <div className="bg-white rounded-[2rem] card-shadow border border-orange-50 overflow-hidden flex flex-col md:flex-row h-[600px] font-['Quicksand']">
      <div className="w-full md:w-80 border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-50 bg-orange-50/30 font-black text-orange-600 text-xs uppercase">Contatos</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {availableContacts.map(contact => (
            <button key={contact.id} onClick={() => setSelectedContact(contact)} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedContact?.id === contact.id ? 'bg-orange-500 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-700'}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold gradient-aquarela text-white shadow-sm">{contact.name.charAt(0)}</div>
              <div className="text-left overflow-hidden"><p className="font-bold text-sm truncate">{contact.name}</p><p className="text-[9px] uppercase font-black opacity-60">Educação</p></div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-gray-50/50">
        {selectedContact ? (
          <>
            <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 font-bold text-black">{selectedContact.name}</div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl text-sm shadow-sm font-bold ${msg.senderId === currentUser.id ? 'bg-orange-500 text-white' : 'bg-white text-black border'}`}>{msg.content}</div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-gray-100">
              {isChatOpen ? (
                <div className="flex gap-2">
                  <input type="text" placeholder="Escreva aqui..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} className="flex-1 p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black outline-none border border-transparent focus:border-orange-200" />
                  <button onClick={handleSend} className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg">➤</button>
                </div>
              ) : <p className="text-center text-[10px] text-red-400 font-black uppercase">⚠️ Chat fechado fora do horário pedagógico.</p>}
            </div>
          </>
        ) : <div className="flex-1 flex flex-col items-center justify-center text-gray-400">Selecione uma conversa</div>}
      </div>
    </div>
  );
};

export default ChatSection;
