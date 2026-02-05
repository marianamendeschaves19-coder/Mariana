
import React, { useState, useEffect } from 'react';
import { Class, Student, User, UserRole, LessonPlan, FeedPost, ChatMessage, ChatConfig, SchoolEvent, SchoolMenu, RoutineEntry } from '../types';
import CreatePostForm from './CreatePostForm';
import FeedSection from './FeedSection';
import ChatSection from './ChatSection';

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
  onUpdateStudent: (id: string, studentName: string, classId: string, guardianEmails: string) => void;
  onDeleteStudent: (id: string) => void;
  onAddUser: (name: string, email: string, role: UserRole, password?: string) => void;
  onDeleteUser: (id: string) => void;
  onAddEvent: (event: Partial<SchoolEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onAddMenu: (menu: Partial<SchoolMenu>) => void;
  onDeleteMenu: (id: string) => void;
  onApprovePlan: (planId: string, feedback: string) => void;
  onCreatePost: (post: any) => void;
  onLikePost: (postId: string) => void;
  onSendMessage: (content: string, receiverId: string) => void;
  onUpdateChatConfig: (config: ChatConfig) => void;
  onSaveRoutine: (routine: Omit<RoutineEntry, 'id'>) => void;
  currentUserId: string;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  classes, students, users, lessonPlans = [], posts, messages, chatConfig, events, menus, routines,
  onAddClass, onUpdateClassTeacher, onDeleteClass, onAddStudent, onUpdateStudent, onDeleteStudent, 
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
  
  // Alunos Form
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
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

  // Estados de Rotina
  const [selectedRoutineStudent, setSelectedRoutineStudent] = useState<Student | null>(null);
  const [routineData, setRoutineData] = useState<Omit<RoutineEntry, 'id' | 'studentId' | 'authorId'>>({
    date: new Date().toISOString().split('T')[0],
    attendance: 'present', colacao: 'comeu tudo', almoco: 'comeu tudo', lanche: 'comeu tudo', janta: 'comeu tudo',
    banho: 'não', agua: 'bebeu bastante', evacuacao: 'não', fralda: '1x', sleep: 'dormiu', activities: '', observations: '', mood: 'happy'
  });

  const [planFeedback, setPlanFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedRoutineStudent) {
      const existing = routines.find(r => r.studentId === selectedRoutineStudent.id && r.date === routineData.date);
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
  }, [selectedRoutineStudent, routineData.date]);

  const handleRoutineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoutineStudent) return;
    onSaveRoutine({ ...routineData, studentId: selectedRoutineStudent.id, authorId: currentUserId });
    alert("Diário atualizado e salvo!");
  };

  const handleApprovePlan = (pid: string) => {
    onApprovePlan(pid, planFeedback[pid] || '');
    alert("Visto aplicado com sucesso!");
  };

  const handleEditStudent = (s: Student) => {
    setEditingStudentId(s.id);
    setStudentName(s.name);
    setTargetClassId(s.classId);
    const emails = s.guardianIds.map(gid => users.find(u => u.id === gid)?.email).filter(Boolean).join(', ');
    setGuardianEmails(emails);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearStudentForm = () => {
    setEditingStudentId(null);
    setStudentName('');
    setTargetClassId('');
    setGuardianEmails('');
  };

  const currentManager = users.find(u => u.id === currentUserId) || { id: currentUserId, name: 'Gestor', role: UserRole.MANAGER, email: '' };

  const getRoleStyle = (role: UserRole) => {
    switch(role) {
      case UserRole.MANAGER: return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', icon: '🔑', label: 'Gestor' };
      case UserRole.TEACHER: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: '👩‍🏫', label: 'Professor' };
      case UserRole.GUARDIAN: return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: '🏠', label: 'Família' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', icon: '👤', label: 'Usuário' };
    }
  };

  return (
    <div className="space-y-6 font-['Quicksand']">
      <div className="flex gap-2 border-b overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'menu', label: 'CARDÁPIO' }, { id: 'routines', label: 'DIÁRIO' }, 
          { id: 'classes', label: 'TURMAS' }, { id: 'students', label: 'ALUNOS' }, 
          { id: 'users', label: 'EQUIPE' }, { id: 'plans', label: 'PLANEJAMENTO' }, 
          { id: 'events', label: 'EVENTOS' }, { id: 'mural', label: 'MURAL' }, 
          { id: 'chat', label: 'CHAT' }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-t-2xl font-black text-xs transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-orange-100 text-orange-600 border-b-4 border-orange-500' : 'text-gray-400'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          
          {/* Aba Cardápio */}
          {activeTab === 'menu' && (
            <div className="space-y-6 animate-in fade-in">
              <form onSubmit={e => { e.preventDefault(); onAddMenu({ date: mnDate, colacao: mnCol, almoco: mnAlm, lanche: mnLan, janta: mnJan }); setMnCol(''); setMnAlm(''); setMnLan(''); setMnJan(''); alert("Cardápio do dia salvo!"); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
                <h3 className="text-xl font-black text-gray-900 leading-tight">🍎 Gestão de Cardápio</h3>
                <input type="date" value={mnDate} onChange={e => setMnDate(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border-transparent focus:ring-2 focus:ring-orange-200" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input placeholder="Colação" value={mnCol} onChange={e => setMnCol(e.target.value)} className="p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                  <input placeholder="Almoço" value={mnAlm} onChange={e => setMnAlm(e.target.value)} className="p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                  <input placeholder="Lanche" value={mnLan} onChange={e => setMnLan(e.target.value)} className="p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                  <input placeholder="Janta" value={mnJan} onChange={e => setMnJan(e.target.value)} className="p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                </div>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl uppercase tracking-widest text-sm">SALVAR CARDÁPIO</button>
              </form>

              <div className="space-y-4">
                 <h4 className="font-black text-gray-700">Histórico de Cardápios</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menus.sort((a,b) => b.date.localeCompare(a.date)).map(m => (
                      <div key={m.id} className="p-4 bg-white rounded-2xl border flex justify-between items-center text-xs card-shadow">
                        <div>
                          <p className="font-bold text-orange-600">{new Date(m.date).toLocaleDateString()}</p>
                          <p className="text-gray-500 truncate max-w-[200px]">{m.almoco}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => { setMnDate(m.date); setMnCol(m.colacao); setMnAlm(m.almoco); setMnLan(m.lanche); setMnJan(m.janta); }} className="text-blue-500 font-bold">Editar</button>
                           <button onClick={() => onDeleteMenu(m.id)} className="text-red-500 font-black">Apagar</button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {/* Aba Turmas */}
          {activeTab === 'classes' && (
            <div className="space-y-6 animate-in fade-in">
              <form onSubmit={e => { e.preventDefault(); onAddClass(className, classTeacherId); setClassName(''); setClassTeacherId(''); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
                <h3 className="text-xl font-black text-gray-900 leading-tight">🎨 Cadastro de Turma</h3>
                <input required placeholder="Nome da Turma" value={className} onChange={e => setClassName(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                <select required value={classTeacherId} onChange={e => setClassTeacherId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border">
                  <option value="">Selecione o Professor responsável</option>
                  {users.filter(u => u.role === UserRole.TEACHER).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl uppercase text-sm">CADASTRAR TURMA</button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map(cls => (
                  <div key={cls.id} className="bg-white p-6 rounded-[2rem] border border-orange-50 card-shadow space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-gray-900">{cls.name}</h4>
                      <button onClick={() => onDeleteClass(cls.id)} className="text-red-400 font-bold text-[10px] uppercase">Apagar</button>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Professor: {users.find(u => u.id === cls.teacherId)?.name || 'Nenhum'}</p>
                    <div className="pt-2">
                       <p className="text-[9px] font-black text-orange-400 uppercase mb-2">Alunos Vinculados:</p>
                       <ul className="space-y-1">
                         {students.filter(s => s.classId === cls.id).map(s => (
                           <li key={s.id} className="text-xs font-bold text-gray-700">• {s.name}</li>
                         ))}
                         {students.filter(s => s.classId === cls.id).length === 0 && <li className="text-xs text-gray-400 italic">Nenhum aluno nesta turma.</li>}
                       </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aba Alunos */}
          {activeTab === 'students' && (
            <div className="space-y-6 animate-in fade-in">
              <form onSubmit={e => { 
                e.preventDefault(); 
                if (editingStudentId) {
                  onUpdateStudent(editingStudentId, studentName, targetClassId, guardianEmails);
                  alert("Aluno atualizado!");
                } else {
                  onAddStudent(studentName, targetClassId, guardianEmails);
                  alert("Aluno cadastrado!");
                }
                clearStudentForm();
              }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-900 leading-tight">🧒 {editingStudentId ? 'Alterar Dados do Aluno' : 'Cadastro de Aluno'}</h3>
                  {editingStudentId && <button type="button" onClick={clearStudentForm} className="text-[10px] font-black text-gray-400 uppercase hover:text-red-500">Cancelar Edição</button>}
                </div>
                <input required placeholder="Nome do Aluno" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                <select required value={targetClassId} onChange={e => setTargetClassId(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border">
                  <option value="">Selecione a Turma</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input required placeholder="E-mails dos Pais (mais de um? separe por vírgula)" value={guardianEmails} onChange={e => setGuardianEmails(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl uppercase text-sm">
                  {editingStudentId ? 'ATUALIZAR DADOS' : 'CADASTRAR ALUNO'}
                </button>
              </form>

              <div className="bg-white p-6 rounded-[2rem] border card-shadow overflow-x-auto">
                 <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b font-black text-orange-500 uppercase tracking-widest">
                        <th className="pb-4 px-2">Aluno</th>
                        <th className="pb-4 px-2">Turma</th>
                        <th className="pb-4 px-2">Responsáveis (E-mails)</th>
                        <th className="pb-4 px-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-2 font-bold">{s.name}</td>
                          <td className="py-4 px-2 font-medium">{classes.find(c => c.id === s.classId)?.name || '---'}</td>
                          <td className="py-4 px-2 font-medium">
                            {s.guardianIds.map(gid => users.find(u => u.id === gid)?.email).filter(Boolean).join(', ')}
                          </td>
                          <td className="py-4 px-2">
                             <div className="flex gap-2">
                               <button onClick={() => handleEditStudent(s)} className="text-blue-500 font-bold hover:underline" title="Editar">✏️ Editar</button>
                               <button onClick={() => { if(confirm("Apagar aluno?")) onDeleteStudent(s.id); }} className="text-red-500 font-bold hover:underline" title="Excluir">🗑️ Excluir</button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

          {/* Aba Equipe */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in">
              <form onSubmit={e => { e.preventDefault(); onAddUser(tName, tEmail, tRole); setTName(''); setTEmail(''); alert("Usuário cadastrado com sucesso!"); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
                <h3 className="text-xl font-black text-gray-900 leading-tight">👥 Gestão de Equipe e Usuários</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Nome Completo" value={tName} onChange={e => setTName(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                  <input required placeholder="E-mail" value={tEmail} onChange={e => setTEmail(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                </div>
                <select value={tRole} onChange={e => setTRole(e.target.value as UserRole)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border">
                  <option value={UserRole.TEACHER}>Professor(a)</option>
                  <option value={UserRole.MANAGER}>Gestor(a)</option>
                  <option value={UserRole.GUARDIAN}>Família</option>
                </select>
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">CADASTRAR NOVO MEMBRO</button>
              </form>

              <div className="space-y-4">
                 <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Membros Cadastrados</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {users.sort((a,b) => a.role.localeCompare(b.role)).map(u => {
                      const style = getRoleStyle(u.role);
                      return (
                        <div key={u.id} className={`p-5 rounded-[1.5rem] border ${style.border} ${style.bg} card-shadow transition-all hover:scale-[1.02] flex justify-between items-start`}>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{style.icon}</span>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${style.text} bg-white border`}>{style.label}</span>
                            </div>
                            <p className="font-black text-gray-900 truncate text-sm">{u.name}</p>
                            <p className="text-[10px] font-bold text-gray-500 truncate">{u.email}</p>
                          </div>
                          {u.id !== currentUserId && (
                            <button 
                              onClick={() => onDeleteUser(u.id)} 
                              className="text-gray-300 hover:text-red-500 transition-colors p-1"
                              title="Remover usuário"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      );
                    })}
                 </div>
              </div>
            </div>
          )}

          {/* Outras Abas */}
          {activeTab === 'mural' && <div className="space-y-8 animate-in fade-in"><CreatePostForm onCreatePost={onCreatePost} /><FeedSection posts={posts} onLikePost={onLikePost} currentUserId={currentUserId} /></div>}
          {activeTab === 'chat' && (
            <ChatSection 
              currentUser={currentManager} 
              users={users} 
              messages={messages} 
              config={chatConfig} 
              onSendMessage={onSendMessage} 
              availableContacts={users.filter(u => u.id !== currentUserId)} 
            />
          )}
          {activeTab === 'events' && (
             <div className="space-y-6 animate-in fade-in">
              <form onSubmit={e => { e.preventDefault(); onAddEvent({ title: evTitle, date: evDate, description: evDesc, location: evLoc }); setEvTitle(''); setEvDate(''); setEvDesc(''); setEvLoc(''); alert("Evento agendado!"); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
                <h3 className="text-xl font-black text-gray-900 leading-tight">📅 Novo Evento Escolar</h3>
                <input required placeholder="Título" value={evTitle} onChange={e => setEvTitle(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                <input required type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                <input placeholder="Local" value={evLoc} onChange={e => setEvLoc(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                <textarea placeholder="Descrição completa..." value={evDesc} onChange={e => setEvDesc(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold min-h-[100px] outline-none border" />
                <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl uppercase text-sm">PUBLICAR EVENTO</button>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(ev => (
                  <div key={ev.id} className="p-4 bg-white rounded-2xl border flex justify-between items-center text-xs card-shadow border-orange-50">
                    <div>
                      <p className="font-bold text-orange-600">{new Date(ev.date).toLocaleDateString()} - {ev.title}</p>
                      <p className="text-gray-500 truncate max-w-[200px]">{ev.location}</p>
                    </div>
                    <button onClick={() => onDeleteEvent(ev.id)} className="text-red-500 font-black">Excluir</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'plans' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-black text-gray-900 leading-tight">📝 Visto em Planejamentos</h3>
              {lessonPlans.map(p => (
                <div key={p.id} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-50 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-gray-900 text-lg">{p.grade} - Aula {p.lessonNumber}</h4>
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Docente: {users.find(u => u.id === p.teacherId)?.name}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {p.status === 'approved' ? 'Aprovado' : 'Pendente'}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl text-xs font-bold text-gray-700">{p.content}</div>
                  {p.status === 'pending' && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <textarea placeholder="Adicionar feedback/visto..." value={planFeedback[p.id] || ''} onChange={(e) => setPlanFeedback({ ...planFeedback, [p.id]: e.target.value })} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold text-xs outline-none border" />
                      <button onClick={() => handleApprovePlan(p.id)} className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest">DAR VISTO E APROVAR</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === 'routines' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="bg-white p-6 rounded-[2rem] card-shadow border border-orange-100 flex gap-4">
                <select className="flex-1 p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" onChange={e => {
                  const student = students.find(s => s.id === e.target.value);
                  setSelectedRoutineStudent(student || null);
                }}>
                  <option value="">Visualizar Diário de...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input type="date" value={routineData.date} onChange={e => setRoutineData({...routineData, date: e.target.value})} className="p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
              </div>
              {selectedRoutineStudent && (
                 <form onSubmit={handleRoutineSubmit} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-6">
                    <h3 className="text-lg font-black text-gray-900 leading-tight">Revisão do Diário: {selectedRoutineStudent.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Colacao', 'Almoco', 'Lanche', 'Janta'].map(field => (
                          <div key={field}>
                            <label className="text-[9px] font-black text-gray-400 uppercase">{field}</label>
                            <select value={(routineData as any)[field.toLowerCase()]} onChange={e => setRoutineData({...routineData, [field.toLowerCase()]: e.target.value as any})} className="w-full p-3 rounded-xl bg-gray-50 text-xs font-bold text-black border">
                                <option value="comeu tudo">Comeu tudo</option><option value="comeu bem">Comeu bem</option><option value="comeu metade">Comeu metade</option><option value="recusou">Recusou</option><option value="não ofertado">Não ofertado</option>
                            </select>
                          </div>
                        ))}
                    </div>
                    <button type="submit" className="w-full py-5 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase">SALVAR ALTERAÇÕES NO DIÁRIO</button>
                 </form>
              )}
            </div>
          )}

        </div>
        
        {/* Painel lateral Gestor */}
        <div className="space-y-6">
          <div className="bg-white rounded-[3rem] p-8 text-center border border-orange-100 flex flex-col items-center card-shadow sticky top-24">
            <div className="w-24 h-24 bg-orange-100 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-inner rotate-3 mb-6">🎨</div>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Painel Gestor</p>
            <h2 className="text-lg font-black text-gray-800 mt-2 mb-6 leading-tight px-2">{currentManager.name}</h2>
            <div className="w-full space-y-3 pt-6 border-t border-gray-50">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"><span className="text-[9px] font-black text-gray-400 uppercase">Turmas</span><span className="text-sm font-black text-orange-500">{classes.length}</span></div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"><span className="text-[9px] font-black text-gray-400 uppercase">Alunos</span><span className="text-sm font-black text-orange-500">{students.length}</span></div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"><span className="text-[9px] font-black text-gray-400 uppercase">Gestores</span><span className="text-sm font-black text-purple-500">{users.filter(u => u.role === UserRole.MANAGER).length}</span></div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"><span className="text-[9px] font-black text-gray-400 uppercase">Professores</span><span className="text-sm font-black text-blue-500">{users.filter(u => u.role === UserRole.TEACHER).length}</span></div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"><span className="text-[9px] font-black text-gray-400 uppercase">Famílias</span><span className="text-sm font-black text-orange-500">{users.filter(u => u.role === UserRole.GUARDIAN).length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
