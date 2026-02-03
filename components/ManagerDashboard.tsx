
import React, { useState, useEffect } from 'react';
import { Class, Student, User, UserRole, LessonPlan, FeedPost, ChatMessage, ChatConfig, SchoolEvent, SchoolMenu, RoutineEntry } from '../types';
import CreatePostForm from './CreatePostForm';
import FeedSection from './FeedSection';
import ChatSection from './ChatSection';
import { generateRoutineSummary } from '../services/geminiService';

interface ManagerDashboardProps {
  classes: Class[];
  students: Student[];
  users: User[];
  lessonPlans: LessonPlan[];
  posts: FeedPost[];
  messages: ChatMessage[];
  chatConfig: ChatConfig;
  events: SchoolEvent[];
  menus: SchoolMenu[];
  routines: RoutineEntry[];
  onAddClass: (name: string, teacherId: string) => void;
  onUpdateClassTeacher: (classId: string, teacherId: string) => void;
  onDeleteClass: (id: string) => void;
  onAddStudent: (studentName: string, classId: string, guardianEmails: string) => void;
  onDeleteStudent: (id: string) => void;
  onAddUser: (name: string, email: string, role: UserRole, password?: string) => void;
  onDeleteUser: (id: string) => void;
  onAddEvent: (event: Partial<SchoolEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onAddMenu: (menu: Partial<SchoolMenu>) => void;
  onDeleteMenu: (id: string) => void;
  onApprovePlan: (planId: string) => void;
  onCreatePost: (post: any) => void;
  onLikePost: (postId: string) => void;
  onSendMessage: (content: string, receiverId: string) => void;
  onUpdateChatConfig: (config: ChatConfig) => void;
  onSaveRoutine: (routine: Omit<RoutineEntry, 'id'>) => void;
  currentUserId: string;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  classes, students, users, lessonPlans = [], posts, messages, chatConfig, events, menus, routines,
  onAddClass, onUpdateClassTeacher, onDeleteClass, onAddStudent, onDeleteStudent, 
  onAddUser, onDeleteUser, onAddEvent, onDeleteEvent, onAddMenu, onDeleteMenu,
  onApprovePlan, onCreatePost, onLikePost, onSendMessage, onUpdateChatConfig, onSaveRoutine, currentUserId
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'routines' | 'classes' | 'students' | 'users' | 'plans' | 'mural' | 'chat' | 'events'>('menu');
  
  // States de Formulário
  const [mnDate, setMnDate] = useState(new Date().toISOString().split('T')[0]);
  const [mnCol, setMnCol] = useState('');
  const [mnAlm, setMnAlm] = useState('');
  const [mnLan, setMnLan] = useState('');
  const [mnJan, setMnJan] = useState('');

  const [className, setClassName] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [guardianEmails, setGuardianEmails] = useState('');
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tRole, setTRole] = useState<UserRole>(UserRole.TEACHER);
  
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evLoc, setEvLoc] = useState('');

  // Estados de Rotina (Controle Total)
  const [selectedRoutineStudent, setSelectedRoutineStudent] = useState<Student | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [routineData, setRoutineData] = useState<Omit<RoutineEntry, 'id' | 'studentId' | 'authorId'>>({
    date: new Date().toISOString().split('T')[0],
    attendance: 'present', colacao: 'Comeu tudo', almoco: 'Comeu tudo', lanche: 'Comeu tudo', janta: 'Comeu tudo',
    banho: 'Não', agua: 'Bebeu bem', evacuacao: 'Não', fralda: 'Seca', sleep: 'Dormiu bem', activities: '', observations: '', mood: 'happy'
  });

  useEffect(() => {
    if (selectedRoutineStudent) {
      const existing = routines.find(r => r.studentId === selectedRoutineStudent.id && r.date === routineData.date);
      if (existing) setRoutineData({ ...existing } as any);
      else setRoutineData(prev => ({ ...prev, activities: '', observations: '', attendance: 'present' }));
    }
  }, [selectedRoutineStudent, routineData.date]);

  const handleRoutineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoutineStudent) return;
    onSaveRoutine({ ...routineData, studentId: selectedRoutineStudent.id, authorId: currentUserId });
    alert("Registro administrativo da rotina salvo com sucesso!");
  };

  const handleAISummary = async () => {
    setIsGenerating(true);
    const summary = await generateRoutineSummary(routineData.activities || "aprendizado pedagógico");
    setRoutineData(prev => ({ ...prev, observations: summary }));
    setIsGenerating(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      return d.toLocaleDateString('pt-BR');
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-6 font-['Quicksand']">
      <div className="flex gap-2 border-b overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'menu', label: 'CARDÁPIO' }, { id: 'routines', label: 'DIÁRIO' }, { id: 'classes', label: 'TURMAS' }, 
          { id: 'students', label: 'ALUNOS' }, { id: 'users', label: 'EQUIPE' }, { id: 'plans', label: 'PEDAGÓGICO' }, 
          { id: 'events', label: 'EVENTOS' }, { id: 'mural', label: 'MURAL' }, { id: 'chat', label: 'CHAT' }
        ].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-5 py-2.5 rounded-t-2xl font-black text-xs transition-all whitespace-nowrap tracking-widest ${activeTab === tab.id ? 'bg-orange-100 text-orange-600 border-b-4 border-orange-500' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'menu' && (
            <div className="space-y-6 animate-in fade-in">
              <form onSubmit={e => { e.preventDefault(); onAddMenu({ date: mnDate, colacao: mnCol, almoco: mnAlm, lanche: mnLan, janta: mnJan }); alert("Cardápio Atualizado!"); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><span>🍎</span> Gestão de Cardápio</h3>
                <input required type="date" value={mnDate} onChange={e => setMnDate(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Colação" value={mnCol} onChange={e => setMnCol(e.target.value)} className="p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200" />
                  <input placeholder="Almoço" value={mnAlm} onChange={e => setMnAlm(e.target.value)} className="p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200" />
                  <input placeholder="Lanche" value={mnLan} onChange={e => setMnLan(e.target.value)} className="p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200" />
                  <input placeholder="Janta" value={mnJan} onChange={e => setMnJan(e.target.value)} className="p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">SALVAR CARDÁPIO</button>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menus.map(m => (
                  <div key={m.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 group flex justify-between items-center transition-all hover:border-orange-200">
                    <div><p className="font-black text-orange-600 text-[10px] uppercase tracking-widest">{formatDate(m.date)}</p><p className="text-xs font-bold text-black mt-1 truncate">{m.almoco}</p></div>
                    <button onClick={() => onDeleteMenu(m.id)} className="text-red-300 hover:text-red-500 p-2">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="space-y-6 animate-in fade-in">
              <form onSubmit={e => { e.preventDefault(); onAddClass(className, classTeacherId); setClassName(''); setClassTeacherId(''); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
                <h3 className="text-xl font-black text-gray-900 leading-tight">🎨 Gerenciar Turma</h3>
                <input required placeholder="Nome da Turma" value={className} onChange={e => setClassName(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200" />
                <select required value={classTeacherId} onChange={e => setClassTeacherId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200">
                  <option value="">Selecione o Professor</option>
                  {users.filter(u => u.role === UserRole.TEACHER).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">SALVAR TURMA</button>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 flex justify-between items-center transition-all hover:border-orange-200">
                    <div><h4 className="font-black text-gray-900 text-sm">{c.name}</h4><p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Responsável: {users.find(u => u.id === c.teacherId)?.name}</p></div>
                    <button onClick={() => onDeleteClass(c.id)} className="text-red-300 hover:text-red-500 p-2">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'routines' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-100 flex flex-col md:flex-row gap-4 items-center">
                <select className="flex-1 p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black outline-none border-transparent focus:ring-2 focus:ring-orange-200" onChange={e => {
                  const student = students.find(s => s.id === e.target.value);
                  setSelectedRoutineStudent(student || null);
                }}>
                  <option value="">Selecione um Aluno para Controle...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({classes.find(c => c.id === s.classId)?.name})</option>)}
                </select>
                <input type="date" value={routineData.date} onChange={e => setRoutineData({...routineData, date: e.target.value})} className="p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black outline-none border-transparent focus:ring-2 focus:ring-orange-200" />
              </div>

              {selectedRoutineStudent ? (
                <form onSubmit={handleRoutineSubmit} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-8 animate-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="text-lg font-black text-gray-900">Diário Administrativo: {selectedRoutineStudent.name}</h3>
                    <div className="flex bg-gray-50 p-1 rounded-xl">
                      <button type="button" onClick={() => setRoutineData({...routineData, attendance: 'present'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${routineData.attendance === 'present' ? 'bg-green-500 text-white shadow-md' : 'text-gray-400'}`}>Presença</button>
                      <button type="button" onClick={() => setRoutineData({...routineData, attendance: 'absent'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${routineData.attendance === 'absent' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400'}`}>Falta</button>
                    </div>
                  </div>

                  {routineData.attendance === 'present' && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {['Colação', 'Almoço', 'Lanche', 'Janta'].map(field => (
                          <div key={field}>
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{field}</label>
                            <select value={(routineData as any)[field.toLowerCase().replace('ç','c')]} onChange={e => setRoutineData({...routineData, [field.toLowerCase().replace('ç','c')]: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                              <option>Comeu tudo</option><option>Comeu bem</option><option>Comeu pouco</option><option>Recusou</option>
                            </select>
                          </div>
                        ))}
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Água</label>
                          <select value={routineData.agua} onChange={e => setRoutineData({...routineData, agua: e.target.value})} className="w-full p-3 rounded-xl bg-blue-50/50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-blue-200 outline-none">
                            <option>Bebeu bem</option><option>Bebeu pouco</option><option>Recusou</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                         <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Banho</label>
                          <select value={routineData.banho} onChange={e => setRoutineData({...routineData, banho: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                            <option>Não</option><option>Sim</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Evacuação</label>
                          <select value={routineData.evacuacao} onChange={e => setRoutineData({...routineData, evacuacao: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                            <option>Não</option><option>Sim</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Fralda</label>
                          <select value={routineData.fralda} onChange={e => setRoutineData({...routineData, fralda: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                            <option>Seca</option><option>Molhada</option><option>Suja</option><option>Troca Regular</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Sono</label>
                          <select value={routineData.sleep} onChange={e => setRoutineData({...routineData, sleep: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                            <option>Dormiu bem</option><option>Agitado</option><option>Não dormiu</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Humor</label>
                          <select value={routineData.mood} onChange={e => setRoutineData({...routineData, mood: e.target.value as any})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                            <option value="happy">😊 Feliz</option><option value="calm">😌 Calmo</option><option value="fussy">😫 Agitado</option><option value="tired">😴 Cansado</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-l-4 border-orange-400 pl-3">🎨 Vivências</label>
                        <textarea placeholder="Atividades realizadas..." value={routineData.activities} onChange={e => setRoutineData({...routineData, activities: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200 min-h-[100px] resize-none" />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-l-4 border-orange-400 pl-3">📝 Observações e Recados</label><button type="button" onClick={handleAISummary} disabled={isGenerating} className="text-[9px] font-black text-white bg-orange-400 px-3 py-1 rounded-full uppercase tracking-tighter">{isGenerating ? 'IA Processando...' : 'Resumo IA'}</button></div>
                    <textarea value={routineData.observations} onChange={e => setRoutineData({...routineData, observations: e.target.value})} className="w-full p-4 rounded-2xl bg-orange-50/30 text-sm font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none min-h-[100px] resize-none" />
                  </div>
                  <button type="submit" className="w-full py-5 gradient-aquarela text-white font-black rounded-[2rem] shadow-xl uppercase text-xs tracking-[0.15em] transition-all hover:scale-[1.01] active:scale-95">SALVAR ALTERAÇÕES NO DIÁRIO</button>
                </form>
              ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-orange-100 text-orange-300 font-bold opacity-60">
                  <div className="text-5xl mb-4">👶</div>
                  <p>Selecione uma criança acima para exercer o controle gestor do diário.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in">
              <form onSubmit={e => { e.preventDefault(); onAddUser(tName, tEmail, tRole); setTName(''); setTEmail(''); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
                <h3 className="text-xl font-black text-gray-900 leading-tight">👥 Equipe Escolar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Nome Completo" value={tName} onChange={e => setTName(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200" />
                  <input required placeholder="E-mail" value={tEmail} onChange={e => setTEmail(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <select value={tRole} onChange={e => setTRole(e.target.value as UserRole)} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:ring-2 focus:ring-orange-200">
                  <option value={UserRole.TEACHER}>Professor(a)</option>
                  <option value={UserRole.MANAGER}>Gestor(a)</option>
                  <option value={UserRole.GUARDIAN}>Família</option>
                </select>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">SALVAR USUÁRIO</button>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {users.map(u => (
                  <div key={u.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 flex justify-between items-center transition-all hover:border-orange-200">
                    <div><h4 className="font-black text-black text-xs truncate">{u.name}</h4><p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{u.role}</p></div>
                    <button onClick={() => onDeleteUser(u.id)} className="text-red-300 hover:text-red-500 p-2">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
             <div className="space-y-6 animate-in fade-in">
               {lessonPlans.map(p => (
                 <div key={p.id} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-black text-black text-lg uppercase leading-tight">{p.grade} - Aula {p.lessonNumber}</h4>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{p.status === 'approved' ? 'Aprovado' : 'Pendente'}</span>
                    </div>
                    <p className="text-[10px] font-black text-orange-400 uppercase mb-4 tracking-widest">Docente: {users.find(u => u.id === p.teacherId)?.name}</p>
                    <p className="text-xs font-bold text-gray-700 italic mb-6 leading-relaxed">"{p.content}"</p>
                    {p.status === 'pending' && <button onClick={() => onApprovePlan(p.id)} className="w-full bg-green-500 text-white font-black text-[10px] py-4 rounded-[2rem] shadow-lg uppercase tracking-[0.15em] hover:bg-green-600 transition-all">AUTORIZAR PLANEJAMENTO</button>}
                 </div>
               ))}
             </div>
          )}

          {activeTab === 'mural' && <div className="space-y-8 animate-in fade-in"><CreatePostForm onCreatePost={onCreatePost} /><FeedSection posts={posts} onLikePost={onLikePost} currentUserId={currentUserId} /></div>}
          {activeTab === 'chat' && <div className="h-[700px]"><ChatSection currentUser={users.find(u => u.id === currentUserId)!} users={users} messages={messages} config={chatConfig} onSendMessage={onSendMessage} availableContacts={users.filter(u => u.id !== currentUserId)} /></div>}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[3rem] p-8 text-center border border-orange-100 flex flex-col items-center card-shadow sticky top-24">
            <div className="w-24 h-24 bg-orange-100 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-inner rotate-3 mb-6">🎨</div>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Painel Gestor</p>
            <h2 className="text-lg font-black text-gray-800 mt-2 mb-6 leading-tight px-2">{users.find(u => u.id === currentUserId)?.name}</h2>
            <div className="w-full space-y-3 pt-6 border-t border-gray-50">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"><span className="text-[9px] font-black text-gray-400 uppercase">Turmas</span><span className="text-sm font-black text-orange-500">{classes.length}</span></div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"><span className="text-[9px] font-black text-gray-400 uppercase">Alunos</span><span className="text-sm font-black text-orange-500">{students.length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
