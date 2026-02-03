
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
        fetchTable('turmas'), fetchTable('alunos'), fetchTable('diario_aluno'),
        fetchTable('planejamento_professor'), fetchTable('mural'), fetchTable('eventos'),
        fetchTable('cardapio'), fetchTable('mensagens'), fetchTable('usuarios')
      ]);

      // Mapeamento de nomes de colunas do DB para as Interfaces TS
      setClasses(dbClasses.map((c: any) => ({ ...c, teacherId: c.professor_id })));
      setStudents(dbStudents.map((s: any) => ({ ...s, classId: s.turma_id, guardianIds: [s.responsavel_id] })));
      setRoutines(dbRoutines.map((r: any) => ({ 
        ...r, 
        studentId: r.aluno_id, 
        authorId: r.aluno_id, // Exemplo, na prática viria de outro lugar
        attendance: r.dormiu === 'sim' ? 'present' : 'present' // Mapeamento simplificado
      })));
      setLessonPlans(dbPlans.map((p: any) => ({ 
        ...p, 
        teacherId: p.professor_id, 
        classId: p.turma_id, 
        lessonNumber: p.id.slice(0, 4), // Placeholder
        managerFeedback: p.manager_feedback,
        bnccCodes: ''
      })));
      setPosts(dbPosts.map((p: any) => ({ 
        ...p, 
        authorId: p.author_id, 
        authorRole: p.author_role as UserRole, 
        createdAt: p.created_at,
        authorName: p.author_name
      })).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setEvents(dbEvents);
      
      // Cardápio mensal agrupado (simplificado para SchoolMenu interface)
      const uniqueMenus = dbMenus.reduce((acc: any, curr: any) => {
        if (!acc[curr.data]) acc[curr.data] = { date: curr.data, id: curr.data };
        acc[curr.data][curr.refeicao] = curr.descricao;
        return acc;
      }, {});
      setMenus(Object.values(uniqueMenus));

      setMessages(dbMessages.map((m: any) => ({ ...m, senderId: m.sender_id, receiverId: m.receiver_id })));
      setUsers(dbUsers.map((u: any) => ({ ...u, role: u.tipo.toUpperCase() as UserRole })));
    } catch (error) {
      console.error("Erro na carga de dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let { data } = await supabase.from('usuarios').select('*').eq('email', loginEmail.toLowerCase().trim()).single();
    if (!data || data.password !== loginPassword) return alert("Credenciais inválidas.");
    const mappedUser = { ...data, role: data.tipo.toUpperCase() as UserRole };
    setCurrentUser(mappedUser);
    setViewState('DASHBOARD');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('usuarios').insert([{
      nome: signupName,
      email: signupEmail.toLowerCase().trim(),
      tipo: 'gestor',
      password: signupPassword
    }]);
    if (error) return alert("Erro ao criar gestor: " + error.message);
    setViewState('LOGIN');
    fetchData();
  };

  const onSaveUser = async (u: User) => {
    const payload = { 
      nome: u.name, 
      email: u.email, 
      tipo: u.role.toLowerCase(), 
      password: u.password 
    };
    await supabase.from('usuarios').upsert([payload]);
    fetchData();
  };

  const onSaveClass = async (name: string, teacherId: string, existingId?: string) => {
    // FIX: professor_id em vez de teacher_id
    const payload = { nome: name, professor_id: teacherId };
    if (existingId) {
      const { error } = await supabase.from('turmas').update(payload).eq('id', existingId);
      if (error) return alert("Erro ao salvar turma: " + error.message);
    } else {
      const { error } = await supabase.from('turmas').insert([payload]);
      if (error) return alert("Erro ao criar turma: " + error.message);
    }
    fetchData();
  };

  const onSaveStudent = async (name: string, classId: string, emailsStr: string, existingId?: string) => {
    const email = emailsStr.split(/[,;\n]/)[0]?.trim().toLowerCase();
    let respId = null;
    
    if (email) {
      const { data: existingUser } = await supabase.from('usuarios').select('*').eq('email', email).single();
      if (existingUser) {
        respId = existingUser.id;
      } else {
        const { data: newUser } = await supabase.from('usuarios').insert([{ 
          nome: `Resp. de ${name}`, 
          email, 
          tipo: 'responsavel', 
          password: '123' 
        }]).select().single();
        if (newUser) respId = newUser.id;
      }
    }
    
    const payload = { nome: name, turma_id: classId, responsavel_id: respId };
    if (existingId) {
      await supabase.from('alunos').update(payload).eq('id', existingId);
    } else {
      await supabase.from('alunos').insert([payload]);
    }
    fetchData();
  };

  const handleSaveRoutine = async (nr: Omit<RoutineEntry, 'id'>) => {
    const dbPayload = {
      aluno_id: nr.studentId, 
      data: nr.date,
      colacao: 'comeu', // Mock mapping
      almoco: 'comeu',
      lanche: 'comeu',
      janta: 'comeu',
      humor: nr.mood,
      observacoes_professor: nr.activities + " " + nr.observations
    };
    
    const { error } = await supabase.from('diario_aluno').upsert([dbPayload], { onConflict: 'aluno_id, data' });
    if (error) return alert("Erro ao salvar rotina: " + error.message);
    fetchData();
  };

  const onAddEvent = async (ev: Partial<SchoolEvent>) => {
    const { error } = await supabase.from('eventos').upsert([{ 
      title: ev.title, 
      date: ev.date, 
      description: ev.description, 
      location: ev.location 
    }]);
    if (error) return alert("Erro ao salvar evento: " + error.message);
    fetchData();
  };

  const onAddMenu = async (m: Partial<SchoolMenu>) => {
    const refeicoes = [
      { data: m.date, refeicao: 'colacao', descricao: m.colacao },
      { data: m.date, refeicao: 'almoco', descricao: m.almoco },
      { data: m.date, refeicao: 'lanche', descricao: m.lanche },
      { data: m.date, refeicao: 'janta', descricao: m.janta },
    ].filter(r => r.descricao);

    const { error } = await supabase.from('cardapio').upsert(refeicoes);
    if (error) return alert("Erro ao salvar cardápio: " + error.message);
    fetchData();
  };

  const onSaveLessonPlan = async (pd: any) => {
    const dbPayload = {
      professor_id: pd.teacherId || currentUser?.id,
      turma_id: pd.classId,
      data: pd.date,
      objetivo_do_dia: pd.objective,
      conteudo_trabalhado: pd.content,
      avaliacao_do_dia: pd.assessment,
      status: pd.status || 'pending',
      manager_feedback: pd.managerFeedback
    };
    const { error } = await supabase.from('planejamento_professor').upsert([dbPayload]);
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
          onDeleteClass={async id => { await supabase.from('turmas').delete().eq('id', id); fetchData(); }}
          onAddStudent={onSaveStudent}
          onDeleteStudent={async id => { await supabase.from('alunos').delete().eq('id', id); fetchData(); }}
          onAddUser={async (name, email, role, password) => {
            await onSaveUser({ 
              id: `u-${Date.now()}`, 
              name, 
              email: email.toLowerCase().trim(), 
              role, 
              password: password || '123' 
            });
          }}
          onDeleteUser={async id => { await supabase.from('usuarios').delete().eq('id', id); fetchData(); }}
          onAddEvent={onAddEvent}
          onDeleteEvent={async id => { await supabase.from('eventos').delete().eq('id', id); fetchData(); }}
          onAddMenu={onAddMenu}
          onDeleteMenu={async id => { await supabase.from('cardapio').delete().eq('data', id); fetchData(); }}
          onCreatePost={async p => { await supabase.from('mural').insert([{ ...p, author_id: currentUser.id, author_name: currentUser.name, author_role: currentUser.role, likes: [] }]); fetchData(); }}
          onLikePost={async pid => { 
             const post = posts.find(p => p.id === pid);
             if (post) {
               const newLikes = post.likes.includes(currentUser.id) 
                 ? post.likes.filter(id => id !== currentUser.id)
                 : [...post.likes, currentUser.id];
               await supabase.from('mural').update({ likes: newLikes }).eq('id', pid);
               fetchData();
             }
          }}
          onSendMessage={async (c, r) => { await supabase.from('mensagens').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }}
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
          onCreatePost={async p => { await supabase.from('mural').insert([{ ...p, author_id: currentUser.id, author_name: currentUser.name, author_role: currentUser.role, likes: [] }]); fetchData(); }}
          onLikePost={async pid => {
             const post = posts.find(p => p.id === pid);
             if (post) {
               const newLikes = post.likes.includes(currentUser.id) 
                 ? post.likes.filter(id => id !== currentUser.id)
                 : [...post.likes, currentUser.id];
               await supabase.from('mural').update({ likes: newLikes }).eq('id', pid);
               fetchData();
             }
          }} 
          onSendMessage={async (c, r) => { await supabase.from('mensagens').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }}
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
               await supabase.from('mural').update({ likes: newLikes }).eq('id', pid);
               fetchData();
             }
          }} 
          onSendMessage={async (c, r) => { await supabase.from('mensagens').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }} 
        />
      )}
    </Layout>
  );
};

export default App;
