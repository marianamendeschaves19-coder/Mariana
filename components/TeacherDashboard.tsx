
import React, { useState, useEffect } from 'react';
import { Class, Student, RoutineLog, LessonPlan, FeedPost, ChatMessage, ChatConfig, User, UserRole } from '../types';
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
  routineLogs: RoutineLog[];
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
  classes, students, lessonPlans, posts, messages, chatConfig, users, routineLogs,
  onSaveRoutineLog, onDeleteRoutineLog, onUpdateRoutineLog, onSaveLessonPlan, onDeleteLessonPlan, onCreatePost, onLikePost, onSendMessage, currentUserId,
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

  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

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
        {[{ id: 'routines', label: 'DIÁRIO' }, { id: 'planning', label: 'PLANEJAMENTO' }, { id: 'mural', label: 'MURAL' }, { id: 'chat', label: 'CHAT' }].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id as any)} className={`px-6 py-2 rounded-xl font-bold text-[10px] uppercase transition-all whitespace-nowrap ${activeView === v.id ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{v.label}</button>
        ))}
      </div>

      {activeView === 'routines' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-[2rem] card-shadow space-y-4 lg:col-span-1">
             <h3 className="font-black text-gray-800 text-[10px] uppercase tracking-widest mb-4">Todas as Turmas</h3>
             
             <button 
               onClick={() => setSelectedStudent(null)}
               className={`w-full p-3 rounded-2xl border text-left flex justify-between items-center transition-all mb-4 ${!selectedStudent ? 'border-orange-500 bg-orange-50' : 'border-gray-50 hover:border-orange-200'}`}
             >
               <span className={`font-bold text-xs ${!selectedStudent ? 'text-orange-600' : 'text-black'}`}>📋 Ver Tudo (Geral)</span>
             </button>

             {classes.map(cls => (
               <div key={cls.id} className="space-y-2">
                 <h4 className="text-[10px] font-black text-orange-400 uppercase bg-orange-50 px-3 py-1 rounded-full w-fit">{cls.name}</h4>
                 <div className="space-y-1">
                   {students.filter(s => s.classId === cls.id).map(student => (
                     <button key={student.id} onClick={() => setSelectedStudent(student)} className={`w-full p-3 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedStudent?.id === student.id ? 'border-orange-500 bg-orange-50' : 'border-gray-50 hover:border-orange-200'}`}>
                       <span className={`font-bold text-xs ${selectedStudent?.id === student.id ? 'text-orange-600' : 'text-black'}`}>{student.name}</span>
                     </button>
                   ))}
                 </div>
               </div>
             ))}
          </div>
          <div className="lg:col-span-3 space-y-6">
            {/* Cabeçalho e Seletor de Data - Sempre Visível */}
            <div className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">
                  {selectedStudent ? `Agenda de ${selectedStudent.name}` : 'Linha do Tempo Geral'}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registros em tempo real</p>
              </div>
              <div className="flex items-center gap-3 bg-orange-50 p-2 rounded-2xl border border-orange-100">
                <div className="text-right hidden md:block">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Data do Registro</p>
                </div>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)}
                  className="p-2 rounded-xl border-none bg-transparent text-xs font-black text-orange-600 outline-none"
                />
              </div>
            </div>

            {selectedStudent && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
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
              </div>
            )}

            {/* Histórico de Registros do Dia */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {selectedStudent ? 'Histórico do Aluno' : 'Resumo de Todos os Alunos'} ({selectedDate === new Date().toLocaleDateString('en-CA') ? 'Hoje' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')})
                </h4>
                {selectedStudent && routineLogs.filter(l => l.studentId === selectedStudent.id && l.date.substring(0, 10) === selectedDate).length > 0 && (
                  <button 
                    onClick={async () => {
                      setIsGenerating(true);
                      const logs = routineLogs
                        .filter(l => l.studentId === selectedStudent.id && l.date.substring(0, 10) === selectedDate)
                        .map(l => `${l.category}: ${l.content}`)
                        .join('; ');
                      const summary = await generateRoutineSummary(logs);
                      setLogContent(summary);
                      setSelectedCategory('Observação');
                      setIsGenerating(false);
                    }}
                    disabled={isGenerating}
                    className="text-[9px] font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-full uppercase hover:bg-orange-200 transition-all flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-2 h-2 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        Gerando...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        Gerar Resumo AI
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {routineLogs
                  .filter(l => (!selectedStudent || l.studentId === selectedStudent.id) && l.date.substring(0, 10) === selectedDate)
                  .sort((a, b) => b.time.localeCompare(a.time))
                  .map(log => {
                    const student = students.find(s => s.id === log.studentId);
                    return (
                      <div key={log.id} className="bg-white p-5 rounded-[1.5rem] card-shadow border border-orange-50 flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-col items-center gap-1 min-w-[60px]">
                          <span className="text-xs font-black text-orange-500">{log.time}</span>
                          <div className="w-0.5 h-full bg-orange-100 rounded-full"></div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-white bg-orange-400 px-2 py-0.5 rounded uppercase tracking-widest w-fit">{log.category}</span>
                              {!selectedStudent && (
                                <span className="text-[10px] font-black text-orange-600 uppercase">Aluno: {student?.name || 'N/A'}</span>
                              )}
                            </div>
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
                    );
                  })}
                {routineLogs.filter(l => (!selectedStudent || l.studentId === selectedStudent.id) && l.date.substring(0, 10) === selectedDate).length === 0 && (
                  <div className="bg-white/50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase italic">Nenhum registro realizado nesta data.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeView === 'planning' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-orange-50 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900">{editingPlanId ? 'Editar Planejamento' : 'Novo Planejamento Semanal'}</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Organize suas aulas e atividades</p>
              </div>
              {editingPlanId && (
                <button onClick={clearPlanForm} className="px-6 py-2 bg-gray-100 text-gray-500 font-black rounded-xl text-[10px] uppercase hover:bg-gray-200 transition-all">Cancelar Edição</button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Data</label>
                <input type="date" value={planData.date} onChange={e => setPlanData({...planData, date: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nº da Aula</label>
                <input type="text" placeholder="Ex: Aula 05" value={planData.lessonNumber} onChange={e => setPlanData({...planData, lessonNumber: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Turma</label>
                <select value={planData.classId} onChange={e => setPlanData({...planData, classId: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm focus:ring-2 focus:ring-orange-200 outline-none appearance-none">
                  <option value="">Selecione a Turma</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Objetivos de Aprendizagem</label>
                <textarea placeholder="O que os alunos devem aprender?" value={planData.objective} onChange={e => setPlanData({...planData, objective: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm focus:ring-2 focus:ring-orange-200 outline-none min-h-[120px] resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Conteúdo / Atividades</label>
                <textarea placeholder="Descreva o passo a passo da aula..." value={planData.content} onChange={e => setPlanData({...planData, content: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm focus:ring-2 focus:ring-orange-200 outline-none min-h-[120px] resize-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Códigos BNCC</label>
                  <button onClick={handleSuggestBNCC} disabled={isSuggestingBNCC} className="text-[9px] font-black text-orange-500 hover:text-orange-600 uppercase flex items-center gap-1 disabled:opacity-50">
                    {isSuggestingBNCC ? 'Sugerindo...' : '✨ Sugerir via IA'}
                  </button>
                </div>
                <input type="text" placeholder="Ex: EI03ET01, EI03ET04" value={planData.bnccCodes} onChange={e => setPlanData({...planData, bnccCodes: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Recursos / Materiais</label>
                <input type="text" placeholder="Ex: Papel, tinta, pincéis..." value={planData.materials} onChange={e => setPlanData({...planData, materials: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
              </div>
            </div>

            <button
              onClick={() => {
                if (!planData.classId || !planData.date) {
                  showNotification("Preencha a turma e a data.", 'error');
                  return;
                }
                onSaveLessonPlan(editingPlanId ? { ...planData, id: editingPlanId } as any : planData);
                clearPlanForm();
                showNotification(editingPlanId ? "Planejamento atualizado!" : "Planejamento salvo com sucesso!", 'success');
              }}
              className="w-full py-5 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-sm tracking-widest hover:scale-[1.02] transition-all active:scale-95"
            >
              {editingPlanId ? 'ATUALIZAR PLANEJAMENTO' : 'SALVAR PLANEJAMENTO'}
            </button>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Meus Planejamentos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lessonPlans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(plan => (
                <div key={plan.id} className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-50 space-y-4 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-tighter ${plan.status === 'approved' ? 'bg-green-500 text-white' : plan.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'}`}>
                    {plan.status === 'approved' ? 'Aprovado' : plan.status === 'rejected' ? 'Revisar' : 'Pendente'}
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg uppercase">{plan.date}</span>
                      <h5 className="font-black text-gray-800 mt-2">{plan.lessonNumber || 'Sem número'} - {plan.grade}</h5>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditPlan(plan)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                      <button onClick={() => showConfirm("Excluir este planejamento?", () => onDeleteLessonPlan(plan.id, plan.status))} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-600 line-clamp-3">{plan.objective}</p>
                  {plan.managerFeedback && (
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                      <p className="text-[9px] font-black text-red-400 uppercase mb-1">Feedback do Gestor:</p>
                      <p className="text-[11px] font-bold text-red-600 italic">"{plan.managerFeedback}"</p>
                    </div>
                  )}
                </div>
              ))}
              {lessonPlans.length === 0 && (
                <div className="col-span-full bg-white/50 p-12 rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
                  <p className="text-sm font-bold text-gray-400 uppercase italic">Nenhum planejamento cadastrado.</p>
                </div>
              )}
            </div>
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
