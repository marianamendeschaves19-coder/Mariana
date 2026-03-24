
import React, { useState, useEffect } from 'react';
import { Class, Student, User, UserRole, LessonPlan, FeedPost, ChatMessage, ChatConfig, SchoolEvent, SchoolMenu, RoutineLog } from '../types';
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
  routineLogs: RoutineLog[];
  onAddClass: (name: string, teacherId: string) => void;
  onUpdateClassTeacher: (classId: string, teacherId: string) => void;
  onDeleteClass: (id: string) => void;
  onAddStudent: (studentName: string, classId: string, guardianEmails: string, birthDate: string) => void;
  onUpdateStudent: (id: string, studentName: string, classId: string, guardianEmails: string, birthDate: string) => void;
  onDeleteStudent: (id: string) => void;
  onAddUser: (name: string, email: string, role: UserRole, password?: string) => void;
  onDeleteUser: (id: string) => void;
  onAddEvent: (event: Partial<SchoolEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onAddMenu: (menu: Partial<SchoolMenu>) => void;
  onDeleteMenu: (id: string) => void;
  onApprovePlan: (planId: string, status: 'approved' | 'rejected', feedback: string) => void;
  onCreatePost: (post: any) => void;
  onLikePost: (postId: string) => void;
  onSendMessage: (content: string, receiverId: string) => void;
  onUpdateChatConfig: (config: ChatConfig) => void;
  onSaveRoutineLog: (log: Omit<RoutineLog, 'id' | 'createdAt'>) => void;
  onDeleteRoutineLog: (id: string) => void;
  onUpdateRoutineLog: (id: string, content: string) => void;
  currentUserId: string;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  classes, students, users, lessonPlans = [], posts, messages, chatConfig, events, menus, routineLogs,
  onAddClass, onUpdateClassTeacher, onDeleteClass, onAddStudent, onUpdateStudent, onDeleteStudent, 
  onAddUser, onDeleteUser, onAddEvent, onDeleteEvent, onAddMenu, onDeleteMenu,
  onApprovePlan, onCreatePost, onLikePost, onSendMessage, onUpdateChatConfig, onSaveRoutineLog, onDeleteRoutineLog, onUpdateRoutineLog, currentUserId,
  showNotification, showConfirm
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'students' | 'users' | 'plans' | 'mural' | 'chat' | 'events' | 'menu'>('dashboard');
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };
  
  // States de Formulário
  const [mnDate, setMnDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [mnCol, setMnCol] = useState('');
  const [mnAlm, setMnAlm] = useState('');
  const [mnLan, setMnLan] = useState('');
  const [mnJan, setMnJan] = useState('');

  const [className, setClassName] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  
  // Alunos Form
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentBirthDate, setStudentBirthDate] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [guardianEmails, setGuardianEmails] = useState('');

  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tRole, setTRole] = useState<UserRole>(UserRole.TEACHER);
  
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evLoc, setEvLoc] = useState('');

  const handleEditStudent = (s: Student) => {
    setEditingStudentId(s.id);
    setStudentName(s.name);
    setStudentBirthDate(s.birthDate || '');
    setTargetClassId(s.classId);
    const emails = s.guardianIds.map(gid => users.find(u => u.id === gid)?.email).filter(Boolean).join(', ');
    setGuardianEmails(emails);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearStudentForm = () => {
    setEditingStudentId(null);
    setStudentName('');
    setStudentBirthDate('');
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
          { id: 'dashboard', label: 'DASHBOARD' }, { id: 'menu', label: 'CARDÁPIO' }, 
          { id: 'classes', label: 'TURMAS' }, { id: 'students', label: 'ALUNOS' }, 
          { id: 'users', label: 'EQUIPE' }, { id: 'plans', label: 'PLANEJAMENTOS' },
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
          
          {/* Aba Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-orange-100 card-shadow flex flex-col items-center justify-center space-y-2">
                  <span className="text-4xl">🎨</span>
                  <h4 className="text-2xl font-black text-gray-900">{classes.length}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turmas Ativas</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-orange-100 card-shadow flex flex-col items-center justify-center space-y-2">
                  <span className="text-4xl">🧒</span>
                  <h4 className="text-2xl font-black text-gray-900">{students.length}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alunos Matriculados</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-orange-100 card-shadow flex flex-col items-center justify-center space-y-2">
                  <span className="text-4xl">👩‍🏫</span>
                  <h4 className="text-2xl font-black text-gray-900">{users.filter(u => u.role === UserRole.TEACHER).length}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Professores</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-orange-100 card-shadow space-y-6">
                <h3 className="text-xl font-black text-gray-900 leading-tight">🚀 Visão Geral da Escola</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest">Próximos Eventos</h4>
                    <div className="space-y-2">
                      {events.slice(0, 3).map(ev => (
                        <div key={ev.id} className="p-4 bg-gray-50 rounded-2xl border flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{ev.title}</p>
                            <p className="text-[10px] text-gray-500">{formatDate(ev.date)}</p>
                          </div>
                          <span className="text-xs font-black text-orange-400">📅</span>
                        </div>
                      ))}
                      {events.length === 0 && <p className="text-xs text-gray-400 italic">Nenhum evento agendado.</p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest">Planejamentos Pendentes</h4>
                    <div className="space-y-2">
                      {lessonPlans.filter(p => p.status === 'pending').slice(0, 3).map(plan => (
                        <div key={plan.id} className="p-4 bg-gray-50 rounded-2xl border flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{plan.objective}</p>
                            <p className="text-[10px] text-gray-500">{users.find(u => u.id === plan.teacherId)?.name}</p>
                          </div>
                          <span className="text-xs font-black text-blue-400">📝</span>
                        </div>
                      ))}
                      {lessonPlans.filter(p => p.status === 'pending').length === 0 && <p className="text-xs text-gray-400 italic">Tudo em dia!</p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-pink-500 uppercase tracking-widest">Aniversariantes do Mês</h4>
                    <div className="space-y-2">
                      {students.filter(s => {
                        if (!s.birthDate) return false;
                        const birthMonth = new Date(s.birthDate).getMonth();
                        const currentMonth = new Date().getMonth();
                        return birthMonth === currentMonth;
                      }).slice(0, 5).map(s => (
                        <div key={s.id} className="p-4 bg-pink-50 rounded-2xl border border-pink-100 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-pink-800 text-sm">{s.name}</p>
                            <p className="text-[10px] text-pink-500">{s.birthDate ? new Date(s.birthDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}</p>
                          </div>
                          <span className="text-xs font-black text-pink-400">🎂</span>
                        </div>
                      ))}
                      {students.filter(s => {
                        if (!s.birthDate) return false;
                        const birthMonth = new Date(s.birthDate).getMonth();
                        const currentMonth = new Date().getMonth();
                        return birthMonth === currentMonth;
                      }).length === 0 && <p className="text-xs text-gray-400 italic">Nenhum aniversariante este mês.</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-8 rounded-[2.5rem] text-white card-shadow flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-2xl font-black leading-tight">Bem-vindo(a) ao Aquarela Manager!</h3>
                  <p className="text-sm font-medium opacity-90">Gerencie sua escola com amor e tecnologia. 🎨🚀</p>
                </div>
                <button onClick={() => setActiveTab('mural')} className="px-8 py-4 bg-white text-orange-600 font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest hover:scale-105 transition-all">
                  Ver Mural da Escola
                </button>
              </div>
            </div>
          )}

          {/* Aba Cardápio */}
          {activeTab === 'menu' && (
            <div className="space-y-6 animate-in fade-in">
              <form onSubmit={e => { e.preventDefault(); onAddMenu({ date: mnDate, colacao: mnCol, almoco: mnAlm, lanche: mnLan, janta: mnJan }); setMnCol(''); setMnAlm(''); setMnLan(''); setMnJan(''); showNotification("Cardápio do dia salvo!", 'success'); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
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
                  onUpdateStudent(editingStudentId, studentName, targetClassId, guardianEmails, studentBirthDate);
                  showNotification("Aluno atualizado!", 'success');
                } else {
                  onAddStudent(studentName, targetClassId, guardianEmails, studentBirthDate);
                  showNotification("Aluno cadastrado!", 'success');
                }
                clearStudentForm();
              }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-900 leading-tight">🧒 {editingStudentId ? 'Alterar Dados do Aluno' : 'Cadastro de Aluno'}</h3>
                  {editingStudentId && <button type="button" onClick={clearStudentForm} className="text-[10px] font-black text-gray-400 uppercase hover:text-red-500">Cancelar Edição</button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Nome do Aluno" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Data de Nascimento</label>
                    <input required type="date" value={studentBirthDate} onChange={e => setStudentBirthDate(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 text-black font-bold outline-none border" />
                  </div>
                </div>
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
                        <th className="pb-4 px-2">Nascimento</th>
                        <th className="pb-4 px-2">Turma</th>
                        <th className="pb-4 px-2">Responsáveis (E-mails)</th>
                        <th className="pb-4 px-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-2 font-bold">{s.name}</td>
                          <td className="py-4 px-2 font-medium">{s.birthDate ? formatDate(s.birthDate) : '---'}</td>
                          <td className="py-4 px-2 font-medium">{classes.find(c => c.id === s.classId)?.name || '---'}</td>
                          <td className="py-4 px-2 font-medium">
                            {s.guardianIds.map(gid => users.find(u => u.id === gid)?.email).filter(Boolean).join(', ')}
                          </td>
                          <td className="py-4 px-2">
                             <div className="flex gap-2">
                               <button onClick={() => handleEditStudent(s)} className="text-blue-500 font-bold hover:underline" title="Editar">✏️ Editar</button>
                               <button onClick={() => showConfirm("Apagar aluno?", () => onDeleteStudent(s.id))} className="text-red-500 font-bold hover:underline" title="Excluir">🗑️ Excluir</button>
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
              <form onSubmit={e => { e.preventDefault(); onAddUser(tName, tEmail, tRole); setTName(''); setTEmail(''); showNotification("Usuário cadastrado com sucesso!", 'success'); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
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
                              className={`transition-all p-2 rounded-xl ${u.role === UserRole.TEACHER ? 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white' : 'text-gray-300 hover:text-red-500'}`}
                              title={u.role === UserRole.TEACHER ? "Excluir professor e todos os seus dados" : "Remover usuário"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
          {activeTab === 'plans' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100">
                <h3 className="text-xl font-black text-gray-900 leading-tight mb-6">📝 Planejamentos dos Professores</h3>
                <div className="space-y-4">
                  {lessonPlans.length === 0 && <p className="text-center text-gray-400 py-8">Nenhum planejamento enviado.</p>}
                  {lessonPlans.map(plan => (
                    <div key={plan.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{plan.grade} - {formatDate(plan.date)}</p>
                          <h4 className="text-lg font-black text-gray-800">Aula #{plan.lessonNumber}: {plan.objective}</h4>
                          <p className="text-xs text-gray-400 uppercase font-bold">Professor: {users.find(u => u.id === plan.teacherId)?.name || 'N/A'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          plan.status === 'approved' ? 'bg-green-100 text-green-600' : 
                          plan.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {plan.status === 'approved' ? 'Aprovado' : plan.status === 'rejected' ? 'Revisão' : 'Pendente'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-black text-gray-400 uppercase text-[9px]">Conteúdo</p>
                          <p className="text-gray-700">{plan.content}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-gray-400 uppercase text-[9px]">Materiais</p>
                          <p className="text-gray-700">{plan.materials}</p>
                        </div>
                      </div>

                      {plan.status === 'pending' && (
                        <div className="pt-4 border-t border-gray-200 flex gap-4">
                          <button 
                            onClick={() => onApprovePlan(plan.id, 'approved', '')}
                            className="flex-1 py-3 bg-green-500 text-white font-black rounded-xl text-xs uppercase"
                          >
                            APROVAR
                          </button>
                          <button 
                            onClick={() => {
                              const feedback = prompt("Digite o feedback para revisão:");
                              if (feedback) onApprovePlan(plan.id, 'rejected', feedback);
                            }}
                            className="flex-1 py-3 bg-red-500 text-white font-black rounded-xl text-xs uppercase"
                          >
                            SOLICITAR REVISÃO
                          </button>
                        </div>
                      )}

                      {plan.managerFeedback && (
                        <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                          <p className="text-[9px] font-black text-orange-400 uppercase">Feedback do Gestor</p>
                          <p className="text-xs text-orange-700 font-bold italic">"{plan.managerFeedback}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
              <form onSubmit={e => { e.preventDefault(); onAddEvent({ title: evTitle, date: evDate, description: evDesc, location: evLoc }); setEvTitle(''); setEvDate(''); setEvDesc(''); setEvLoc(''); showNotification("Evento agendado!", 'success'); }} className="bg-white p-8 rounded-[2rem] card-shadow border border-orange-100 space-y-4">
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
                      <p className="font-bold text-orange-600">{formatDate(ev.date)} - {ev.title}</p>
                      <p className="text-gray-500 truncate max-w-[200px]">{ev.location}</p>
                    </div>
                    <button onClick={() => onDeleteEvent(ev.id)} className="text-red-500 font-black">Excluir</button>
                  </div>
                ))}
              </div>
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
