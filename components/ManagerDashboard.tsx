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
  onAddStudent: (studentName: string, classId: string, guardianEmails: string) => void;
  onAddUser: (name: string, email: string, role: UserRole, password?: string) => void;
  onUpdateClassTeacher: (classId: string, teacherId: string) => void;
  onApprovePlan: (planId: string) => void;
  onCreatePost: (post: any) => void;
  onLikePost: (postId: string) => void;
  onSendMessage: (content: string, receiverId: string) => void;
  onUpdateChatConfig: (config: ChatConfig) => void;
  onSaveRoutine: (routine: Omit<RoutineEntry, 'id'>) => void;
  currentUserId: string;
  onDeleteClass: (id: string) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onAddEvent: (event: Omit<SchoolEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
  onAddMenu: (menu: Omit<SchoolMenu, 'id'> | SchoolMenu) => void;
  onDeleteMenu?: (id: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  classes, students, users, lessonPlans = [], posts, messages, chatConfig, events, menus, routines,
  onAddClass, onAddStudent, onAddUser, onUpdateClassTeacher, onApprovePlan, onCreatePost, 
  onLikePost, onSendMessage, onUpdateChatConfig, onSaveRoutine, currentUserId,
  onDeleteClass, onDeleteStudent, onDeleteUser, onAddEvent, onDeleteEvent, onAddMenu, onDeleteMenu
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'users' | 'plans' | 'mural' | 'chat' | 'events' | 'menu' | 'routines'>('classes');
  
  // Menu form states
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [mnDate, setMnDate] = useState(new Date().toISOString().split('T')[0]);
  const [mnCol, setMnCol] = useState('');
  const [mnAlm, setMnAlm] = useState('');
  const [mnLan, setMnLan] = useState('');
  const [mnJan, setMnJan] = useState('');

  const [studentName, setStudentName] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [guardianEmail1, setGuardianEmail1] = useState('');
  const [guardianEmail2, setGuardianEmail2] = useState('');
  const [guardianEmail3, setGuardianEmail3] = useState('');
  
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [className, setClassName] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evDesc, setEvDesc] = useState('');

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const INITIAL_ROUTINE = {
    date: new Date().toISOString().split('T')[0],
    attendance: 'present' as 'present' | 'absent',
    colacao: 'Comeu tudo', almoco: 'Comeu tudo', lanche: 'Comeu tudo', janta: 'Comeu tudo',
    banho: 'Sim', agua: 'Bebeu bastante', evacuacao: 'Sim', fralda: '1 troca',
    sleep: 'Dormiu bem', activities: '', observations: '', mood: 'happy' as any
  };

  const [routineData, setRoutineData] = useState<Omit<RoutineEntry, 'id' | 'studentId' | 'authorId'>>(INITIAL_ROUTINE);

  const handleAddMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mnDate) return alert("A data é obrigatória.");
    
    const menuPayload: any = { 
      date: mnDate, 
      colacao: mnCol, 
      almoco: mnAlm, 
      lanche: mnLan, 
      janta: mnJan 
    };
    
    if (editingMenuId) {
      menuPayload.id = editingMenuId;
    }

    onAddMenu(menuPayload);
    
    // Reset form
    setEditingMenuId(null);
    setMnCol(''); setMnAlm(''); setMnLan(''); setMnJan('');
    alert(editingMenuId ? "Cardápio atualizado!" : "Cardápio salvo!");
  };

  const startEditingMenu = (m: SchoolMenu) => {
    setEditingMenuId(m.id);
    setMnDate(m.date);
    setMnCol(m.colacao);
    setMnAlm(m.almoco);
    setMnLan(m.lanche);
    setMnJan(m.janta);
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'classes', label: 'TURMAS' }, { id: 'students', label: 'ALUNOS' }, { id: 'users', label: 'EQUIPE' },
          { id: 'routines', label: 'DIÁRIO' }, { id: 'plans', label: 'PEDAGÓGICO' }, { id: 'events', label: 'EVENTOS' }, 
          { id: 'menu', label: 'CARDÁPIO' }, { id: 'mural', label: 'MURAL' }, { id: 'chat', label: 'CHAT' }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'menu' ? (
            <div className="space-y-6">
              <form onSubmit={handleAddMenuSubmit} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <span>🍎</span> {editingMenuId ? 'Editar Cardápio' : 'Novo Cardápio'}
                  </h3>
                  {editingMenuId && (
                    <button type="button" onClick={() => {setEditingMenuId(null); setMnCol(''); setMnAlm(''); setMnLan(''); setMnJan('');}} className="text-[10px] font-black text-red-500 uppercase">Cancelar Edição</button>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Data do Cardápio</label>
                  <input required type="date" value={mnDate} onChange={e => setMnDate(e.target.value)} className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent focus:border-orange-200 outline-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Colação', value: mnCol, setter: setMnCol },
                    { label: 'Almoço', value: mnAlm, setter: setMnAlm },
                    { label: 'Lanche', value: mnLan, setter: setMnLan },
                    { label: 'Janta', value: mnJan, setter: setMnJan },
                  ].map(meal => (
                    <div key={meal.label} className="space-y-1">
                      <label className="text-[10px] font-black text-orange-400 uppercase ml-1">{meal.label}</label>
                      <input 
                        required
                        type="text" 
                        value={meal.value} 
                        onChange={e => meal.setter(e.target.value)} 
                        placeholder={`Cardápio do ${meal.label.toLowerCase()}`} 
                        className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black outline-none border border-transparent focus:border-orange-200" 
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest hover:scale-[1.01] transition-all">
                  {editingMenuId ? 'ATUALIZAR CARDÁPIO' : 'SALVAR NOVO CARDÁPIO'}
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menus.length === 0 ? (
                  <p className="col-span-full text-center py-12 text-gray-400 italic font-bold">Nenhum cardápio registrado ainda.</p>
                ) : (
                  menus.sort((a,b) => b.date.localeCompare(a.date)).map(m => (
                    <div key={m.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 group hover:border-orange-200 transition-all relative">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditingMenu(m)} className="p-2 bg-orange-50 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button onClick={() => onDeleteMenu?.(m.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                      <p className="font-black text-orange-600 text-[10px] uppercase mb-4 tracking-widest">{formatDate(m.date)}</p>
                      <div className="space-y-2 text-xs font-bold text-black">
                        <p><span className="text-orange-300 mr-2">●</span><span className="text-gray-400 uppercase text-[9px] font-black">Colação:</span> {m.colacao}</p>
                        <p><span className="text-orange-300 mr-2">●</span><span className="text-gray-400 uppercase text-[9px] font-black">Almoço:</span> {m.almoco}</p>
                        <p><span className="text-orange-300 mr-2">●</span><span className="text-gray-400 uppercase text-[9px] font-black">Lanche:</span> {m.lanche}</p>
                        <p><span className="text-orange-300 mr-2">●</span><span className="text-gray-400 uppercase text-[9px] font-black">Janta:</span> {m.janta}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'routines' ? (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-1 w-full">
                    <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Turma</label>
                    <select value={selectedClassId} onChange={e => {setSelectedClassId(e.target.value); setSelectedStudentId('');}} className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200">
                      <option value="">Selecione a Turma...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1 w-full">
                    <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Aluno</label>
                    <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} disabled={!selectedClassId} className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200 disabled:opacity-50">
                      <option value="">Selecione o Aluno...</option>
                      {students.filter(s => s.classId === selectedClassId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {selectedStudentId ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    onSaveRoutine({ ...routineData, studentId: selectedStudentId, authorId: currentUserId });
                    alert(`Diário salvo com sucesso!`);
                  }} className="space-y-6 pt-6 border-t animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center pb-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900">Diário de {students.find(s => s.id === selectedStudentId)?.name}</h3>
                      </div>
                      <input type="date" value={routineData.date} onChange={e => setRoutineData({...routineData, date: e.target.value})} className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full outline-none" />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                      <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Frequência Escolar</span>
                      <div className="flex bg-white p-1 rounded-xl shadow-inner">
                        <button type="button" onClick={() => setRoutineData({...routineData, attendance: 'present'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${routineData.attendance === 'present' ? 'bg-green-500 text-white shadow-md' : 'text-gray-400'}`}>PRESENTE</button>
                        <button type="button" onClick={() => setRoutineData({...routineData, attendance: 'absent'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${routineData.attendance === 'absent' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400'}`}>FALTOU</button>
                      </div>
                    </div>
                    
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${routineData.attendance === 'absent' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest">🍎 Alimentação</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {['Colação', 'Almoço', 'Lanche', 'Janta'].map(meal => (
                            <div key={meal}>
                              <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{meal}</label>
                              <select 
                                value={(routineData as any)[meal.toLowerCase().replace('ç','c')]} 
                                onChange={e => setRoutineData({...routineData, [meal.toLowerCase().replace('ç','c')]: e.target.value})}
                                className="w-full p-2 rounded-xl bg-gray-50 text-xs font-bold text-black border border-transparent outline-none focus:border-orange-200"
                              >
                                <option>Comeu tudo</option><option>Comeu bem</option><option>Recusou</option><option>Não ofertado</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest">🛁 Cuidados</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-[9px] font-black text-gray-400 uppercase ml-1">Banho</label><select value={routineData.banho} onChange={e => setRoutineData({...routineData, banho: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 text-xs font-bold text-black border border-transparent outline-none focus:border-orange-200"><option>Sim</option><option>Não</option></select></div>
                          <div><label className="text-[9px] font-black text-gray-400 uppercase ml-1">Sono</label><select value={routineData.sleep} onChange={e => setRoutineData({...routineData, sleep: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 text-xs font-bold text-black border border-transparent outline-none focus:border-orange-200"><option>Dormiu bem</option><option>Agitado</option></select></div>
                        </div>
                      </div>
                    </div>
                    <div className={`space-y-2 transition-opacity ${routineData.attendance === 'absent' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                      <label className="text-[10px] font-black text-orange-400 uppercase ml-1">🎨 Atividades</label>
                      <textarea value={routineData.activities} onChange={e => setRoutineData({...routineData, activities: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200 min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-orange-400 uppercase ml-1">📝 Observações</label>
                        {/* Fix: split the async operation from setRoutineData functional update to avoid invalid await */}
                        <button 
                          type="button" 
                          onClick={async () => {
                            setIsGenerating(true);
                            try {
                              const summary = await generateRoutineSummary(routineData.activities);
                              setRoutineData(p => ({...p, observations: summary}));
                            } catch (error) {
                              console.error(error);
                            } finally {
                              setIsGenerating(false);
                            }
                          }} 
                          disabled={isGenerating} 
                          className="text-[8px] font-black text-white bg-orange-400 px-3 py-1 rounded-full uppercase"
                        >
                          {isGenerating ? 'IA PROCESSANDO...' : '✨ SUGESTÃO IA'}
                        </button>
                      </div>
                      <textarea value={routineData.observations} onChange={e => setRoutineData({...routineData, observations: e.target.value})} className="w-full p-4 rounded-2xl bg-orange-50/30 text-sm font-bold text-black border border-orange-100 min-h-[80px]" />
                    </div>
                    <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">SALVAR COMO GESTOR</button>
                  </form>
                ) : (
                  <div className="py-12 text-center text-gray-400 italic font-bold">Selecione um aluno para gerenciar o diário.</div>
                )}
              </div>
            </div>
          ) : activeTab === 'classes' ? (
             <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-4">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><span>🏫</span> Criar Nova Turma</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Nome da Turma</label>
                      <input type="text" value={className} onChange={e => setClassName(e.target.value)} placeholder="Ex: Maternal I" className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent focus:border-orange-200 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Vincular Professor</label>
                      <select value={classTeacherId} onChange={e => setClassTeacherId(e.target.value)} className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent focus:border-orange-200 outline-none">
                        <option value="">Selecione o Professor...</option>
                        {users.filter(u => u.role === UserRole.TEACHER).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => {if(className){onAddClass(className, classTeacherId); setClassName(''); setClassTeacherId(''); alert("Turma criada!");}}} className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">CRIAR TURMA</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classes.map(c => (
                    <div key={c.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 group hover:border-orange-200 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-black text-gray-900 text-lg">{c.name}</p>
                          <p className="text-[10px] text-orange-500 font-black uppercase">Prof: {users.find(u => u.id === c.teacherId)?.name || 'Sem vínculo'}</p>
                        </div>
                        <button onClick={() => onDeleteClass(c.id)} className="text-gray-200 hover:text-red-500 p-2 transition-colors">✕</button>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alunos ({students.filter(s => s.classId === c.id).length})</p>
                    </div>
                  ))}
                </div>
              </div>
          ) : activeTab === 'events' ? (
            <div className="space-y-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                onAddEvent({ title: evTitle, date: evDate, description: evDesc, location: 'Escola' });
                setEvTitle(''); setEvDate(''); setEvDesc('');
                alert("Evento publicado!");
              }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><span>📅</span> Publicar Evento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Nome do Evento" className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200" />
                  <input required type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200" />
                </div>
                <textarea required value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Detalhes do evento..." className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent focus:border-orange-200 outline-none h-24" />
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">PUBLICAR EVENTO</button>
              </form>
              {events.map(ev => (
                <div key={ev.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 flex justify-between items-center">
                  <div>
                    <p className="font-black text-gray-900">{ev.title}</p>
                    <p className="text-[10px] font-black text-orange-500 uppercase">{formatDate(ev.date)}</p>
                  </div>
                  <button onClick={() => onDeleteEvent(ev.id)} className="text-gray-200 hover:text-red-500">✕</button>
                </div>
              ))}
            </div>
          ) : activeTab === 'plans' ? (
            <div className="space-y-6">
              {lessonPlans.sort((a,b) => b.date.localeCompare(a.date)).map(p => (
                <div key={p.id} className={`bg-white p-8 rounded-[2rem] card-shadow border-l-8 ${p.status === 'approved' ? 'border-green-400' : 'border-orange-400'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-gray-900 text-lg">{p.grade} — Aula {p.lessonNumber}</h4>
                      <p className="text-[10px] text-gray-400 font-black uppercase">{formatDate(p.date)}</p>
                    </div>
                    {p.status === 'pending' && <button onClick={() => onApprovePlan(p.id)} className="bg-orange-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">DAR VISTO</button>}
                  </div>
                  <p className="text-sm font-bold text-black bg-gray-50 p-4 rounded-2xl">{p.objective}</p>
                </div>
              ))}
            </div>
          ) : activeTab === 'mural' ? (
            <div className="space-y-6">
              <CreatePostForm onCreatePost={onCreatePost} />
              <FeedSection posts={posts} onLikePost={onLikePost} currentUserId={currentUserId} />
            </div>
          ) : activeTab === 'chat' ? (
            <ChatSection currentUser={users.find(u => u.id === currentUserId)!} users={users} messages={messages} config={chatConfig} onSendMessage={onSendMessage} availableContacts={users.filter(u => u.id !== currentUserId)} />
          ) : (
             <div className="bg-white p-8 rounded-[2rem] card-shadow">
                <h3 className="font-black text-xl mb-6 text-gray-900">Alunos Ativos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.map(s => (
                    <div key={s.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] relative group hover:shadow-lg transition-all">
                      <p className="font-black text-gray-900">{s.name}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase mt-1">{classes.find(c => c.id === s.classId)?.name}</p>
                      <button onClick={() => onDeleteStudent(s.id)} className="absolute top-6 right-6 text-gray-200 hover:text-red-500 p-2">✕</button>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>

        <div className="space-y-6">
          {activeTab === 'students' && (
             <div className="bg-yellow-50 rounded-[2rem] p-8 border border-yellow-100 shadow-inner">
                <h4 className="font-black text-yellow-800 mb-6 text-xs uppercase tracking-widest">👦 Matrícula</h4>
                <div className="space-y-4">
                  <input type="text" placeholder="Nome do Aluno" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-yellow-200 outline-none" />
                  <select value={targetClassId} onChange={e => setTargetClassId(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-yellow-200 outline-none">
                    <option value="">Selecione a Turma...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="email" placeholder="E-mail do Responsável" value={guardianEmail1} onChange={e => setGuardianEmail1(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-yellow-200 outline-none" />
                  <button onClick={() => {if(studentName && targetClassId && guardianEmail1){onAddStudent(studentName, targetClassId, guardianEmail1); setStudentName(''); setTargetClassId(''); setGuardianEmail1(''); alert("Matrícula realizada!");}}} className="w-full py-4 bg-yellow-400 text-yellow-900 font-black rounded-2xl text-xs uppercase shadow-lg">MATRICULAR</button>
                </div>
             </div>
          )}
          {activeTab === 'users' && (
            <div className="bg-orange-50 rounded-[2rem] p-8 border border-orange-100 shadow-inner">
              <h4 className="font-black text-orange-800 mb-6 text-xs uppercase tracking-widest">👩‍🏫 Equipe</h4>
              <div className="space-y-4">
                <input type="text" placeholder="Nome" value={tName} onChange={e => setTName(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-orange-200 outline-none" />
                <input type="email" placeholder="E-mail" value={tEmail} onChange={e => setTEmail(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-orange-200 outline-none" />
                <button onClick={() => {if(tName && tEmail){onAddUser(tName, tEmail, UserRole.TEACHER, '123'); setTName(''); setTEmail(''); alert("Equipe atualizada!");}}} className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl text-xs uppercase shadow-lg">CADASTRAR</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-[2rem] p-8 text-center border border-orange-100 flex flex-col items-center">
            <span className="text-4xl mb-4">🎨</span>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-relaxed">Painel de Gestão Aquarela</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;