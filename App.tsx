
import React, { useState, useEffect } from 'react';
import { User, UserRole, Class, Student, RoutineEntry, ViewState, LessonPlan, FeedPost, ChatMessage, ChatConfig, SchoolEvent, SchoolMenu } from './types';
import { INITIAL_USERS, INITIAL_CLASSES, INITIAL_STUDENTS } from './constants';
import Layout from './components/Layout';
import ManagerDashboard from './components/ManagerDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import GuardianDashboard from './components/GuardianDashboard';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('LOGIN');
  const [loginRole, setLoginRole] = useState<UserRole>(UserRole.GUARDIAN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
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

  useEffect(() => {
    const sR = localStorage.getItem('a_routines');
    const sU = localStorage.getItem('a_users');
    const sC = localStorage.getItem('a_classes');
    const sS = localStorage.getItem('a_students');
    const sP = localStorage.getItem('a_posts');
    const sE = localStorage.getItem('a_events');
    const sM = localStorage.getItem('a_menus');
    const sMsg = localStorage.getItem('a_messages');

    if (sR) setRoutines(JSON.parse(sR));
    if (sU) setUsers(JSON.parse(sU));
    if (sC) setClasses(JSON.parse(sC));
    if (sS) setStudents(JSON.parse(sS));
    if (sP) setPosts(JSON.parse(sP));
    if (sE) setEvents(JSON.parse(sE));
    if (sM) setMenus(JSON.parse(sM));
    if (sMsg) setMessages(JSON.parse(sMsg));
  }, []);

  useEffect(() => { localStorage.setItem('a_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('a_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('a_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('a_routines', JSON.stringify(routines)); }, [routines]);
  useEffect(() => { localStorage.setItem('a_posts', JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem('a_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('a_menus', JSON.stringify(menus)); }, [menus]);
  useEffect(() => { localStorage.setItem('a_messages', JSON.stringify(messages)); }, [messages]);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.email.toLowerCase() === signupEmail.toLowerCase())) return alert("E-mail já cadastrado.");
    const newUser: User = { id: `u-${Date.now()}`, name: signupName, email: signupEmail, function: signupFunction, password: signupPassword, role: UserRole.MANAGER };
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

  const handleAddStudent = (studentName: string, classId: string, guardianEmailsStr: string) => {
    const emails = guardianEmailsStr.split(/[,;\n]/).map(e => e.trim().toLowerCase()).filter(e => e !== "");
    const gIds: string[] = [];
    const newU: User[] = [];
    emails.forEach(email => {
      let ex = users.find(u => u.email.toLowerCase() === email);
      if (ex) { gIds.push(ex.id); } 
      else {
        const id = `u-${Math.random().toString(36).substr(2, 9)}`;
        newU.push({ id, name: `Resp. de ${studentName}`, email, role: UserRole.GUARDIAN });
        gIds.push(id);
      }
    });
    if (newU.length > 0) setUsers(prev => [...prev, ...newU]);
    setStudents(prev => [...prev, { id: `s-${Date.now()}`, name: studentName, classId, guardianIds: gIds }]);
  };

  const handleSaveRoutine = (nr: Omit<RoutineEntry, 'id'>) => {
    setRoutines(prev => {
      const existingIndex = prev.findIndex(r => r.studentId === nr.studentId && r.date === nr.date);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...prev[existingIndex], ...nr };
        return updated;
      }
      return [...prev, { ...nr, id: `r-${Date.now()}` }];
    });
  };

  if (viewState === 'SIGNUP') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-aquarela font-['Quicksand']">
        <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
          <button onClick={() => setViewState('LOGIN')} className="text-gray-900 font-bold text-xs mb-6 block">← VOLTAR</button>
          <h1 className="text-2xl font-black text-gray-900 text-center mb-8">Cadastro de Gestor</h1>
          <form onSubmit={handleSignup} className="space-y-4">
            <input required type="text" placeholder="Seu Nome" value={signupName} onChange={e => setSignupName(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-300 font-bold text-black" />
            <input required type="email" placeholder="E-mail" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-300 font-bold text-black" />
            <input required type="text" placeholder="Função" value={signupFunction} onChange={e => setSignupFunction(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-300 font-bold text-black" />
            <input required type="password" placeholder="Sua Senha" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-300 font-bold text-black" />
            <button type="submit" className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl">CADASTRAR</button>
          </form>
        </div>
      </div>
    );
  }

  if (viewState === 'LOGIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-aquarela font-['Quicksand']">
        <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-inner rotate-3">🎨</div>
            <h1 className="text-3xl font-black text-gray-900">Agenda Aquarela</h1>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
            {[UserRole.GUARDIAN, UserRole.TEACHER, UserRole.MANAGER].map(role => (
              <button key={role} onClick={() => setLoginRole(role)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${loginRole === role ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                {role === UserRole.GUARDIAN ? 'Família' : role === UserRole.TEACHER ? 'Professor' : 'Gestor'}
              </button>
            ))}
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input required type="email" placeholder="E-mail" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-300 font-bold text-black" />
            {loginRole === UserRole.MANAGER && <input required type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-300 font-bold text-black" />}
            <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm">ENTRAR</button>
          </form>
          {loginRole === UserRole.MANAGER && <button onClick={() => setViewState('SIGNUP')} className="w-full text-center mt-6 text-xs font-black text-gray-900 uppercase tracking-widest hover:underline">Novo Gestor?</button>}
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
          onAddClass={(n, tid) => setClasses(p => [...p, {id: `c-${Date.now()}`, name: n, teacherId: tid}])} 
          onAddStudent={handleAddStudent} onAddUser={(n, e, r, p) => setUsers(prev => [...prev, {id: `u-${Date.now()}`, name: n, email: e, role: r, password: p}])}
          onUpdateClassTeacher={(cid, tid) => setClasses(p => p.map(c => c.id === cid ? {...c, teacherId: tid} : c))}
          onApprovePlan={(pid) => setLessonPlans(p => p.map(x => x.id === pid ? {...x, status: 'approved'} : x))}
          onCreatePost={(p) => setPosts(prev => [{...p, id: `post-${Date.now()}`, authorId: currentUser.id, authorName: currentUser.name, authorRole: currentUser.role, likes: [], createdAt: new Date().toISOString()}, ...prev])} 
          onLikePost={(pid) => setPosts(p => p.map(x => x.id === pid ? {...x, likes: x.likes.includes(currentUser.id) ? x.likes.filter(id => id !== currentUser.id) : [...x.likes, currentUser.id]} : x))} 
          onSendMessage={(c, r) => setMessages(p => [...p, {id: `m-${Date.now()}`, senderId: currentUser.id, receiverId: r, content: c, timestamp: new Date().toISOString()}])}
          onUpdateChatConfig={setChatConfig} onDeleteClass={id => setClasses(p => p.filter(c => c.id !== id))}
          onDeleteStudent={id => setStudents(p => p.filter(s => s.id !== id))} onDeleteUser={id => setUsers(p => p.filter(u => u.id !== id))}
          onAddEvent={e => setEvents(p => [...p, {...e, id: `e-${Date.now()}`}])} onDeleteEvent={id => setEvents(p => p.filter(e => e.id !== id))}
          onAddMenu={m => setMenus(p => [...p.filter(x => x.date !== m.date), {...m, id: `m-${Date.now()}`}])}
        />
      )}
      {currentUser.role === UserRole.TEACHER && (
        <TeacherDashboard 
          classes={classes.filter(c => c.teacherId === currentUser.id)} students={students} lessonPlans={lessonPlans.filter(p => p.teacherId === currentUser.id)} 
          posts={posts} messages={messages} chatConfig={chatConfig} users={users} currentUserId={currentUser.id} routines={routines}
          onSaveRoutine={handleSaveRoutine} 
          onSaveLessonPlan={pd => setLessonPlans(p => [...p, {...pd, id: `p-${Date.now()}`, teacherId: currentUser.id, status: 'pending', createdAt: new Date().toISOString()}])}
          onCreatePost={p => setPosts(prev => [{...p, id: `post-${Date.now()}`, authorId: currentUser.id, authorName: currentUser.name, authorRole: currentUser.role, likes: [], createdAt: new Date().toISOString()}, ...prev])} 
          onLikePost={pid => setPosts(p => p.map(x => x.id === pid ? {...x, likes: x.likes.includes(currentUser.id) ? x.likes.filter(id => id !== currentUser.id) : [...x.likes, currentUser.id]} : x))} 
          onSendMessage={(c, r) => setMessages(p => [...p, {id: `m-${Date.now()}`, senderId: currentUser.id, receiverId: r, content: c, timestamp: new Date().toISOString()}])}
        />
      )}
      {currentUser.role === UserRole.GUARDIAN && (
        <GuardianDashboard 
          students={students.filter(s => s.guardianIds.includes(currentUser.id))} routines={routines} posts={posts} messages={messages} 
          chatConfig={chatConfig} classes={classes} users={users} events={events} menus={menus} currentUserId={currentUser.id}
          onLikePost={pid => setPosts(p => p.map(x => x.id === pid ? {...x, likes: x.likes.includes(currentUser.id) ? x.likes.filter(id => id !== currentUser.id) : [...x.likes, currentUser.id]} : x))} 
          onSendMessage={(c, r) => setMessages(p => [...p, {id: `m-${Date.now()}`, senderId: currentUser.id, receiverId: r, content: c, timestamp: new Date().toISOString()}])} 
        />
      )}
    </Layout>
  );
};

export default App;
