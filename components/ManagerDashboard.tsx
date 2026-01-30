
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
  onAddMenu: (menu: Omit<SchoolMenu, 'id'>) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  classes, students, users, lessonPlans = [], posts, messages, chatConfig, events, menus, routines,
  onAddClass, onAddStudent, onAddUser, onUpdateClassTeacher, onApprovePlan, onCreatePost, 
  onLikePost, onSendMessage, onUpdateChatConfig, onSaveRoutine, currentUserId,
  onDeleteClass, onDeleteStudent, onDeleteUser, onAddEvent, onDeleteEvent, onAddMenu
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'users' | 'plans' | 'mural' | 'chat' | 'events' | 'menu' | 'routines'>('classes');
  
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

  const [mnDate, setMnDate] = useState(new Date().toISOString().split('T')[0]);
  const [mnCol, setMnCol] = useState('');
  const [mnAlm, setMnAlm] = useState('');
  const [mnLan, setMnLan] = useState('');
  const [mnJan, setMnJan] = useState('');

  // Routine selection for Manager
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

  useEffect(() => {
    if (selectedStudentId) {
      const existing = routines.find(r => r.studentId === selectedStudentId && r.date === routineData.date);
      if (existing) {
        setRoutineData({
          date: existing.date,
          attendance: existing.attendance || 'present',
          colacao: existing.colacao,
          almoco: existing.almoco,
          lanche: existing.lanche,
          janta: existing.janta,
          banho: existing.banho,
          agua: existing.agua,
          evacuacao: existing.evacuacao,
          fralda: existing.fralda,
          sleep: existing.sleep,
          activities: existing.activities,
          observations: existing.observations,
          mood: existing.mood
        });
      } else {
        setRoutineData(prev => ({ ...INITIAL_ROUTINE, date: prev.date }));
      }
    }
  }, [selectedStudentId, routineData.date, routines]);

  const handleRoutineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    onSaveRoutine({ ...routineData, studentId: selectedStudentId, authorId: currentUserId });
    alert(`Diário salvo com sucesso!`);
  };

  const handleAISummary = async () => {
    setIsGenerating(true);
    const summary = await generateRoutineSummary(routineData.activities || "atividades escolares");
    setRoutineData(prev => ({ ...prev, observations: summary }));
    setIsGenerating(false);
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle || !evDate) return alert("Preencha o nome e a data do evento.");
    onAddEvent({ title: evTitle, date: evDate, description: evDesc, location: 'Escola' });
    setEvTitle(''); setEvDate(''); setEvDesc('');
    alert("Evento adicionado com sucesso!");
  };

  const handleAddMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mnDate) return alert("A data é obrigatória.");
    onAddMenu({ date: mnDate, colacao: mnCol, almoco: mnAlm, lanche: mnLan, janta: mnJan });
    setMnCol(''); setMnAlm(''); setMnLan(''); setMnJan('');
    alert("Cardápio salvo!");
  };

  const handleMatricula = () => {
    if(!studentName || !targetClassId || !guardianEmail1) return alert("Preencha os campos obrigatórios (Nome, Turma e E-mail do Responsável 1).");
    
    // Agrupar e-mails não vazios
    const emails = [guardianEmail1, guardianEmail2, guardianEmail3]
      .filter(email => email.trim() !== '')
      .join(',');
    
    onAddStudent(studentName, targetClassId, emails);
    
    setStudentName(''); 
    setTargetClassId(''); 
    setGuardianEmail1('');
    setGuardianEmail2('');
    setGuardianEmail3('');
    
    alert("Matrícula realizada com sucesso!");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const currentStudents = students.filter(s => s.classId === selectedClassId);
  const selectedStudentObj = students.find(s => s.id === selectedStudentId);

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
          {activeTab === 'routines' ? (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-1 w-full">
                    <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Turma</label>
                    <select 
                      value={selectedClassId} 
                      onChange={e => {setSelectedClassId(e.target.value); setSelectedStudentId('');}} 
                      className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200"
                    >
                      <option value="">Selecione a Turma...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1 w-full">
                    <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Aluno</label>
                    <select 
                      value={selectedStudentId} 
                      onChange={e => setSelectedStudentId(e.target.value)} 
                      disabled={!selectedClassId}
                      className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200 disabled:opacity-50"
                    >
                      <option value="">Selecione o Aluno...</option>
                      {currentStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {selectedStudentObj ? (
                  <form onSubmit={handleRoutineSubmit} className="space-y-6 pt-6 border-t animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center pb-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900">Diário de {selectedStudentObj.name}</h3>
                        {routines.some(r => r.studentId === selectedStudentId && r.date === routineData.date) && 
                          <p className="text-[10px] text-green-500 font-bold uppercase mt-1">✓ Registro existente (Gestão)</p>
                        }
                      </div>
                      <input type="date" value={routineData.date} onChange={e => setRoutineData({...routineData, date: e.target.value})} className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full outline-none" />
                    </div>

                    {/* Frequência */}
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                      <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Frequência Escolar</span>
                      <div className="flex bg-white p-1 rounded-xl shadow-inner">
                        <button 
                          type="button" 
                          onClick={() => setRoutineData({...routineData, attendance: 'present'})}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${routineData.attendance === 'present' ? 'bg-green-500 text-white shadow-md' : 'text-gray-400'}`}
                        >
                          PRESENTE
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setRoutineData({...routineData, attendance: 'absent'})}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${routineData.attendance === 'absent' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400'}`}
                        >
                          FALTOU
                        </button>
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
                                className="w-full p-2 rounded-xl bg-gray-50 text-xs font-bold text-black outline-none border border-transparent focus:border-orange-200"
                              >
                                <option>Comeu tudo</option><option>Comeu bem</option><option>Recusou</option><option>Não ofertado</option>
                              </select>
                            </div>
                          ))}
                          <div className="col-span-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Água</label>
                            <select value={routineData.agua} onChange={e => setRoutineData({...routineData, agua: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 text-xs font-bold text-black outline-none border border-transparent focus:border-orange-200">
                              <option>Bebeu bastante</option><option>Bebeu pouco</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest">🛁 Cuidados</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-[9px] font-black text-gray-400 uppercase ml-1">Banho</label><select value={routineData.banho} onChange={e => setRoutineData({...routineData, banho: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 text-xs font-bold text-black outline-none border border-transparent focus:border-orange-200"><option>Sim</option><option>Não</option></select></div>
                          <div><label className="text-[9px] font-black text-gray-400 uppercase ml-1">Evacuação</label><select value={routineData.evacuacao} onChange={e => setRoutineData({...routineData, evacuacao: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 text-xs font-bold text-black outline-none border border-transparent focus:border-orange-200"><option>Sim</option><option>Não</option></select></div>
                          <div><label className="text-[9px] font-black text-gray-400 uppercase ml-1">Fraldas</label><select value={routineData.fralda} onChange={e => setRoutineData({...routineData, fralda: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 text-xs font-bold text-black outline-none border border-transparent focus:border-orange-200"><option>1 troca</option><option>2 trocas</option><option>3 trocas</option><option>Não se aplica</option></select></div>
                          <div><label className="text-[9px] font-black text-gray-400 uppercase ml-1">Sono</label><select value={routineData.sleep} onChange={e => setRoutineData({...routineData, sleep: e.target.value})} className="w-full p-2 rounded-xl bg-gray-50 text-xs font-bold text-black outline-none border border-transparent focus:border-orange-200"><option>Dormiu bem</option><option>Não dormiu</option><option>Agitado</option></select></div>
                        </div>
                      </div>
                    </div>
                    <div className={`space-y-2 transition-opacity ${routineData.attendance === 'absent' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                      <label className="text-[10px] font-black text-orange-400 uppercase ml-1">🎨 Atividades</label>
                      <textarea value={routineData.activities} onChange={e => setRoutineData({...routineData, activities: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black outline-none border border-transparent focus:border-orange-200 min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><label className="text-[10px] font-black text-orange-400 uppercase ml-1">📝 Observações</label><button type="button" onClick={handleAISummary} disabled={isGenerating} className="text-[8px] font-black text-white bg-orange-400 px-3 py-1 rounded-full uppercase">{isGenerating ? 'Processando...' : '✨ Sugestão IA'}</button></div>
                      <textarea value={routineData.observations} onChange={e => setRoutineData({...routineData, observations: e.target.value})} className="w-full p-4 rounded-2xl bg-orange-50/30 text-sm font-bold text-black outline-none border border-orange-100 min-h-[80px]" />
                    </div>
                    <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">SALVAR COMO GESTOR</button>
                  </form>
                ) : (
                  <div className="py-12 text-center text-gray-400 italic">Selecione uma turma e um aluno para gerenciar o diário.</div>
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
                  {classes.map(c => {
                    const classStudents = students.filter(s => s.classId === c.id);
                    return (
                      <div key={c.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 flex flex-col group transition-all hover:border-orange-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-black text-gray-900 text-lg">{c.name}</p>
                            <p className="text-[10px] text-orange-500 font-black uppercase">Prof: {users.find(u => u.id === c.teacherId)?.name || 'Sem vínculo'}</p>
                          </div>
                          <button onClick={() => onDeleteClass(c.id)} className="text-gray-200 hover:text-red-500 p-2 transition-colors" title="Excluir Turma">✕</button>
                        </div>

                        {/* Lista de Alunos na Turma */}
                        <div className="mt-2 pt-4 border-t border-orange-50">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alunos ({classStudents.length})</p>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
                            {classStudents.length > 0 ? (
                              classStudents.map(student => (
                                <div key={student.id} className="flex justify-between items-center bg-gray-50/50 px-3 py-2 rounded-xl group/student hover:bg-orange-50 transition-colors">
                                  <span className="text-xs font-bold text-gray-700">{student.name}</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if(confirm(`Tem certeza que deseja excluir ${student.name} desta turma?`)) {
                                        onDeleteStudent(student.id);
                                      }
                                    }} 
                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                    title="Remover Aluno"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-gray-400 italic py-2">Nenhum aluno matriculado nesta turma.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
          ) : activeTab === 'events' ? (
            <div className="space-y-6">
              <form onSubmit={handleAddEventSubmit} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><span>📅</span> Adicionar Evento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Nome do Evento</label>
                    <input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Ex: Festa da Primavera" className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent focus:border-orange-200 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Data do Evento</label>
                    <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent focus:border-orange-200 outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Descrição do Evento</label>
                  <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Detalhes importantes para os responsáveis..." className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent focus:border-orange-200 outline-none h-24 resize-none" />
                </div>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">PUBLICAR EVENTO</button>
              </form>
              <div className="space-y-4">
                {events.map(ev => (
                  <div key={ev.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 flex justify-between items-center">
                    <div>
                      <p className="font-black text-gray-900">{ev.title}</p>
                      <p className="text-[10px] font-black text-orange-500 uppercase">{formatDate(ev.date)}</p>
                      <p className="text-xs text-black font-bold mt-2">{ev.description}</p>
                    </div>
                    <button onClick={() => onDeleteEvent(ev.id)} className="text-gray-200 hover:text-red-500">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'menu' ? (
            <div className="space-y-6">
              <form onSubmit={handleAddMenuSubmit} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-4">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><span>🍎</span> Gerenciar Cardápio</h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Data do Cardápio</label>
                  <input type="date" value={mnDate} onChange={e => setMnDate(e.target.value)} className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent focus:border-orange-200 outline-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Colação', 'Almoço', 'Lanche', 'Janta'].map(meal => (
                    <div key={meal} className="space-y-1">
                      <label className="text-[10px] font-black text-orange-400 uppercase ml-1">{meal}</label>
                      <input 
                        type="text" 
                        value={meal === 'Colação' ? mnCol : meal === 'Almoço' ? mnAlm : meal === 'Lanche' ? mnLan : mnJan} 
                        onChange={e => {
                          if(meal === 'Colação') setMnCol(e.target.value);
                          if(meal === 'Almoço') setMnAlm(e.target.value);
                          if(meal === 'Lanche') setMnLan(e.target.value);
                          if(meal === 'Janta') setMnJan(e.target.value);
                        }} 
                        placeholder={`Cardápio do ${meal.toLowerCase()}`} 
                        className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black outline-none border border-transparent focus:border-orange-200" 
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">SALVAR CARDÁPIO DO DIA</button>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menus.sort((a,b) => b.date.localeCompare(a.date)).map(m => (
                  <div key={m.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50">
                    <p className="font-black text-orange-600 text-[10px] uppercase mb-3">{formatDate(m.date)}</p>
                    <div className="space-y-1 text-xs font-bold text-black">
                      <p><span className="text-orange-300">●</span> {m.colacao}</p>
                      <p><span className="text-orange-300">●</span> {m.almoco}</p>
                      <p><span className="text-orange-300">●</span> {m.lanche}</p>
                      <p><span className="text-orange-300">●</span> {m.janta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'plans' ? (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><span>📂</span> Planejamentos Pedagógicos</h3>
              {lessonPlans.length === 0 ? (
                <p className="text-gray-400 italic text-center p-12 bg-white rounded-[2rem] border border-dashed">Nenhum planejamento enviado.</p>
              ) : (
                lessonPlans.sort((a,b) => b.date.localeCompare(a.date)).map(p => {
                  const teacher = users.find(u => u.id === p.teacherId);
                  const cls = classes.find(c => c.id === p.classId);
                  return (
                    <div key={p.id} className={`bg-white p-8 rounded-[2rem] card-shadow border-l-8 ${p.status === 'approved' ? 'border-green-400' : 'border-orange-400'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="font-black text-gray-900 text-lg">{cls?.name || p.grade} — Aula {p.lessonNumber}</h4>
                          <p className="text-[10px] text-gray-400 font-black uppercase">
                            {teacher?.name || 'Professor Desconhecido'} • {formatDate(p.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {p.status === 'pending' && <button onClick={() => onApprovePlan(p.id)} className="bg-orange-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">DAR VISTO</button>}
                          {p.status === 'approved' && <span className="text-green-500 font-black text-[10px] uppercase">✅ VISTO</span>}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-2xl">
                          <p className="text-[9px] font-black text-orange-500 uppercase mb-1">Objetivo</p>
                          <p className="text-sm font-bold text-black leading-relaxed">{p.objective}</p>
                        </div>
                        <div className="bg-orange-50/10 p-4 rounded-2xl border border-orange-100/30">
                          <p className="text-[9px] font-black text-orange-500 uppercase mb-1">Conteúdo e Metodologia</p>
                          <p className="text-sm font-bold text-black leading-relaxed whitespace-pre-wrap">{p.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === 'mural' ? (
            <div className="space-y-6">
              <CreatePostForm onCreatePost={onCreatePost} />
              <FeedSection posts={posts} onLikePost={onLikePost} currentUserId={currentUserId} />
            </div>
          ) : activeTab === 'chat' ? (
            <ChatSection currentUser={users.find(u => u.id === currentUserId)!} users={users} messages={messages} config={chatConfig} onSendMessage={onSendMessage} availableContacts={users.filter(u => u.id !== currentUserId)} />
          ) : activeTab === 'students' ? (
             <div className="bg-white p-8 rounded-[2rem] card-shadow">
                <h3 className="font-black text-xl mb-6 text-gray-900">Alunos Ativos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.map(s => {
                    const guardians = users.filter(u => s.guardianIds.includes(u.id));
                    return (
                      <div key={s.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] relative group hover:shadow-lg transition-all">
                        <p className="font-black text-gray-900">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase mt-1">{classes.find(c => c.id === s.classId)?.name}</p>
                        <div className="mt-3 space-y-1">
                          <p className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">Responsáveis:</p>
                          {guardians.map(g => (
                            <p key={g.id} className="text-[10px] text-gray-500 font-bold truncate">{g.email}</p>
                          ))}
                        </div>
                        <button onClick={() => onDeleteStudent(s.id)} className="absolute top-6 right-6 text-gray-200 hover:text-red-500 p-2">✕</button>
                      </div>
                    );
                  })}
                </div>
             </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-8 card-shadow space-y-4">
              <h3 className="text-xl font-black text-gray-800">Equipe Escolar</h3>
              {users.filter(u => u.role !== UserRole.GUARDIAN).map(u => (
                <div key={u.id} className="p-4 flex items-center gap-4 border-b last:border-0 hover:bg-gray-50 rounded-2xl transition-all">
                  <div className="w-10 h-10 gradient-aquarela rounded-full flex items-center justify-center text-white font-black">{u.name.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{u.name}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase">{u.role === UserRole.MANAGER ? 'GESTÃO' : 'PROFESSOR'}</p>
                    <p className="text-[10px] text-orange-500 font-bold">{u.email}</p>
                  </div>
                  <button onClick={() => onDeleteUser(u.id)} className="text-gray-200 hover:text-red-500 p-2">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {activeTab === 'students' && (
             <div className="bg-yellow-50 rounded-[2rem] p-8 border border-yellow-100 shadow-inner animate-in fade-in slide-in-from-right-4">
                <h4 className="font-black text-yellow-800 mb-6 text-xs uppercase tracking-widest flex items-center gap-2"><span>👦</span> Matrícula Escolar</h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-yellow-600 uppercase ml-1">Dados do Aluno</label>
                    <input type="text" placeholder="Nome completo do Aluno" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-yellow-200 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-yellow-600 uppercase ml-1">Turma</label>
                    <select value={targetClassId} onChange={e => setTargetClassId(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-yellow-200 outline-none">
                      <option value="">Selecione a Turma...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="pt-2 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-yellow-600 uppercase ml-1">Responsável 1 (Obrigatório)</label>
                      <input type="email" placeholder="E-mail principal" value={guardianEmail1} onChange={e => setGuardianEmail1(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-yellow-200 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Responsável 2 (Opcional)</label>
                      <input type="email" placeholder="E-mail adicional" value={guardianEmail2} onChange={e => setGuardianEmail2(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-yellow-200 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Responsável 3 (Opcional)</label>
                      <input type="email" placeholder="E-mail adicional" value={guardianEmail3} onChange={e => setGuardianEmail3(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-yellow-200 outline-none" />
                    </div>
                  </div>

                  <button onClick={handleMatricula} className="w-full py-4 bg-yellow-400 text-yellow-900 font-black rounded-2xl text-xs uppercase shadow-lg hover:scale-105 transition-all">MATRICULAR ALUNO</button>
                </div>
             </div>
          )}
          {activeTab === 'users' && (
            <div className="bg-orange-50 rounded-[2rem] p-8 border border-orange-100 shadow-inner animate-in fade-in slide-in-from-right-4">
              <h4 className="font-black text-orange-800 mb-6 text-xs uppercase tracking-widest flex items-center gap-2"><span>👩‍🏫</span> Adicionar Professor</h4>
              <div className="space-y-4">
                <input type="text" placeholder="Nome do Professor" value={tName} onChange={e => setTName(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-orange-200 outline-none" />
                <input type="email" placeholder="E-mail do Professor" value={tEmail} onChange={e => setTEmail(e.target.value)} className="w-full p-3 rounded-2xl bg-white text-sm font-bold text-black border border-orange-200 outline-none" />
                <button onClick={() => {if(tName && tEmail){onAddUser(tName, tEmail, UserRole.TEACHER, '123'); setTName(''); setTEmail(''); alert("Professor adicionado!");}}} className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl text-xs uppercase shadow-lg hover:scale-105 transition-all">CADASTRAR PROFESSOR</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-[2rem] p-10 text-center border border-orange-100 flex flex-col items-center">
            <span className="text-4xl mb-4">🎨</span>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-relaxed">Painel de Controle Aquarela</p>
            <p className="text-[9px] text-gray-400 font-bold italic mt-2">Navegue para gerenciar a escola.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
