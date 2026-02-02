
import React, { useState, useEffect } from 'react';
import { User, UserRole, Class, Student, RoutineEntry, ViewState, LessonPlan, FeedPost, ChatMessage, ChatConfig, SchoolEvent, SchoolMenu } from './types';
import { INITIAL_USERS, INITIAL_CLASSES, INITIAL_STUDENTS } from './constants';
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
  
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [classes, setClasses] = useState<Class[]>(INITIAL_CLASSES);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [routines, setRoutines] = useState<RoutineEntry[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatConfig, setChatConfig] = useState<ChatConfig>({ startHour: 8, endHour: 18, isEnabled: true });
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [menus, setMenus] = useState<SchoolMenu[]>([]);

  // Form states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupFunction, setSignupFunction] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Busca inicial de dados do Supabase
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: dbUsers },
        { data: dbClasses },
        { data: dbStudents },
        { data: dbRoutines },
        { data: dbPlans },
        { data: dbPosts },
        { data: dbEvents },
        { data: dbMenus },
        { data: dbMessages }
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('students').select('*'),
        supabase.from('routines').select('*'),
        supabase.from('lesson_plans').select('*'),
        supabase.from('posts').select('*').order('createdAt', { ascending: false }),
        supabase.from('events').select('*'),
        supabase.from('menus').select('*'),
        supabase.from('messages').select('*')
      ]);

      if (dbUsers) setUsers(dbUsers);
      if (dbClasses) setClasses(dbClasses);
      if (dbStudents) setStudents(dbStudents);
      if (dbRoutines) setRoutines(dbRoutines);
      // Fix: Cast dbPlans to LessonPlan[] to satisfy status union type
      if (dbPlans) setLessonPlans(dbPlans as LessonPlan[]);
      if (dbPosts) setPosts(dbPosts);
      if (dbEvents) setEvents(dbEvents);
      if (dbMenus) setMenus(dbMenus);
      if (dbMessages) setMessages(dbMessages);
    } catch (error) {
      console.error("Erro ao carregar dados do Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.email.toLowerCase() === signupEmail.toLowerCase())) return alert("E-mail já cadastrado.");
    
    const newUser: User = { 
      id: `u-${Date.now()}`, 
      name: signupName, 
      email: signupEmail, 
      function: signupFunction, 
      password: signupPassword, 
      role: UserRole.MANAGER 
    };

    const { error } = await supabase.from('users').insert([newUser]);
    if (error) return alert("Erro ao cadastrar no banco de dados.");

    setUsers(prev => [...prev, newUser]);
    alert("Escola cadastrada com sucesso!");
    setViewState('LOGIN');
    setLoginRole(UserRole.MANAGER);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase().trim() === loginEmail.toLowerCase().trim() && u.role === loginRole);
    if (!user) return alert(`Dados não encontrados para ${loginRole}.`);
    if (loginRole === UserRole.MANAGER && user.password !== loginPassword) return alert("Senha incorreta.");
    setCurrentUser(user);
    setViewState('DASHBOARD');
  };

  const handleLogout = () => {
    setViewState('LOGIN');
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleAddStudent = async (studentName: string, classId: string, guardianEmailsStr: string) => {
    const emails = guardianEmailsStr.split(/[,;\n]/).map(e => e.trim().toLowerCase()).filter(e => e !== "");
    const gIds: string[] = [];
    const newU: User[] = [];
    
    emails.forEach(email => {
      let ex = users.find(u => u.email.toLowerCase() === email);
      if (ex) { 
        gIds.push(ex.id); 
      } else {
        const id = `u-${Math.random().toString(36).substr(2, 9)}`;
        newU.push({ id, name: `Resp. de ${studentName}`, email, role: UserRole.GUARDIAN });
        gIds.push(id);
      }
    });

    if (newU.length > 0) {
      await supabase.from('users').insert(newU);
      setUsers(prev => [...prev, ...newU]);
    }

    const newStudent: Student = { id: `s-${Date.now()}`, name: studentName, classId, guardianIds: gIds };
    await supabase.from('students').insert([newStudent]);
    setStudents(prev => [...prev, newStudent]);
  };

  const handleSaveRoutine = async (nr: Omit<RoutineEntry, 'id'>) => {
    const existing = routines.find(r => r.studentId === nr.studentId && r.date === nr.date);
    const id = existing ? existing.id : `r-${Date.now()}`;
    const entry = { ...nr, id };

    const { error } = await supabase.from('routines').upsert([entry]);
    if (error) return alert("Erro ao salvar rotina.");

    setRoutines(prev => {
      const idx = prev.findIndex(r => r.studentId === nr.studentId && r.date === nr.date);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = entry;
        return updated;
      }
      return [...prev, entry];
    });
  };

  const handleAddClass = async (name: string, teacherId: string) => {
    const newClass: Class = { id: `c-${Date.now()}`, name, teacherId };
    await supabase.from('classes').insert([newClass]);
    setClasses(prev => [...prev, newClass]);
  };

  const handleDeleteClass = async (id: string) => {
    await supabase.from('classes').delete().eq('id', id);
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteStudent = async (id: string) => {
    await supabase.from('students').delete().eq('id', id);
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleAddEvent = async (e: Omit<SchoolEvent, 'id'>) => {
    const newEvent = { ...e, id: `e-${Date.now()}` };
    await supabase.from('events').insert([newEvent]);
    setEvents(prev => [...prev, newEvent]);
  };

  const handleDeleteEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 font-['Quicksand']">
        <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-orange-600 font-black uppercase tracking-widest text-xs">Carregando Aquarela...</p>
      </div>
    );
  }

  if (viewState === 'SIGNUP') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-orange-50 font-['Quicksand']">
        <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-orange-100">
          <button onClick={() => setViewState('LOGIN')} className="text-gray-900 font-bold text-xs mb-6 block">← VOLTAR</button>
          <h1 className="text-2xl font-black text-gray-900 text-center mb-8">Cadastro de Gestor</h1>
          <form onSubmit={handleSignup} className="space-y-4">
            <input required type="text" placeholder="Seu Nome" value={signupName} onChange={e => setSignupName(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-300 font-bold text-black outline-none focus:ring-2 focus:ring-orange-200" />
            <input required type="email" placeholder="E-mail" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-300 font-bold text-black outline-none focus:ring-2 focus:ring-orange-200" />
            <input required type="text" placeholder="Função" value={signupFunction} onChange={e => setSignupFunction(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-300 font-bold text-black outline-none focus:ring-2 focus:ring-orange-200" />
            <input required type="password" placeholder="Sua Senha" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-300 font-bold text-black outline-none focus:ring-2 focus:ring-orange-200" />
            <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl hover:scale-[1.02] transition-transform">CADASTRAR</button>
          </form>
        </div>
      </div>
    );
  }

  if (viewState === 'LOGIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-orange-50 font-['Quicksand']">
        <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-orange-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-orange-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner rotate-3">🎨</div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Agenda Aquarela</h1>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-1">Onde o aprendizado ganha cores</p>
          </div>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
            {[UserRole.GUARDIAN, UserRole.TEACHER, UserRole.MANAGER].map(role => (
              <button key={role} onClick={() => setLoginRole(role)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${loginRole === role ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                {role === UserRole.GUARDIAN ? 'Família' : role === UserRole.TEACHER ? 'Professor' : 'Gestor'}
              </button>
            ))}
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input required type="email" placeholder="E-mail" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-200 font-bold text-black" />
            {loginRole === UserRole.MANAGER && <input required type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-orange-200 font-bold text-black" />}
            <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm transform transition-transform hover:scale-[1.02] active:scale-[0.98]">ENTRAR</button>
          </form>
          {loginRole === UserRole.MANAGER && <button onClick={() => setViewState('SIGNUP')} className="w-full text-center mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-500 transition-colors">Nova Escola? Cadastre o Gestor</button>}
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      {currentUser.role === UserRole.MANAGER && (
        <ManagerDashboard 
          classes={classes} students={students} users={users} posts={posts} lessonPlans={lessonPlans}
          messages={messages} chatConfig={chatConfig} events={events} menus={menus} currentUserId={currentUser.id}
          routines={routines} onSaveRoutine={handleSaveRoutine}
          onAddClass={handleAddClass} 
          onAddStudent={handleAddStudent} 
          onAddUser={async (n, e, r, p) => {
            const newUser = {id: `u-${Date.now()}`, name: n, email: e, role: r, password: p};
            await supabase.from('users').insert([newUser]);
            setUsers(prev => [...prev, newUser]);
          }}
          onUpdateClassTeacher={async (cid, tid) => {
            await supabase.from('classes').update({ teacherId: tid }).eq('id', cid);
            setClasses(p => p.map(c => c.id === cid ? {...c, teacherId: tid} : c));
          }}
          onApprovePlan={async (pid) => {
            await supabase.from('lesson_plans').update({ status: 'approved' }).eq('id', pid);
            // Fix: Explicitly cast the mapped object to LessonPlan to ensure 'status' literal compatibility
            setLessonPlans(p => p.map(x => x.id === pid ? ({ ...x, status: 'approved' } as LessonPlan) : x));
          }}
          onCreatePost={async (p) => {
            const newPost = {...p, id: `post-${Date.now()}`, authorId: currentUser.id, authorName: currentUser.name, authorRole: currentUser.role, likes: [], createdAt: new Date().toISOString()};
            await supabase.from('posts').insert([newPost]);
            setPosts(prev => [newPost, ...prev]);
          }} 
          onLikePost={async (pid) => {
            const post = posts.find(x => x.id === pid);
            if (!post) return;
            const newLikes = post.likes.includes(currentUser.id) ? post.likes.filter(id => id !== currentUser.id) : [...post.likes, currentUser.id];
            await supabase.from('posts').update({ likes: newLikes }).eq('id', pid);
            setPosts(p => p.map(x => x.id === pid ? {...x, likes: newLikes} : x));
          }} 
          onSendMessage={async (c, r) => {
            const newMsg = {id: `m-${Date.now()}`, senderId: currentUser.id, receiverId: r, content: c, timestamp: new Date().toISOString()};
            await supabase.from('messages').insert([newMsg]);
            setMessages(p => [...p, newMsg]);
          }}
          onUpdateChatConfig={setChatConfig} 
          onDeleteClass={handleDeleteClass}
          onDeleteStudent={handleDeleteStudent} 
          onDeleteUser={async id => {
            await supabase.from('users').delete().eq('id', id);
            setUsers(p => p.filter(u => u.id !== id));
          }}
          onAddEvent={handleAddEvent} 
          onDeleteEvent={handleDeleteEvent}
          onAddMenu={async m => {
            const newMenu = {...m, id: `m-${Date.now()}`};
            await supabase.from('menus').upsert([newMenu]);
            setMenus(p => [...p.filter(x => x.date !== m.date), newMenu]);
          }}
        />
      )}
      {currentUser.role === UserRole.TEACHER && (
        <TeacherDashboard 
          classes={classes.filter(c => c.teacherId === currentUser.id)} students={students} lessonPlans={lessonPlans.filter(p => p.teacherId === currentUser.id)} 
          posts={posts} messages={messages} chatConfig={chatConfig} users={users} currentUserId={currentUser.id} routines={routines}
          onSaveRoutine={handleSaveRoutine} 
          onSaveLessonPlan={async pd => {
            // Fix: Explicitly type newPlan as LessonPlan to avoid 'status' widening to string
            const newPlan: LessonPlan = { ...pd, id: `p-${Date.now()}`, teacherId: currentUser.id, status: 'pending', createdAt: new Date().toISOString() };
            await supabase.from('lesson_plans').insert([newPlan]);
            setLessonPlans(p => [...p, newPlan]);
          }}
          onCreatePost={async p => {
            const newPost = {...p, id: `post-${Date.now()}`, authorId: currentUser.id, authorName: currentUser.name, authorRole: currentUser.role, likes: [], createdAt: new Date().toISOString()};
            await supabase.from('posts').insert([newPost]);
            setPosts(prev => [newPost, ...prev]);
          }} 
          onLikePost={async pid => {
            const post = posts.find(x => x.id === pid);
            if (!post) return;
            const newLikes = post.likes.includes(currentUser.id) ? post.likes.filter(id => id !== currentUser.id) : [...post.likes, currentUser.id];
            await supabase.from('posts').update({ likes: newLikes }).eq('id', pid);
            setPosts(p => p.map(x => x.id === pid ? {...x, likes: newLikes} : x));
          }} 
          onSendMessage={async (c, r) => {
            const newMsg = {id: `m-${Date.now()}`, senderId: currentUser.id, receiverId: r, content: c, timestamp: new Date().toISOString()};
            await supabase.from('messages').insert([newMsg]);
            setMessages(p => [...p, newMsg]);
          }}
        />
      )}
      {currentUser.role === UserRole.GUARDIAN && (
        <GuardianDashboard 
          students={students.filter(s => s.guardianIds.includes(currentUser.id))} routines={routines} posts={posts} messages={messages} 
          chatConfig={chatConfig} classes={classes} users={users} events={events} menus={menus} currentUserId={currentUser.id}
          onLikePost={async pid => {
            const post = posts.find(x => x.id === pid);
            if (!post) return;
            const newLikes = post.likes.includes(currentUser.id) ? post.likes.filter(id => id !== currentUser.id) : [...post.likes, currentUser.id];
            await supabase.from('posts').update({ likes: newLikes }).eq('id', pid);
            setPosts(p => p.map(x => x.id === pid ? {...x, likes: newLikes} : x));
          }} 
          onSendMessage={async (c, r) => {
            const newMsg = {id: `m-${Date.now()}`, senderId: currentUser.id, receiverId: r, content: c, timestamp: new Date().toISOString()};
            await supabase.from('messages').insert([newMsg]);
            setMessages(p => [...p, newMsg]);
          }} 
        />
      )}
    </Layout>
  );
};

export default App;
