
import React, { useState, useEffect } from 'react';
import { User, UserRole, Class, Student, RoutineEntry, ViewState, LessonPlan, FeedPost, ChatMessage, ChatConfig, SchoolEvent, SchoolMenu } from './types';
import Layout from './components/Layout';
import ManagerDashboard from './components/ManagerDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import GuardianDashboard from './components/GuardianDashboard';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('LOGIN');
  const [loginRole, setLoginRole] = useState<UserRole>(UserRole.GUARDIAN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupFunction, setSignupFunction] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [routines, setRoutines] = useState<RoutineEntry[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatConfig, setChatConfig] = useState<ChatConfig>({ startHour: 8, endHour: 18, isEnabled: true });
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [menus, setMenus] = useState<SchoolMenu[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const fetchTable = async (table: string) => {
        const { data, error } = await supabase.from(table).select('*');
        if (error) return [];
        return data || [];
      };

      const [dbClasses, dbStudents, dbRoutines, dbPlans, dbPosts, dbEvents, dbMenus, dbMessages, dbUsers] = await Promise.all([
        fetchTable('classes'), fetchTable('students'), fetchTable('routines'),
        fetchTable('lesson_plans'), fetchTable('posts'), fetchTable('events'),
        fetchTable('menus'), fetchTable('messages'), fetchTable('users')
      ]);

      setClasses(dbClasses.map((c: any) => ({ ...c, teacherId: c.teacher_id })));
      setStudents(dbStudents.map((s: any) => ({ ...s, classId: s.class_id, guardianIds: s.guardian_ids || [] })));
      setRoutines(dbRoutines.map((r: any) => ({ ...r, studentId: r.student_id, authorId: r.author_id })));
      setLessonPlans(dbPlans.map((p: any) => ({ 
        ...p, 
        teacherId: p.teacher_id, 
        classId: p.class_id, 
        lessonNumber: p.lesson_number,
        managerFeedback: p.manager_feedback,
        bnccCodes: p.bncc_codes
      })));
      setPosts(dbPosts.map((p: any) => ({ 
        ...p, 
        authorId: p.author_id, 
        authorRole: p.author_role as UserRole, 
        createdAt: p.created_at,
        authorName: p.author_name
      })).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setEvents(dbEvents);
      setMenus(dbMenus);
      setMessages(dbMessages.map((m: any) => ({ ...m, senderId: m.sender_id, receiverId: m.receiver_id })));
      setUsers(dbUsers);
    } catch (error) {
      console.error("Erro na carga de dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let { data } = await supabase.from('users').select('*').eq('email', loginEmail.toLowerCase().trim()).eq('role', loginRole).single();
    if (!data || data.password !== loginPassword) return alert("Credenciais inválidas.");
    setCurrentUser(data);
    setViewState('DASHBOARD');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = { 
      id: `u-${Date.now()}`, 
      name: signupName, 
      email: signupEmail.toLowerCase().trim(), 
      function: signupFunction, 
      password: signupPassword, 
      role: UserRole.MANAGER 
    };
    const { error } = await supabase.from('users').insert([newUser]);
    if (error) return alert("Erro ao criar gestor: " + error.message);
    setUsers(prev => [...prev, newUser]);
    setViewState('LOGIN');
  };

  const onSaveUser = async (u: User) => {
    await supabase.from('users').upsert([u]);
    fetchData();
  };

  const onSaveClass = async (name: string, teacherId: string, existingId?: string) => {
    const id = existingId || `c-${Date.now()}`;
    const payload = { id, name, teacher_id: teacherId };
    const { error } = await supabase.from('classes').upsert([payload]);
    if (error) return alert("Erro ao salvar turma: " + error.message);
    fetchData();
  };

  const onSaveStudent = async (name: string, classId: string, emailsStr: string, existingId?: string) => {
    const emails = emailsStr.split(/[,;\n]/).map(e => e.trim().toLowerCase()).filter(e => e !== "");
    const gIds: string[] = [];
    
    for (const email of emails) {
      const { data: existingUser } = await supabase.from('users').select('*').eq('email', email).single();
      
      if (existingUser) {
        gIds.push(existingUser.id);
      } else {
        const newId = `u-${Math.random().toString(36).substr(2, 9)}`;
        const newG = { id: newId, name: `Resp. de ${name}`, email, role: UserRole.GUARDIAN, password: '123' };
        await supabase.from('users').insert([newG]);
        gIds.push(newId);
      }
    }
    
    const id = existingId || `s-${Date.now()}`;
    const payload = { id, name, class_id: classId, guardian_ids: gIds };
    const { error } = await supabase.from('students').upsert([payload]);
    if (error) return alert("Erro ao salvar aluno: " + error.message);
    fetchData();
  };

  const handleSaveRoutine = async (nr: Omit<RoutineEntry, 'id'>) => {
    const existing = routines.find(r => r.studentId === nr.studentId && r.date === nr.date);
    const id = existing ? existing.id : `r-${Date.now()}`;
    const dbPayload = {
      id, student_id: nr.studentId, date: nr.date, attendance: nr.attendance,
      colacao: nr.colacao, almoco: nr.almoco, lanche: nr.lanche, janta: nr.janta,
      banho: nr.banho, agua: nr.agua, evacuacao: nr.evacuacao, fralda: nr.fralda,
      sleep: nr.sleep, activities: nr.activities, observations: nr.observations,
      mood: nr.mood, author_id: nr.authorId
    };
    
    const { error } = await supabase.from('routines').upsert([dbPayload]);
    if (error) return alert("Erro ao salvar rotina: " + error.message);
    fetchData();
  };

  const onAddEvent = async (ev: Partial<SchoolEvent>) => {
    const id = ev.id || `e-${Date.now()}`;
    const payload = { ...ev, id };
    const { error } = await supabase.from('events').upsert([payload]);
    if (error) return alert("Erro ao salvar evento: " + error.message);
    fetchData();
  };

  const onAddMenu = async (m: Partial<SchoolMenu>) => {
    const id = m.id || `menu-${Date.now()}`;
    const payload = { ...m, id };
    const { error } = await supabase.from('menus').upsert([payload]);
    if (error) return alert("Erro ao salvar cardápio: " + error.message);
    fetchData();
  };

  const onSaveLessonPlan = async (pd: any) => {
    const id = pd.id || `plan-${Date.now()}`;
    const dbPayload = {
      id,
      teacher_id: pd.teacherId || currentUser?.id,
      class_id: pd.classId,
      date: pd.date,
      lesson_number: pd.lessonNumber,
      grade: pd.grade,
      objective: pd.objective,
      content: pd.content,
      materials: pd.materials,
      bncc_codes: pd.bnccCodes,
      status: pd.status || 'pending',
      manager_feedback: pd.managerFeedback
    };
    const { error } = await supabase.from('lesson_plans').upsert([dbPayload]);
    if (error) return alert("Erro ao salvar plano: " + error.message);
    fetchData();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-orange-50 font-black text-orange-400 animate-pulse uppercase tracking-widest text-lg">Aquarela Carregando...</div>;

  if (viewState === 'LOGIN') return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-orange-50 font-['Quicksand']">
      <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-orange-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner rotate-3">🎨</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Agenda Aquarela</h1>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
          {[UserRole.GUARDIAN, UserRole.TEACHER, UserRole.MANAGER].map(role => (
            <button key={role} onClick={() => setLoginRole(role)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${loginRole === role ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {role === UserRole.GUARDIAN ? 'Família' : role === UserRole.TEACHER ? 'Professor' : 'Gestor'}
            </button>
          ))}
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input required type="email" placeholder="E-mail" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold text-black outline-none focus:ring-2 focus:ring-orange-200" />
          <input required type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold text-black outline-none focus:ring-2 focus:ring-orange-200" />
          <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm transform transition-transform hover:scale-[1.02]">ENTRAR</button>
        </form>
        {loginRole === UserRole.MANAGER && <button onClick={() => setViewState('SIGNUP')} className="w-full text-center mt-6 text-[10px] font-black text-gray-400 uppercase hover:text-orange-500">Nova Escola? Cadastre-se</button>}
      </div>
    </div>
  );

  if (viewState === 'SIGNUP') return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-orange-50">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-orange-100">
        <button onClick={() => setViewState('LOGIN')} className="text-gray-400 font-bold text-xs mb-6 uppercase">← Voltar</button>
        <h1 className="text-2xl font-black text-gray-900 text-center mb-8">Cadastro de Gestor</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <input required type="text" placeholder="Nome Completo" value={signupName} onChange={e => setSignupName(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold text-black outline-none focus:ring-2 focus:ring-orange-200" />
          <input required type="email" placeholder="E-mail Institucional" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold text-black outline-none focus:ring-2 focus:ring-orange-200" />
          <input required type="text" placeholder="Cargo/Função" value={signupFunction} onChange={e => setSignupFunction(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold text-black outline-none focus:ring-2 focus:ring-orange-200" />
          <input required type="password" placeholder="Defina sua Senha" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold text-black outline-none focus:ring-2 focus:ring-orange-200" />
          <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl uppercase tracking-widest text-sm">CADASTRAR ESCOLA</button>
        </form>
      </div>
    </div>
  );

  if (!currentUser) return null;

  return (
    <Layout user={currentUser} onLogout={() => { setViewState('LOGIN'); setCurrentUser(null); }}>
      {currentUser.role === UserRole.MANAGER && (
        <ManagerDashboard 
          classes={classes} students={students} users={users} posts={posts} lessonPlans={lessonPlans}
          messages={messages} chatConfig={chatConfig} events={events} menus={menus} currentUserId={currentUser.id}
          routines={routines} onSaveRoutine={handleSaveRoutine}
          onAddClass={onSaveClass} 
          onUpdateClassTeacher={async (classId, teacherId) => {
            const cls = classes.find(c => c.id === classId);
            if (cls) await onSaveClass(cls.name, teacherId, classId);
          }}
          onDeleteClass={async id => { await supabase.from('classes').delete().eq('id', id); fetchData(); }}
          onAddStudent={onSaveStudent}
          onDeleteStudent={async id => { await supabase.from('students').delete().eq('id', id); fetchData(); }}
          onAddUser={async (name, email, role, password) => {
            await onSaveUser({ 
              id: `u-${Date.now()}`, 
              name, 
              email: email.toLowerCase().trim(), 
              role, 
              password: password || '123' 
            });
          }}
          onDeleteUser={async id => { await supabase.from('users').delete().eq('id', id); fetchData(); }}
          onAddEvent={onAddEvent}
          onDeleteEvent={async id => { await supabase.from('events').delete().eq('id', id); fetchData(); }}
          onAddMenu={onAddMenu}
          onDeleteMenu={async id => { await supabase.from('menus').delete().eq('id', id); fetchData(); }}
          onCreatePost={async p => { await supabase.from('posts').insert([{ ...p, author_id: currentUser.id, author_name: currentUser.name, author_role: currentUser.role, likes: [] }]); fetchData(); }}
          onLikePost={async pid => { 
             const post = posts.find(p => p.id === pid);
             if (post) {
               const newLikes = post.likes.includes(currentUser.id) 
                 ? post.likes.filter(id => id !== currentUser.id)
                 : [...post.likes, currentUser.id];
               await supabase.from('posts').update({ likes: newLikes }).eq('id', pid);
               fetchData();
             }
          }}
          onSendMessage={async (c, r) => { await supabase.from('messages').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }}
          onUpdateChatConfig={setChatConfig}
          onApprovePlan={async (pid, feedback) => { 
            const plan = lessonPlans.find(p => p.id === pid);
            if (plan) {
               await onSaveLessonPlan({ ...plan, status: 'approved', managerFeedback: feedback });
            }
          }}
        />
      )}
      {currentUser.role === UserRole.TEACHER && (
        <TeacherDashboard 
          classes={classes.filter(c => c.teacherId === currentUser.id)} students={students} lessonPlans={lessonPlans.filter(p => p.teacherId === currentUser.id)} 
          posts={posts} messages={messages} chatConfig={chatConfig} users={users} currentUserId={currentUser.id} routines={routines}
          onSaveRoutine={handleSaveRoutine} 
          onSaveLessonPlan={onSaveLessonPlan}
          onCreatePost={async p => { await supabase.from('posts').insert([{ ...p, author_id: currentUser.id, author_name: currentUser.name, author_role: currentUser.role, likes: [] }]); fetchData(); }}
          onLikePost={async pid => {
             const post = posts.find(p => p.id === pid);
             if (post) {
               const newLikes = post.likes.includes(currentUser.id) 
                 ? post.likes.filter(id => id !== currentUser.id)
                 : [...post.likes, currentUser.id];
               await supabase.from('posts').update({ likes: newLikes }).eq('id', pid);
               fetchData();
             }
          }} 
          onSendMessage={async (c, r) => { await supabase.from('messages').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }}
        />
      )}
      {currentUser.role === UserRole.GUARDIAN && (
        <GuardianDashboard 
          students={students.filter(s => s.guardianIds.includes(currentUser.id))} routines={routines} posts={posts} messages={messages} 
          chatConfig={chatConfig} classes={classes} users={users} events={events} menus={menus} currentUserId={currentUser.id}
          onLikePost={async pid => {
             const post = posts.find(p => p.id === pid);
             if (post) {
               const newLikes = post.likes.includes(currentUser.id) 
                 ? post.likes.filter(id => id !== currentUser.id)
                 : [...post.likes, currentUser.id];
               await supabase.from('posts').update({ likes: newLikes }).eq('id', pid);
               fetchData();
             }
          }} 
          onSendMessage={async (c, r) => { await supabase.from('messages').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }} 
        />
      )}
    </Layout>
  );
};

export default App;
