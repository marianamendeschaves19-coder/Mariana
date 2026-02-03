
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
  const [isGenerating, setIsGenerating] = useState(false);

  const [routineData, setRoutineData] = useState<Omit<RoutineEntry, 'id' | 'studentId' | 'authorId'>>({
    date: new Date().toISOString().split('T')[0],
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

  const [planData, setPlanData] = useState({
    date: new Date().toISOString().split('T')[0], lessonNumber: '', classId: '', materials: '', objective: '', content: '', assessment: '', bnccCodes: ''
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
    alert(`Diário de ${selectedStudent.name} salvo com sucesso!`);
  };

  const handleAISummary = async () => {
    setIsGenerating(true);
    const summary = await generateRoutineSummary(routineData.activities || "interação e aprendizado");
    setRoutineData(prev => ({ ...prev, observations: summary }));
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 font-['Quicksand']">
      <div className="flex bg-white p-2 rounded-2xl card-shadow w-fit mx-auto md:mx-0 border border-orange-50">
        {[{ id: 'routines', label: 'DIÁRIO' }, { id: 'planning', label: 'PLANEJAMENTO' }, { id: 'mural', label: 'MURAL' }, { id: 'chat', label: 'CHAT' }].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id as any)} className={`px-6 py-2 rounded-xl font-bold text-[10px] uppercase transition-all ${activeView === v.id ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{v.label}</button>
        ))}
      </div>

      {activeView === 'routines' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-[2rem] card-shadow space-y-4 lg:col-span-1">
             <h3 className="font-black text-gray-800 text-[10px] uppercase tracking-widest mb-4">Minhas Turmas</h3>
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
          <div className="lg:col-span-3">
            {selectedStudent ? (
              <form onSubmit={handleRoutineSubmit} className="bg-white p-8 rounded-[2rem] card-shadow space-y-8 border border-orange-50 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">Agenda de {selectedStudent.name}</h3>
                  </div>
                  <input type="date" value={routineData.date} onChange={e => setRoutineData({...routineData, date: e.target.value})} className="text-xs font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-full border-transparent outline-none focus:ring-2 focus:ring-orange-200" />
                </div>

                <div className="flex bg-gray-50 p-1 rounded-2xl w-fit">
                   <button type="button" onClick={() => setRoutineData({...routineData, attendance: 'present'})} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${routineData.attendance === 'present' ? 'bg-green-500 text-white shadow-md' : 'text-gray-400'}`}>Presente</button>
                   <button type="button" onClick={() => setRoutineData({...routineData, attendance: 'absent'})} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${routineData.attendance === 'absent' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400'}`}>Faltou</button>
                </div>

                {routineData.attendance === 'present' && (
                  <>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-l-4 border-orange-400 pl-3">🍎 Alimentação</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {['Colacao', 'Almoco', 'Lanche', 'Janta'].map(field => (
                          <div key={field}>
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{field}</label>
                            <select value={(routineData as any)[field.toLowerCase()]} onChange={e => setRoutineData({...routineData, [field.toLowerCase()]: e.target.value as any})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                              <option value="comeu tudo">Comeu tudo</option>
                              <option value="comeu bem">Comeu bem</option>
                              <option value="comeu metade">Comeu metade</option>
                              <option value="recusou">Recusou</option>
                              <option value="não ofertado">Não ofertado</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-l-4 border-orange-400 pl-3">🛁 Cuidados e Bem-estar</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Água</label>
                          <select value={routineData.agua} onChange={e => setRoutineData({...routineData, agua: e.target.value as any})} className="w-full p-3 rounded-xl bg-blue-50/50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-blue-200 outline-none">
                            <option value="bebeu bastante">Bebeu bastante</option>
                            <option value="bebeu pouco">Bebeu pouco</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Banho</label>
                          <select value={routineData.banho} onChange={e => setRoutineData({...routineData, banho: e.target.value as any})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                            <option value="sim">Sim</option>
                            <option value="não">Não</option>
                            <option value="não se aplica">Não se aplica</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Evacuação</label>
                          <select value={routineData.evacuacao} onChange={e => setRoutineData({...routineData, evacuacao: e.target.value as any})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                            <option value="sim">Sim</option>
                            <option value="não">Não</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Fralda</label>
                          <select value={routineData.fralda} onChange={e => setRoutineData({...routineData, fralda: e.target.value as any})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                            <option value="1x">1x</option>
                            <option value="2x">2x</option>
                            <option value="3x">3x</option>
                            <option value="não se aplica">Não se aplica</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Sono</label>
                          <select value={routineData.sleep} onChange={e => setRoutineData({...routineData, sleep: e.target.value as any})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                            <option value="dormiu">Dormiu</option>
                            <option value="não dormiu">Não dormiu</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Humor</label>
                          <select value={routineData.mood} onChange={e => setRoutineData({...routineData, mood: e.target.value as any})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none">
                            <option value="happy">😊 Feliz</option>
                            <option value="calm">😌 Calmo</option>
                            <option value="fussy">😫 Agitado</option>
                            <option value="tired">😴 Cansado</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-l-4 border-orange-400 pl-3">🎨 Atividade do Dia</h4>
                      <textarea placeholder="Relate as atividades realizadas..." value={routineData.activities} onChange={e => setRoutineData({...routineData, activities: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none min-h-[100px] resize-none shadow-inner" />
                    </div>
                  </>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-l-4 border-orange-400 pl-3">📝 Observações</h4>
                    <button type="button" onClick={handleAISummary} disabled={isGenerating} className="text-[8px] font-black text-white bg-orange-400 hover:bg-orange-500 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md transition-all active:scale-95">
                      {isGenerating ? 'IA Processando...' : 'Gerar com IA'}
                    </button>
                  </div>
                  <textarea placeholder="Recados para os pais..." value={routineData.observations} onChange={e => setRoutineData({...routineData, observations: e.target.value})} className="w-full p-4 rounded-2xl bg-orange-50/30 text-sm font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none min-h-[100px] resize-none shadow-inner" />
                </div>

                <button type="submit" className="w-full py-5 gradient-aquarela text-white font-black rounded-[2rem] shadow-xl uppercase text-xs tracking-[0.2em] transform transition-transform hover:scale-[1.01] active:scale-95">
                  SALVAR NO SUPABASE
                </button>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-white rounded-[3rem] card-shadow p-12 text-center border-2 border-dashed border-orange-100">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-4xl mb-4 grayscale opacity-50">📋</div>
                <h4 className="text-xl font-black text-gray-700">Selecione um Aluno</h4>
                <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto mt-2">Escolha uma criança para iniciar o diário.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeView === 'planning' ? (
        <form onSubmit={e => { 
          e.preventDefault(); 
          const cls = classes.find(c => c.id === planData.classId);
          onSaveLessonPlan({
            ...planData, 
            grade: cls?.name || '', 
            shift: '', 
            objective: planData.objective,
            structure: '',
            assessment: planData.assessment,
            materials: planData.materials
          }); 
          alert("Plano de aula enviado!"); 
        }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-black text-gray-900">Planejamento Pedagógico</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <input type="date" value={planData.date} onChange={e => setPlanData({...planData, date: e.target.value})} className="p-4 rounded-2xl bg-gray-50 text-xs font-bold text-black outline-none" />
             <input placeholder="Nº Aula" value={planData.lessonNumber} onChange={e => setPlanData({...planData, lessonNumber: e.target.value})} className="p-4 rounded-2xl bg-gray-50 text-xs font-bold text-black outline-none" />
             <select value={planData.classId} onChange={e => setPlanData({...planData, classId: e.target.value})} className="p-4 rounded-2xl bg-gray-50 text-xs font-bold text-black outline-none">
               <option value="">Turma...</option>
               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
             <input placeholder="BNCC" value={planData.bnccCodes} onChange={e => setPlanData({...planData, bnccCodes: e.target.value})} className="p-4 rounded-2xl bg-gray-50 text-xs font-bold text-black outline-none" />
          </div>
          <textarea placeholder="Objetivo" value={planData.objective} onChange={e => setPlanData({...planData, objective: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 text-xs font-bold text-black min-h-[80px]" />
          <textarea placeholder="Conteúdo da Aula" value={planData.content} onChange={e => setPlanData({...planData, content: e.target.value})} className="w-full p-6 rounded-[2rem] bg-gray-50 text-sm font-bold text-black min-h-[200px] outline-none" />
          <button type="submit" className="w-full py-5 gradient-aquarela text-white font-black rounded-[2rem] shadow-xl uppercase tracking-widest text-xs">SUBMETER PLANO</button>

          <div className="pt-8 space-y-4">
             <h4 className="font-black text-gray-700 text-sm">Meus Últimos Planos</h4>
             {lessonPlans.map(p => (
               <div key={p.id} className="p-4 border rounded-2xl text-xs space-y-2">
                 <div className="flex justify-between items-center">
                   <span className="font-bold">{p.date} - Aula {p.lessonNumber}</span>
                   <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${p.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{p.status}</span>
                 </div>
                 {p.managerFeedback && <p className="p-2 bg-blue-50 text-blue-700 rounded-lg italic font-medium">Feedback: {p.managerFeedback}</p>}
               </div>
             ))}
          </div>
        </form>
      ) : activeView === 'mural' ? (
        <div className="space-y-8 animate-in fade-in duration-500"><CreatePostForm onCreatePost={onCreatePost} /><FeedSection posts={posts} onLikePost={onLikePost} currentUserId={currentUserId} /></div>
      ) : (
        <ChatSection currentUser={users.find(u => u.id === currentUserId)!} users={users} messages={messages} config={chatConfig} onSendMessage={onSendMessage} availableContacts={users.filter(u => u.id !== currentUserId)} />
      )}
    </div>
  );
};

export default TeacherDashboard;
