
import React, { useState, useEffect } from 'react';
import { Class, Student, RoutineEntry, RoutineLog, LessonPlan, FeedPost, ChatMessage, ChatConfig, User, UserRole } from '../types';
import CreatePostForm from './CreatePostForm';
import FeedSection from './FeedSection';
import ChatSection from './ChatSection';
import { generateRoutineSummary, suggestBNCC } from '../services/geminiService';

interface TeacherDashboardProps {
  classes: Class[];
  students: Student[];
  lessonPlans: LessonPlan[];
  posts: FeedPost[];
  messages: ChatMessage[];
  chatConfig: ChatConfig;
  users: User[];
  routines: RoutineEntry[];
  routineLogs: RoutineLog[];
  onSaveRoutine: (routine: Omit<RoutineEntry, 'id'>) => void;
  onDeleteRoutine: (studentId: string, date: string) => void;
  onSaveRoutineLog: (log: Omit<RoutineLog, 'id' | 'createdAt'>) => void;
  onDeleteRoutineLog: (id: string) => void;
  onUpdateRoutineLog: (id: string, content: string) => void;
  onSaveLessonPlan: (plan: Omit<LessonPlan, 'id' | 'status' | 'createdAt' | 'teacherId'>) => void;
  onDeleteLessonPlan: (id: string, status?: string) => void;
  onCreatePost: (post: any) => void;
  onLikePost: (postId: string) => void;
  onSendMessage: (content: string, receiverId: string) => void;
  currentUserId: string;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  classes, students, lessonPlans, posts, messages, chatConfig, users, routines, routineLogs,
  onSaveRoutine, onDeleteRoutine, onSaveRoutineLog, onDeleteRoutineLog, onUpdateRoutineLog, onSaveLessonPlan, onDeleteLessonPlan, onCreatePost, onLikePost, onSendMessage, currentUserId,
  showNotification, showConfirm
}) => {
  const [activeView, setActiveView] = useState<'routines' | 'planning' | 'mural' | 'chat'>('routines');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingBNCC, setIsSuggestingBNCC] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RoutineLog['category'] | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogContent, setEditLogContent] = useState('');

  // Estados de Planejamento
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planData, setPlanData] = useState({
    date: new Date().toLocaleDateString('en-CA'), 
    lessonNumber: '', 
    classId: '', 
    materials: '', 
    objective: '', 
    content: '', 
    assessment: '', 
    bnccCodes: ''
  });

  const [routineData, setRoutineData] = useState<Omit<RoutineEntry, 'id' | 'studentId' | 'authorId'>>({
    date: new Date().toLocaleDateString('en-CA'),
    attendance: 'present', 
    colacao: 'comeu tudo', 
    almoco: 'comeu tudo', 
    lanche: 'comeu tudo', 
    janta: 'comeu tudo',
    banho: 'não', 
    agua: 'bebeu bastante', 
    evacuacao: 'não', 
    fralda: '1x', 
    sleep: 'dormiu', 
    activities: '', 
    observations: '', 
    mood: 'happy'
  });

  useEffect(() => {
    if (selectedStudent) {
      const existing = routines.find(r => r.studentId === selectedStudent.id && r.date === routineData.date);
      if (existing) setRoutineData({ ...existing } as any);
      else setRoutineData(prev => ({ 
        ...prev, 
        activities: '', 
        observations: '', 
        attendance: 'present',
        colacao: 'comeu tudo', 
        almoco: 'comeu tudo', 
        lanche: 'comeu tudo', 
        janta: 'comeu tudo',
        banho: 'não', 
        agua: 'bebeu bastante', 
        evacuacao: 'não', 
        fralda: '1x', 
        sleep: 'dormiu'
      }));
    }
  }, [selectedStudent, routineData.date]);

  const handleRoutineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    onSaveRoutine({ ...routineData, studentId: selectedStudent.id, authorId: currentUserId });
    showNotification(`Status diário de ${selectedStudent.name} salvo com sucesso!`, 'success');
  };

  const handleSaveLog = () => {
    if (!selectedStudent || !selectedCategory || !logContent.trim()) return;
    
    const now = new Date();
    const date = now.toLocaleDateString('en-CA');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const teacher = users.find(u => u.id === currentUserId);

    onSaveRoutineLog({
      studentId: selectedStudent.id,
      teacherId: currentUserId,
      teacherName: teacher?.name || 'Professor(a)',
      category: selectedCategory,
      content: logContent,
      date,
      time
    });

    setLogContent('');
    setSelectedCategory(null);
  };

  const handleAISummary = async () => {
    setIsGenerating(true);
    const summary = await generateRoutineSummary(routineData.activities || "interação e aprendizado");
    setRoutineData(prev => ({ ...prev, observations: summary }));
    setIsGenerating(false);
  };

  const handleSuggestBNCC = async () => {
    if (!planData.objective && !planData.content) {
      showNotification("Preencha o objetivo ou conteúdo para receber sugestões.", 'info');
      return;
    }
    setIsSuggestingBNCC(true);
    const suggestion = await suggestBNCC(planData.objective, planData.content);
    if (suggestion) {
      setPlanData(prev => ({ ...prev, bnccCodes: suggestion }));
    }
    setIsSuggestingBNCC(false);
  };

  const handleEditPlan = (plan: LessonPlan) => {
    setEditingPlanId(plan.id);
    setPlanData({
      date: plan.date,
      lessonNumber: plan.lessonNumber,
      classId: plan.classId,
      materials: plan.materials || '',
      objective: plan.objective || '',
      content: plan.content || '',
      assessment: plan.assessment || '',
      bnccCodes: plan.bnccCodes || ''
    });
    // Rola para o topo do formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearPlanForm = () => {
    setEditingPlanId(null);
    setPlanData({
      date: new Date().toLocaleDateString('en-CA'), lessonNumber: '', classId: '', materials: '', objective: '', content: '', assessment: '', bnccCodes: ''
    });
  };

  return (
    <div className="space-y-6 font-['Quicksand']">
      <div className="flex bg-white p-2 rounded-2xl card-shadow w-fit mx-auto md:mx-0 border border-orange-50 overflow-x-auto scrollbar-hide">
        {[{ id: 'routines', label: 'DIÁRIO' }, { id: 'mural', label: 'MURAL' }, { id: 'chat', label: 'CHAT' }].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id as any)} className={`px-6 py-2 rounded-xl font-bold text-[10px] uppercase transition-all whitespace-nowrap ${activeView === v.id ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{v.label}</button>
        ))}
      </div>

      {activeView === 'routines' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-[2rem] card-shadow space-y-4 lg:col-span-1">
             <h3 className="font-black text-gray-800 text-[10px] uppercase tracking-widest mb-4">Todas as Turmas</h3>
             {classes.map(cls => (
               <div key={cls.id} className="space-y-2">
                 <h4 className="text-[10px] font-black text-orange-400 uppercase bg-orange-50 px-3 py-1 rounded-full w-fit">{cls.name}</h4>
                 <div className="space-y-1">
                   {students.filter(s => s.classId === cls.id).map(student => (
                     <button key={student.id} onClick={() => setSelectedStudent(student)} className={`w-full p-3 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedStudent?.id === student.id ? 'border-orange-500 bg-orange-50' : 'border-gray-50 hover:border-orange-200'}`}>
                       <span className={`font-bold text-xs ${selectedStudent?.id === student.id ? 'text-orange-600' : 'text-black'}`}>{student.name}</span>
                       {routines.some(r => r.studentId === student.id && r.date === routineData.date) && <span className="text-[8px] bg-green-500 text-white px-2 py-0.5 rounded uppercase font-black">OK</span>}
                     </button>
                   ))}
                 </div>
               </div>
             ))}
          </div>
          <div className="lg:col-span-3 space-y-6">
            {selectedStudent ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {/* Cabeçalho do Aluno */}
                <div className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">Agenda de {selectedStudent.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registros em tempo real</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-orange-500">{new Date().toLocaleDateString('pt-BR')}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Hoje</p>
                  </div>
                </div>

                {/* Botões Rápidos de Registro */}
                <div className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-6">
                  <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-l-4 border-orange-400 pl-3">🚀 Registro Rápido</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { id: 'Alimentação', icon: '🍎' },
                      { id: 'Sono', icon: '😴' },
                      { id: 'Troca / Higiene', icon: '🧼' },
                      { id: 'Atividade pedagógica', icon: '🎨' },
                      { id: 'Recreação', icon: '⚽' },
                      { id: 'Observação', icon: '📝' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id as any)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${selectedCategory === cat.id ? 'border-orange-500 bg-orange-50 scale-105 shadow-md' : 'border-gray-50 hover:border-orange-200 bg-gray-50/50'}`}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-[9px] font-black uppercase text-center leading-tight">{cat.id}</span>
                      </button>
                    ))}
                  </div>

                  {selectedCategory && (
                    <div className="space-y-4 animate-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-full uppercase">Novo registro: {selectedCategory}</span>
                        <button onClick={() => setSelectedCategory(null)} className="text-[9px] font-black text-gray-400 uppercase hover:text-red-500">Cancelar</button>
                      </div>
                      <textarea
                        placeholder={`Descreva aqui o registro de ${selectedCategory.toLowerCase()}...`}
                        value={logContent}
                        onChange={e => setLogContent(e.target.value)}
                        className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none min-h-[100px] resize-none shadow-inner"
                      />
                      <button
                        onClick={handleSaveLog}
                        disabled={!logContent.trim()}
                        className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest disabled:opacity-50 disabled:scale-100 transition-all active:scale-95"
                      >
                        CONFIRMAR REGISTRO
                      </button>
                    </div>
                  )}
                </div>

                {/* Histórico de Registros do Dia */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Linha do Tempo (Hoje)</h4>
                  <div className="space-y-4">
                    {routineLogs
                      .filter(l => l.studentId === selectedStudent.id && l.date === new Date().toLocaleDateString('en-CA'))
                      .sort((a, b) => b.time.localeCompare(a.time))
                      .map(log => (
                        <div key={log.id} className="bg-white p-5 rounded-[1.5rem] card-shadow border border-orange-50 flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex flex-col items-center gap-1 min-w-[60px]">
                            <span className="text-xs font-black text-orange-500">{log.time}</span>
                            <div className="w-0.5 h-full bg-orange-100 rounded-full"></div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-black text-white bg-orange-400 px-2 py-0.5 rounded uppercase tracking-widest">{log.category}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Por: {log.teacherName}</span>
                                {log.teacherId === currentUserId && (
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                        setEditingLogId(log.id);
                                        setEditLogContent(log.content);
                                      }}
                                      className="text-blue-400 hover:text-blue-600 transition-colors"
                                      title="Editar"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                    </button>
                                    <button 
                                      onClick={() => {
                                        showConfirm("Deseja apagar este registro?", () => {
                                          onDeleteRoutineLog(log.id);
                                        });
                                      }}
                                      className="text-red-400 hover:text-red-600 transition-colors"
                                      title="Apagar"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {editingLogId === log.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editLogContent}
                                  onChange={e => setEditLogContent(e.target.value)}
                                  className="w-full p-3 rounded-xl bg-gray-50 text-sm font-bold border border-orange-100 focus:ring-2 focus:ring-orange-200 outline-none min-h-[80px] resize-none"
                                />
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      onUpdateRoutineLog(log.id, editLogContent);
                                      setEditingLogId(null);
                                    }}
                                    className="px-4 py-1.5 bg-orange-500 text-white text-[10px] font-black rounded-lg uppercase shadow-sm"
                                  >
                                    Salvar
                                  </button>
                                  <button 
                                    onClick={() => setEditingLogId(null)}
                                    className="px-4 py-1.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-lg uppercase"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm font-bold text-gray-800 leading-relaxed">{log.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    {routineLogs.filter(l => l.studentId === selectedStudent.id && l.date === new Date().toLocaleDateString('en-CA')).length === 0 && (
                      <div className="bg-white/50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase italic">Nenhum registro realizado hoje ainda.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Geral (Presença e Humor) */}
                <form onSubmit={handleRoutineSubmit} className="bg-white p-8 rounded-[2rem] card-shadow space-y-6 border border-orange-50">
                  <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-l-4 border-orange-400 pl-3">📍 Status Geral do Dia</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Presença</label>
                      <div className="flex bg-gray-50 p-1 rounded-2xl w-fit">
                        <button type="button" onClick={() => setRoutineData({...routineData, attendance: 'present'})} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${routineData.attendance === 'present' ? 'bg-green-500 text-white shadow-md' : 'text-gray-400'}`}>Presente</button>
                        <button type="button" onClick={() => setRoutineData({...routineData, attendance: 'absent'})} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${routineData.attendance === 'absent' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400'}`}>Faltou</button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Humor Predominante</label>
                      <select value={routineData.mood} onChange={e => setRoutineData({...routineData, mood: e.target.value as any})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                        <option value="happy">😊 Feliz</option>
                        <option value="calm">😌 Calmo</option>
                        <option value="fussy">😫 Agitado</option>
                        <option value="tired">😴 Cansado</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button type="submit" className="flex-1 py-4 bg-gray-800 text-white font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest hover:bg-black transition-all">
                      ATUALIZAR STATUS DO DIA
                    </button>
                    {routines.some(r => r.studentId === selectedStudent.id && r.date === routineData.date) && (
                      <button 
                        type="button" 
                        onClick={() => {
                          showConfirm("Deseja limpar todos os dados do status diário? Isso não apagará os registros da linha do tempo.", () => {
                            onDeleteRoutine(selectedStudent.id, routineData.date);
                          });
                        }}
                        className="py-4 px-6 bg-red-50 text-red-500 font-black rounded-2xl border border-red-100 uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all"
                      >
                        LIMPAR DIÁRIO
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-white rounded-[3rem] card-shadow p-12 text-center border-2 border-dashed border-orange-100">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-4xl mb-4 grayscale opacity-50">📋</div>
                <h4 className="text-xl font-black text-gray-700">Selecione um Aluno</h4>
                <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto mt-2">Escolha uma criança para iniciar o diário.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeView === 'mural' ? (
        <div className="space-y-8 animate-in fade-in duration-500"><CreatePostForm onCreatePost={onCreatePost} /><FeedSection posts={posts} onLikePost={onLikePost} currentUserId={currentUserId} /></div>
      ) : (
        <ChatSection currentUser={users.find(u => u.id === currentUserId)!} users={users} messages={messages} config={chatConfig} onSendMessage={onSendMessage} availableContacts={users.filter(u => u.id !== currentUserId)} />
      )}
    </div>
  );
};

export default TeacherDashboard;
