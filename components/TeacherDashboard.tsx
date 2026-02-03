
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
    attendance: 'present', colacao: 'Comeu tudo', almoco: 'Comeu tudo', lanche: 'Comeu tudo', janta: 'Comeu tudo',
    banho: 'Sim', agua: 'Bebeu bastante', evacuacao: 'Sim', fralda: '1 troca', sleep: 'Dormiu bem', activities: '', observations: '', mood: 'happy'
  });

  const [planData, setPlanData] = useState({
    date: new Date().toISOString().split('T')[0], lessonNumber: '', classId: '', materials: '', objective: '', content: '', assessment: ''
  });

  useEffect(() => {
    if (selectedStudent) {
      const existing = routines.find(r => r.studentId === selectedStudent.id && r.date === routineData.date);
      if (existing) setRoutineData({ ...existing } as any);
      else setRoutineData(prev => ({ ...prev, activities: '', observations: '' }));
    }
  }, [selectedStudent, routineData.date]);

  const handleRoutineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    onSaveRoutine({ ...routineData, studentId: selectedStudent.id, authorId: currentUserId });
    alert(`Agenda atualizada!`);
  };

  const handleAISummary = async () => {
    setIsGenerating(true);
    const summary = await generateRoutineSummary(routineData.activities || "brincadeiras e aprendizado");
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-[2rem] card-shadow space-y-4">
             <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest mb-4">Minhas Turmas</h3>
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
          <div className="lg:col-span-2">
            {selectedStudent ? (
              <form onSubmit={handleRoutineSubmit} className="bg-white p-8 rounded-[2rem] card-shadow space-y-6 border border-orange-50">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-xl font-black text-gray-900">Agenda: {selectedStudent.name}</h3>
                  <input type="date" value={routineData.date} onChange={e => setRoutineData({...routineData, date: e.target.value})} className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border-transparent outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {['Colação', 'Almoço', 'Lanche', 'Janta'].map(field => (
                    <div key={field}>
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{field}</label>
                      <select value={(routineData as any)[field.toLowerCase().replace('ç','c')]} onChange={e => setRoutineData({...routineData, [field.toLowerCase().replace('ç','c')]: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-100 outline-none">
                        <option>Comeu tudo</option><option>Comeu bem</option><option>Recusou</option>
                      </select>
                    </div>
                  ))}
                  <div className="col-span-full">
                    <label className="text-[10px] font-black text-orange-400 uppercase ml-1">Atividades</label>
                    <textarea value={routineData.activities} onChange={e => setRoutineData({...routineData, activities: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none min-h-[100px] resize-none" />
                  </div>
                  <div className="col-span-full space-y-2">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Observações</label><button type="button" onClick={handleAISummary} disabled={isGenerating} className="text-[9px] font-black text-white bg-orange-400 px-3 py-1 rounded-full uppercase">{isGenerating ? 'IA...' : 'Auto-Gerar'}</button></div>
                    <textarea value={routineData.observations} onChange={e => setRoutineData({...routineData, observations: e.target.value})} className="w-full p-4 rounded-2xl bg-orange-50/30 text-sm font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none min-h-[100px] resize-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">SALVAR DIÁRIO</button>
              </form>
            ) : <div className="h-full flex items-center justify-center bg-white rounded-[2rem] card-shadow text-gray-400 font-bold">Selecione um aluno na lista ao lado</div>}
          </div>
        </div>
      ) : activeView === 'planning' ? (
        <form onSubmit={e => { e.preventDefault(); onSaveLessonPlan({...planData, grade: classes.find(c => c.id === planData.classId)?.name || '', shift: '', bnccCodes: '', structure: ''}); alert("Plano de aula postado!"); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-6">
          <h3 className="text-xl font-black text-gray-900">Novo Planejamento Pedagógico</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <input type="date" value={planData.date} onChange={e => setPlanData({...planData, date: e.target.value})} className="p-3 rounded-2xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none" />
             <input placeholder="Aula Nº" value={planData.lessonNumber} onChange={e => setPlanData({...planData, lessonNumber: e.target.value})} className="p-3 rounded-2xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none" />
             <select value={planData.classId} onChange={e => setPlanData({...planData, classId: e.target.value})} className="p-3 rounded-2xl bg-gray-50 text-xs font-bold text-black border-transparent focus:ring-2 focus:ring-orange-200 outline-none"><option value="">Turma...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <textarea placeholder="Objetivos e Conteúdo" value={planData.content} onChange={e => setPlanData({...planData, content: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black min-h-[200px] border-transparent focus:ring-2 focus:ring-orange-200 outline-none" />
          <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">ENVIAR PARA APROVAÇÃO</button>
        </form>
      ) : activeView === 'mural' ? (
        <div className="space-y-8"><CreatePostForm onCreatePost={onCreatePost} /><FeedSection posts={posts} onLikePost={onLikePost} currentUserId={currentUserId} /></div>
      ) : (
        <ChatSection currentUser={users.find(u => u.id === currentUserId)!} users={users} messages={messages} config={chatConfig} onSendMessage={onSendMessage} availableContacts={users.filter(u => u.id !== currentUserId)} />
      )}
    </div>
  );
};

export default TeacherDashboard;
