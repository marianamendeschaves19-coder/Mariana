
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

  const mapDbRoleToUserRole = (dbRole: string): UserRole => {
    const role = dbRole.toLowerCase();
    if (role === 'gestor') return UserRole.MANAGER;
    if (role === 'professor') return UserRole.TEACHER;
    return UserRole.GUARDIAN;
  };

  const mapUserRoleToDbRole = (role: UserRole): string => {
    if (role === UserRole.MANAGER) return 'gestor';
    if (role === UserRole.TEACHER) return 'professor';
    return 'responsavel';
  };

  const fetchData = async () => {
    try {
      const { data: dbUsers, error: errU } = await supabase.from('usuarios').select('*');
      const { data: dbClasses, error: errC } = await supabase.from('turmas').select('*');
      const { data: dbStudents, error: errS } = await supabase.from('alunos').select('*');
      
      if (errU) console.error("Erro usuarios:", errU);
      
      setUsers((dbUsers || []).map((u: any) => ({
        id: u.id,
        name: u.nome,
        email: u.email,
        role: mapDbRoleToUserRole(u.tipo)
      })));

      setClasses((dbClasses || []).map((c: any) => ({
        id: c.id,
        name: c.nome,
        teacherId: c.professor_id
      })));

      setStudents((dbStudents || []).map((s: any) => ({
        id: s.id,
        name: s.nome,
        classId: s.turma_id,
        guardianIds: s.responsavel_id ? [s.responsavel_id] : []
      })));

      // Fetch secundários (sem travar se um falhar)
      const { data: dbRoutines } = await supabase.from('diario_aluno').select('*');
      const { data: dbPlans } = await supabase.from('planejamento_professor').select('*');
      const { data: dbPosts } = await supabase.from('mural').select('*');
      const { data: dbEvents } = await supabase.from('eventos').select('*');
      const { data: dbMenus } = await supabase.from('cardapio').select('*');
      const { data: dbMessages } = await supabase.from('mensagens').select('*');

      setRoutines((dbRoutines || []).map((r: any) => ({
        id: r.id, studentId: r.aluno_id, date: r.data, mood: r.humor || 'happy', observations: r.observacoes_professor || ''
      } as any)));

      setLessonPlans((dbPlans || []).map((p: any) => ({
        id: p.id, teacherId: p.professor_id, classId: p.turma_id, date: p.data, status: p.status
      } as any)));

      setPosts((dbPosts || []).map((p: any) => ({
        id: p.id, authorId: p.author_id, authorName: p.author_name, authorRole: mapDbRoleToUserRole(p.author_role || 'professor'), content: p.content, likes: p.likes || [], createdAt: p.created_at
      } as any)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      setEvents((dbEvents || []));
      setMessages((dbMessages || []).map((m: any) => ({ id: m.id, senderId: m.sender_id, receiverId: m.receiver_id, content: m.content, timestamp: m.timestamp })));

      const uniqueMenus = (dbMenus || []).reduce((acc: any, curr: any) => {
        if (!acc[curr.data]) acc[curr.data] = { date: curr.data, id: curr.data };
        acc[curr.data][curr.refeicao] = curr.descricao;
        return acc;
      }, {});
      setMenus(Object.values(uniqueMenus));

    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.toLowerCase().trim();
    const tipo = mapUserRoleToDbRole(loginRole);

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('tipo', tipo)
        .maybeSingle();

      if (error) {
        if (error.message.includes("schema cache")) {
          return alert("Erro de cache no servidor. Por favor, execute o script SQL de reparo no editor do Supabase.");
        }
        return alert("Erro no login: " + error.message);
      }

      if (!data) {
        return alert("Usuário não encontrado para este perfil.");
      }

      if (data.password !== loginPassword) {
        return alert("Senha incorreta.");
      }

      setCurrentUser({
        id: data.id,
        name: data.nome,
        email: data.email,
        role: mapDbRoleToUserRole(data.tipo)
      });
      setViewState('DASHBOARD');
    } catch (err: any) {
      alert("Falha técnica ao tentar logar.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('usuarios').insert([{
        nome: signupName,
        email: signupEmail.toLowerCase().trim(),
        tipo: 'gestor',
        password: signupPassword
      }]);

      if (error) {
        if (error.message.includes("password")) {
          return alert("Erro de esquema: A coluna 'password' não foi encontrada. Execute o script de reparo SQL.");
        }
        return alert("Erro ao criar gestor: " + error.message);
      }

      alert("Gestor cadastrado com sucesso!");
      setViewState('LOGIN');
      fetchData();
    } catch (err) {
      alert("Ocorreu um erro inesperado no cadastro.");
    }
  };

  const onSaveUser = async (u: User) => {
    const payload: any = {
      nome: u.name,
      email: u.email.toLowerCase().trim(),
      tipo: mapUserRoleToDbRole(u.role),
      password: u.password || '123'
    };
    if (u.id && u.id.length > 5) payload.id = u.id;
    const { error } = await supabase.from('usuarios').upsert([payload]);
    if (error) alert("Erro ao salvar usuário: " + error.message);
    fetchData();
  };

  const onSaveClass = async (name: string, teacherId: string, existingId?: string) => {
    const payload = { nome: name, professor_id: teacherId };
    const { error } = existingId 
      ? await supabase.from('turmas').update(payload).eq('id', existingId)
      : await supabase.from('turmas').insert([payload]);
    if (error) alert("Erro ao salvar turma: " + error.message);
    fetchData();
  };

  const onSaveStudent = async (name: string, classId: string, emailsStr: string, existingId?: string) => {
    const email = emailsStr.split(/[,;\n]/)[0]?.trim().toLowerCase();
    let respId = null;

    if (email) {
      const { data: existingUser } = await supabase.from('usuarios').select('*').eq('email', email).maybeSingle();
      if (existingUser) {
        respId = existingUser.id;
      } else {
        const { data: newUser } = await supabase.from('usuarios').insert([{
          nome: `Resp. de ${name}`,
          email,
          tipo: 'responsavel',
          password: '123'
        }]).select().maybeSingle();
        if (newUser) respId = newUser.id;
      }
    }

    const payload = { nome: name, turma_id: classId, responsavel_id: respId };
    const { error } = existingId 
      ? await supabase.from('alunos').update(payload).eq('id', existingId)
      : await supabase.from('alunos').insert([payload]);
    if (error) alert("Erro ao salvar aluno: " + error.message);
    fetchData();
  };

  const handleSaveRoutine = async (nr: Omit<RoutineEntry, 'id'>) => {
    const dbPayload = {
      aluno_id: nr.studentId,
      data: nr.date,
      humor: nr.mood,
      observacoes_professor: (nr.activities + " " + nr.observations).trim()
    };
    const { error } = await supabase.from('diario_aluno').upsert([dbPayload], { onConflict: 'aluno_id, data' });
    if (error) alert("Erro ao salvar rotina: " + error.message);
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
            await onSaveUser({ id: '', name, email, role, password });
          }}
          onDeleteUser={async id => { await supabase.from('usuarios').delete().eq('id', id); fetchData(); }}
          onAddEvent={async ev => { await supabase.from('eventos').insert([ev]); fetchData(); }}
          onDeleteEvent={async id => { await supabase.from('eventos').delete().eq('id', id); fetchData(); }}
          onAddMenu={async m => { 
            const payload = [
              { data: m.date, refeicao: 'almoco', descricao: m.almoco },
              { data: m.date, refeicao: 'lanche', descricao: m.lanche }
            ].filter(r => r.descricao);
            await supabase.from('cardapio').upsert(payload); fetchData(); 
          }}
          onDeleteMenu={async id => { await supabase.from('cardapio').delete().eq('data', id); fetchData(); }}
          onCreatePost={async p => { await supabase.from('mural').insert([{ ...p, author_id: currentUser.id, author_name: currentUser.name, author_role: 'gestor' }]); fetchData(); }}
          onLikePost={async pid => { fetchData(); }}
          onSendMessage={async (c, r) => { await supabase.from('mensagens').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }}
          onUpdateChatConfig={setChatConfig}
          onApprovePlan={async (pid, feedback) => { 
            await supabase.from('planejamento_professor').update({ status: 'approved', manager_feedback: feedback }).eq('id', pid);
            fetchData();
          }}
        />
      )}
      {currentUser.role === UserRole.TEACHER && (
        <TeacherDashboard 
          classes={classes.filter(c => c.teacherId === currentUser.id)} students={students} lessonPlans={lessonPlans.filter(p => p.teacherId === currentUser.id)} 
          posts={posts} messages={messages} chatConfig={chatConfig} users={users} currentUserId={currentUser.id} routines={routines}
          onSaveRoutine={handleSaveRoutine} 
          onSaveLessonPlan={async pd => { await supabase.from('planejamento_professor').upsert([{ professor_id: currentUser.id, turma_id: pd.classId, data: pd.date, conteudo_trabalhado: pd.content }]); fetchData(); }}
          onCreatePost={async p => { await supabase.from('mural').insert([{ ...p, author_id: currentUser.id, author_name: currentUser.name, author_role: 'professor' }]); fetchData(); }}
          onLikePost={async pid => { fetchData(); }} 
          onSendMessage={async (c, r) => { await supabase.from('mensagens').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }}
        />
      )}
      {currentUser.role === UserRole.GUARDIAN && (
        <GuardianDashboard 
          students={students.filter(s => s.guardianIds.includes(currentUser.id))} routines={routines} posts={posts} messages={messages} 
          chatConfig={chatConfig} classes={classes} users={users} events={events} menus={menus} currentUserId={currentUser.id}
          onLikePost={async pid => { fetchData(); }} 
          onSendMessage={async (c, r) => { await supabase.from('mensagens').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }} 
        />
      )}
    </Layout>
  );
};

export default App;
