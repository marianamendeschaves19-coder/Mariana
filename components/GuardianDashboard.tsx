
import React, { useState } from 'react';
import { Student, RoutineEntry, RoutineLog, FeedPost, ChatMessage, ChatConfig, User, UserRole, Class, SchoolEvent, SchoolMenu } from '../types';
import FeedSection from './FeedSection';
import ChatSection from './ChatSection';

interface GuardianDashboardProps {
  students: Student[];
  routines: RoutineEntry[];
  routineLogs: RoutineLog[];
  posts: FeedPost[];
  messages: ChatMessage[];
  chatConfig: ChatConfig;
  classes: Class[];
  users: User[];
  events: SchoolEvent[];
  menus: SchoolMenu[];
  onLikePost: (postId: string) => void;
  onSendMessage: (content: string, receiverId: string) => void;
  currentUserId: string;
}

const GuardianDashboard: React.FC<GuardianDashboardProps> = ({ 
  students, routines, routineLogs, posts, messages, chatConfig, classes, users, events, menus,
  onLikePost, onSendMessage, currentUserId 
}) => {
  const [activeTab, setActiveTab] = useState<'routines' | 'menu' | 'events' | 'mural' | 'chat'>('routines');
  const [selectedChild, setSelectedChild] = useState<Student | null>(students[0] || null);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const availableContacts = users.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.TEACHER);

  const studentRoutines = routines
    .filter(r => r.studentId === selectedChild?.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const getMoodEmoji = (mood: string) => {
    switch(mood) {
      case 'happy': return '😊 Feliz';
      case 'calm': return '😌 Calmo';
      case 'tired': return '😴 Cansado';
      case 'fussy': return '😫 Agitado';
      default: return '😊';
    }
  };

  return (
    <div className="space-y-6">
      {/* Menu Principal Família */}
      <div className="flex bg-white p-2 rounded-2xl card-shadow w-fit mx-auto md:mx-0 overflow-x-auto scrollbar-hide border border-orange-50">
        {[
          { id: 'routines', label: 'AGENDA' },
          { id: 'menu', label: 'CARDÁPIO' },
          { id: 'events', label: 'EVENTOS' },
          { id: 'mural', label: 'MURAL' },
          { id: 'chat', label: 'CHAT' }
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as any)} 
            className={`px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'chat' ? (
        <ChatSection currentUser={users.find(u => u.id === currentUserId)!} users={users} messages={messages} config={chatConfig} onSendMessage={onSendMessage} availableContacts={availableContacts} />
      ) : activeTab === 'mural' ? (
        <div className="space-y-6">
          <FeedSection posts={posts} onLikePost={onLikePost} currentUserId={currentUserId} />
        </div>
      ) : activeTab === 'events' ? (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-900 ml-1">Próximos Eventos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.length === 0 ? (
              <p className="text-gray-400 italic text-center col-span-full py-12">Nenhum evento agendado no momento.</p>
            ) : events.sort((a,b) => a.date.localeCompare(b.date)).map(ev => (
              <div key={ev.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl mb-4">📅</div>
                <h4 className="font-black text-gray-900 text-lg">{ev.title}</h4>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">{new Date(ev.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600 mt-4 font-medium leading-relaxed">{ev.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'menu' ? (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-900 ml-1">Cardápio da Escola</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menus.length === 0 ? (
              <p className="text-gray-400 italic text-center col-span-full py-12">O cardápio será atualizado em breve.</p>
            ) : menus.sort((a,b) => b.date.localeCompare(a.date)).map(m => (
              <div key={m.id} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 -mr-10 -mt-10 rounded-full opacity-30" />
                <p className="font-black text-orange-600 text-xs mb-6 uppercase tracking-widest relative">Dia {new Date(m.date).toLocaleDateString()}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                  <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Colação</p><p className="text-sm font-bold text-black">{m.colacao || '---'}</p></div>
                  <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/30"><p className="text-[9px] font-black text-orange-400 uppercase mb-1">Almoço</p><p className="text-sm font-bold text-black">{m.almoco || '---'}</p></div>
                  <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Lanche</p><p className="text-sm font-bold text-black">{m.lanche || '---'}</p></div>
                  <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/30"><p className="text-[9px] font-black text-orange-400 uppercase mb-1">Janta</p><p className="text-sm font-bold text-black">{m.janta || '---'}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
             <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest ml-1">Meus Pequenos</h3>
             {students.map(child => (
               <button 
                 key={child.id}
                 onClick={() => setSelectedChild(child)}
                 className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-3 ${selectedChild?.id === child.id ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-white border-gray-100 text-gray-600 hover:border-orange-200'}`}
               >
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner ${selectedChild?.id === child.id ? 'bg-white/20' : 'bg-orange-50'}`}>👶</div>
                 <div className="text-left overflow-hidden">
                   <p className="font-bold text-sm truncate">{child.name}</p>
                   <p className={`text-[9px] uppercase font-black opacity-60 ${selectedChild?.id === child.id ? 'text-white' : 'text-gray-400'}`}>
                     {classes.find(c => c.id === child.classId)?.name}
                   </p>
                 </div>
               </button>
             ))}
          </div>

          <div className="lg:col-span-3 space-y-6">
            {studentRoutines.length === 0 ? (
              <div className="bg-white p-16 rounded-[2rem] card-shadow text-center border-2 border-dashed border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📭</div>
                <h4 className="text-lg font-black text-gray-600">Nada por aqui ainda</h4>
                <p className="text-sm text-gray-400 font-medium">As rotinas de {selectedChild?.name} aparecerão aqui assim que publicadas.</p>
              </div>
            ) : (
              studentRoutines.map(routine => (
                <div key={routine.id} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 animate-in fade-in slide-in-from-bottom-4 space-y-8">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h4 className="text-lg font-black text-gray-900">Agenda de {formatDate(routine.date)}</h4>
                    <div className="flex items-center gap-2">
                       {routine.attendance === 'absent' ? (
                         <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">FALTOU</span>
                       ) : (
                         <span className="bg-green-100 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">PRESENTE</span>
                       )}
                       <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {getMoodEmoji(routine.mood)}
                      </span>
                    </div>
                  </div>

                  {/* Linha do Tempo de Registros */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">🕒 Linha do Tempo</h5>
                    <div className="space-y-4">
                      {routineLogs
                        .filter(l => l.studentId === selectedChild?.id && l.date === routine.date)
                        .sort((a, b) => b.time.localeCompare(a.time))
                        .map(log => (
                          <div key={log.id} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex gap-4">
                            <div className="text-center min-w-[50px]">
                              <p className="text-[10px] font-black text-orange-500">{log.time}</p>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] font-black text-white bg-orange-400 px-2 py-0.5 rounded uppercase">{log.category}</span>
                                <span className="text-[7px] font-bold text-gray-400 uppercase">Prof(a). {log.teacherName}</span>
                              </div>
                              <p className="text-xs font-bold text-gray-700">{log.content}</p>
                            </div>
                          </div>
                        ))}
                      {routineLogs.filter(l => l.studentId === selectedChild?.id && l.date === routine.date).length === 0 && (
                        <p className="text-[10px] text-gray-400 italic text-center py-2">Nenhum registro detalhado para este dia.</p>
                      )}
                    </div>
                  </div>

                  {routine.attendance === 'absent' && (
                    <div className="p-8 bg-red-50/50 rounded-[2rem] border border-red-100 text-center">
                      <p className="text-sm font-bold text-red-800">Criança ausente nesta data.</p>
                      {routine.observations && (
                        <div className="mt-4 p-4 bg-white/50 rounded-2xl italic text-gray-600 text-sm">
                          "{routine.observations}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardianDashboard;
