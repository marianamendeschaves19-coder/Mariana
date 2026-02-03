import React, { useState, useEffect } from 'react';
import { Class, Student, RoutineEntry, LessonPlan, FeedPost, ChatMessage, ChatConfig, User, UserRole } from '../types';
import CreatePostForm from './CreatePostForm';
import FeedSection from './FeedSection';
import ChatSection from './ChatSection';
import { generateRoutineSummary } from '../services/geminiService';

interface TeacherDashboardProps {
  classes: Class[];
  students: Student[];
  lessonPlans: LessonPlan[];
  posts: FeedPost[];
  messages: ChatMessage[];
  chatConfig: ChatConfig;
  users: User[];
  routines: RoutineEntry[];
  onSaveRoutine: (routine: Omit<RoutineEntry, 'id'>) => void;
  onSaveLessonPlan: (plan: Omit<LessonPlan, 'id' | 'status' | 'createdAt' | 'teacherId'>) => void;
  onCreatePost: (post: any) => void;
  onLikePost: (postId: string) => void;
  onSendMessage: (content: string, receiverId: string) => void;
  currentUserId: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  classes, students, lessonPlans, posts, messages, chatConfig, users, routines,
  onSaveRoutine, onSaveLessonPlan, onCreatePost, onLikePost, onSendMessage, currentUserId 
}) => {
  const [activeView, setActiveView] = useState<'routines' | 'planning' | 'mural' | 'chat'>('routines');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Default initial routine state
  const INITIAL_ROUTINE = {
    date: new Date().toISOString().split('T')[0],
    attendance: 'present' as 'present' | 'absent',
    colacao: 'Comeu tudo', almoco: 'Comeu tudo', lanche: 'Comeu tudo', janta: 'Comeu tudo',
    banho: 'Sim', agua: 'Bebeu bastante', evacuacao: 'Sim', fralda: '1 troca',
    sleep: 'Dormiu bem', activities: '', observations: '', mood: 'happy' as any
  };

  // Routine Form State
  const [routineData, setRoutineData] = useState<Omit<RoutineEntry, 'id' | 'studentId' | 'authorId'>>(INITIAL_ROUTINE);

  // Lesson planning form state
  const [planData, setPlanData] = useState({
    date: new Date().toISOString().split('T')[0],
    lessonNumber: '',
    classId: '',
    materials: '',
    objective: '',
    content: '',
    assessment: ''
  });

  useEffect(() => {
    if (selectedStudent) {
      const existing = routines.find(r => r.studentId === selectedStudent.id && r.date === routineData.date);
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
  }, [selectedStudent, routineData.date, routines]);

  const handleRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    onSaveRoutine({ ...routineData, studentId: selectedStudent.id, authorId: currentUserId });
    alert(`Rotina de ${selectedStudent.name} salva com sucesso!`);
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planData.classId || !planData.objective || !planData.content) {
      return alert("Preencha a turma, o objetivo e o conteúdo.");
    }
    onSaveLessonPlan({
      ...planData,
      grade: classes.find(c => c.id === planData.classId)?.name || '',
      shift: '',
      bnccCodes: '',
      structure: ''
    });
    setPlanData({ date: new Date().toISOString().split('T')[0], lessonNumber: '', classId: '', materials: '', objective: '', content: '', assessment: '' });
    alert("Planejamento salvo com sucesso!");
  };

  const handleAISummary = async () => {
    setIsGenerating(true);
    const summary = await generateRoutineSummary(routineData.activities || "brincadeiras e aprendizado");
    setRoutineData(prev => ({ ...prev, observations: summary }));
    setIsGenerating(false);
  };

  const isRoutineSaved = (studentId: string) => {
    return routines.some(r => r.studentId === studentId && r.date === routineData.date);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-2 rounded-2xl card-shadow w-fit mx-auto md:mx-0 overflow-hidden border border-orange-50">
        {[
          { id: 'routines', label: 'DIÁRIO' },
          { id: 'planning', label: 'PLANEJAMENTO' },
          { id: 'mural', label: 'MURAL' },
          { id: 'chat', label: 'CHAT' }
        ].map(v => (
          <button 
            key={v.id}
            onClick={() => setActiveView(v.id as any)} 
            className={`px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeView === v.id ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {activeView === 'chat' ? (
        <ChatSection currentUser={users.find(u => u.id === currentUserId)!} users={users} messages={messages} config={chatConfig} onSendMessage={onSendMessage} availableContacts={users.filter(u => u.id !== currentUserId)} />
      ) : activeView === 'mural' ? (
        <div className="space-y-8">
          <CreatePostForm onCreatePost={onCreatePost} />
          <FeedSection posts={posts} onLikePost={onLikePost} currentUserId={currentUserId} />
        </div>
      ) : activeView === 'routines' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-[2rem] card-shadow space-y-4">
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><span>🏫</span> Minhas Turmas</h3>
            <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 scrollbar-hide">
              {classes.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic text-center py-4">Nenhuma turma vinculada.</p>
              ) : (
                classes.map(cls => (
                  <div key={cls.id} className="space-y-2">
                    <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1 bg-orange-50 px-3 py-1 rounded-full w-fit">
                      {cls.name}
                    </h4>
                    <div className="space-y-1 pl-1">
                      {students.filter(s => s.classId === cls.id).map(student => {
                        const saved = isRoutineSaved(student.id);
                        return (
                          <button 
                            key={student.id} 
                            onClick={() => setSelectedStudent(student)}
                            className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between group ${selectedStudent?.id === student.id ? 'border-orange-500 bg-orange-50' : 'border-gray-50 hover:border-orange-200'}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`font-bold text-xs truncate ${selectedStudent?.id === student.id ? 'text-orange-600' : 'text-gray-700'}`}>{student.name}</p>
                                {saved && <span className="bg-green-100 text-green-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">SALVO</span>}
                              </div>
                            </div>
                            <span className="text-lg shrink-0 ml-2">{selectedStudent?.id === student.id ? '✏️' : '👤'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedStudent ? (
              <form onSubmit={handleRoutineSubmit} className="bg-white p-8 rounded-[2rem] card-shadow space-y-6 border border-orange-50">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Diário de {selectedStudent.name}</h3>
                    {isRoutineSaved(selectedStudent.id) && <p className="text-[10px] text-green-500 font-bold uppercase mt-1">✓ Registro já existente</p>}
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
                  <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">🎨 Atividades do Dia</label>
                  <textarea value={routineData.activities} onChange={e => setRoutineData({...routineData, activities: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-gray-100 outline-none focus:ring-2 focus:ring-orange-200 min-h-[100px] resize-none" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">📝 Observações</label><button type="button" onClick={handleAISummary} disabled={isGenerating} className="text-[9px] font-black text-white bg-orange-400 px-3 py-1 rounded-full uppercase">{isGenerating ? 'IA...' : '✨ IA'}</button></div>
                  <textarea value={routineData.observations} onChange={e => setRoutineData({...routineData, observations: e.target.value})} className="w-full p-4 rounded-2xl bg-orange-50/30 text-sm font-bold text-black border border-orange-100 outline-none focus:ring-2 focus:ring-orange-200 min-h-[100px] resize-none" />
                </div>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">SALVAR DIÁRIO</button>
              </form>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[2rem] card-shadow border-2 border-dashed border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-4xl">🗒️</div>
                <h4 className="text-xl font-black text-gray-700 mb-2">Selecione um Aluno</h4>
                <p className="text-sm text-gray-400 font-medium">Escolha uma criança na lista ao lado para preencher a agenda hoje.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handlePlanSubmit} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><span>✏️</span> Planejamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div><label className="text-[9px] font-black text-orange-400 uppercase ml-1">Data</label><input type="date" value={planData.date} onChange={e => setPlanData({...planData, date: e.target.value})} className="w-full p-3 rounded-2xl bg-gray-50 text-xs font-bold text-black border border-gray-100 outline-none" /></div>
                   <div><label className="text-[9px] font-black text-orange-400 uppercase ml-1">Nº Aula</label><input type="text" placeholder="Ex: 01" value={planData.lessonNumber} onChange={e => setPlanData({...planData, lessonNumber: e.target.value})} className="w-full p-3 rounded-2xl bg-gray-50 text-xs font-bold text-black border border-gray-100 outline-none" /></div>
                   <div><label className="text-[9px] font-black text-orange-400 uppercase ml-1">Turma</label><select value={planData.classId} onChange={e => setPlanData({...planData, classId: e.target.value})} className="w-full p-3 rounded-2xl bg-gray-50 text-xs font-bold text-black border border-gray-100 outline-none"><option value="">Selecione...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
                <div className="space-y-4">
                   <textarea value={planData.objective} onChange={e => setPlanData({...planData, objective: e.target.value})} placeholder="Objetivo pedagógico..." className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:ring-2 focus:ring-orange-200 min-h-[80px]" />
                   <textarea value={planData.content} onChange={e => setPlanData({...planData, content: e.target.value})} placeholder="Conteúdo da aula..." className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:ring-2 focus:ring-orange-200 min-h-[120px]" />
                </div>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">SALVAR PLANO</button>
              </form>
           </div>
           <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Planos Recentes</h3>
              {lessonPlans.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-orange-50 card-shadow">
                  <div className="flex justify-between mb-2">
                    <p className="font-black text-gray-900 text-sm">{p.grade}</p>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${p.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{p.status === 'approved' ? 'Visto' : 'Pendente'}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mb-2">{new Date(p.date).toLocaleDateString()}</p>
                  <p className="text-xs text-black font-bold line-clamp-2">"{p.objective}"</p>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;