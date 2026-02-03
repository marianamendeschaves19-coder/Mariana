
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

  // Global Data States
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

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const mapDbRoleToUserRole = (dbRole: string): UserRole => {
    const r = dbRole.toLowerCase();
    if (r === 'gestor') return UserRole.MANAGER;
    if (r === 'professor') return UserRole.TEACHER;
    return UserRole.GUARDIAN;
  };

  const mapUserRoleToDbRole = (role: UserRole): string => {
    if (role === UserRole.MANAGER) return 'gestor';
    if (role === UserRole.TEACHER) return 'professor';
    return 'responsavel';
  };

  const fetchData = async () => {
    try {
      const { data: dbUsers } = await supabase.from('usuarios').select('*');
      const { data: dbClasses } = await supabase.from('turmas').select('*');
      const { data: dbStudents } = await supabase.from('alunos').select('*');
      const { data: dbRoutines } = await supabase.from('diario_aluno').select('*');
      const { data: dbPlans } = await supabase.from('planejamento_professor').select('*');
      const { data: dbPosts } = await supabase.from('mural').select('*');
      const { data: dbEvents } = await supabase.from('eventos').select('*');
      const { data: dbMenus } = await supabase.from('cardapio').select('*');
      const { data: dbMessages } = await supabase.from('mensagens').select('*');

      setUsers((dbUsers || []).map((u: any) => ({
        id: u.id, name: u.nome, email: u.email, role: mapDbRoleToUserRole(u.tipo)
      })));

      setClasses((dbClasses || []).map((c: any) => ({
        id: c.id, name: c.nome, teacherId: c.professor_id
      })));

      setStudents((dbStudents || []).map((s: any) => ({
        id: s.id, name: s.nome, classId: s.turma_id, guardianIds: s.responsavel_id ? [s.responsavel_id] : []
      })));

      setRoutines((dbRoutines || []).map((r: any) => ({
        id: r.id, studentId: r.aluno_id, date: r.data, mood: r.humor || 'happy', 
        attendance: r.attendance || 'present', observations: r.observacoes_professor || '',
        activities: r.atividades || '', colacao: r.colacao, almoco: r.almoco, lanche: r.lanche, janta: r.janta,
        banho: r.banho, sleep: r.sleep, evacuacao: r.evacuacao, fralda: r.fralda, agua: r.agua
      } as any)));

      setLessonPlans((dbPlans || []).map((p: any) => ({
        id: p.id, teacherId: p.professor_id, classId: p.turma_id, date: p.data, status: p.status, 
        content: p.conteudo_trabalhado, managerFeedback: p.manager_feedback, lessonNumber: p.lesson_number
      } as any)));

      setPosts((dbPosts || []).map((p: any) => ({
        id: p.id, authorId: p.author_id, authorName: p.author_name, authorRole: mapDbRoleToUserRole(p.author_role || 'professor'), 
        content: p.content, likes: p.likes || [], createdAt: p.created_at, title: p.title, type: p.type || 'general',
        attachments: p.attachments || []
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
      console.error("Erro ao sincronizar dados:", err);
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
      const { data, error } = await supabase.from('usuarios').select('*').eq('email', email).eq('tipo', tipo).maybeSingle();
      if (error) return alert("Erro no servidor: " + error.message);
      if (!data || data.password !== loginPassword) return alert("Credenciais inválidas.");

      setCurrentUser({ id: data.id, name: data.nome, email: data.email, role: mapDbRoleToUserRole(data.tipo) });
      setViewState('DASHBOARD');
    } catch (err) {
      alert("Falha técnica no login.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('usuarios').insert([{ nome: signupName, email: signupEmail.toLowerCase().trim(), tipo: 'gestor', password: signupPassword }]);
      if (error) return alert("Erro no cadastro: " + error.message);
      alert("Gestor cadastrado! Faça login.");
      setViewState('LOGIN');
      fetchData();
    } catch (err) {
      alert("Erro ao realizar cadastro.");
    }
  };

  const handleSaveRoutine = async (nr: Omit<RoutineEntry, 'id'>) => {
    const dbPayload = {
      aluno_id: nr.studentId,
      data: nr.date,
      humor: nr.mood,
      attendance: nr.attendance || 'present',
      atividades: nr.activities,
      observacoes_professor: nr.observations,
      colacao: nr.colacao, almoco: nr.almoco, lanche: nr.lanche, janta: nr.janta,
      banho: nr.banho, sleep: nr.sleep, fralda: nr.fralda, agua: nr.agua, evacuacao: nr.evacuacao
    };
    
    const { error } = await supabase.from('diario_aluno').upsert([dbPayload], { onConflict: 'aluno_id, data' });
    if (error) alert("Erro ao salvar diário: " + error.message);
    else fetchData();
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newLikes = post.likes.includes(currentUser.id)
      ? post.likes.filter(id => id !== currentUser.id)
      : [...post.likes, currentUser.id];

    const { error } = await supabase.from('mural').update({ likes: newLikes }).eq('id', postId);
    if (error) console.error("Erro ao curtir:", error);
    else fetchData();
  };

  const handleCreatePost = async (p: any) => {
    if (!currentUser) return;
    const { error } = await supabase.from('mural').insert([{
      ...p,
      author_id: currentUser.id,
      author_name: currentUser.name,
      author_role: mapUserRoleToDbRole(currentUser.role)
    }]);
    if (error) alert("Erro ao publicar: " + error.message);
    else fetchData();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-orange-50 text-orange-400 font-black animate-pulse uppercase">Aquarela Carregando...</div>;

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
          <input required type="email" placeholder="E-mail" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold outline-none" />
          <input required type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold outline-none" />
          <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase">ENTRAR</button>
        </form>
        {loginRole === UserRole.MANAGER && <button onClick={() => setViewState('SIGNUP')} className="w-full text-center mt-6 text-[10px] font-black text-gray-400 uppercase hover:text-orange-500">Nova Escola?</button>}
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
          onAddClass={async (n, t) => { await supabase.from('turmas').insert([{ nome: n, professor_id: t }]); fetchData(); }}
          onUpdateClassTeacher={async (c, t) => { await supabase.from('turmas').update({ professor_id: t }).eq('id', c); fetchData(); }}
          onDeleteClass={async id => { await supabase.from('turmas').delete().eq('id', id); fetchData(); }}
          onAddStudent={async (n, c, e) => { 
            const email = e.split(',')[0].trim().toLowerCase();
            let respId = null;
            const { data: ex } = await supabase.from('usuarios').select('*').eq('email', email).maybeSingle();
            if (ex) respId = ex.id;
            else {
              const { data: nu } = await supabase.from('usuarios').insert([{ nome: `Família de ${n}`, email, tipo: 'responsavel', password: '123' }]).select().maybeSingle();
              if (nu) respId = nu.id;
            }
            await supabase.from('alunos').insert([{ nome: n, turma_id: c, responsavel_id: respId }]);
            fetchData();
          }}
          onDeleteStudent={async id => { await supabase.from('alunos').delete().eq('id', id); fetchData(); }}
          onAddUser={async (n, e, r) => { await supabase.from('usuarios').insert([{ nome: n, email: e.toLowerCase(), tipo: mapUserRoleToDbRole(r), password: '123' }]); fetchData(); }}
          onDeleteUser={async id => { await supabase.from('usuarios').delete().eq('id', id); fetchData(); }}
          onAddEvent={async ev => { await supabase.from('eventos').insert([ev]); fetchData(); }}
          onDeleteEvent={async id => { await supabase.from('eventos').delete().eq('id', id); fetchData(); }}
          onAddMenu={async m => { 
            const payload = [
              { data: m.date, refeicao: 'colacao', descricao: m.colacao },
              { data: m.date, refeicao: 'almoco', descricao: m.almoco },
              { data: m.date, refeicao: 'lanche', descricao: m.lanche },
              { data: m.date, refeicao: 'janta', descricao: m.janta }
            ].filter(r => r.descricao && r.descricao.trim() !== '');
            await supabase.from('cardapio').upsert(payload, { onConflict: 'data, refeicao' }); 
            fetchData(); 
          }}
          onDeleteMenu={async id => { await supabase.from('cardapio').delete().eq('data', id); fetchData(); }}
          onCreatePost={handleCreatePost}
          onLikePost={handleLikePost}
          onSendMessage={async (c, r) => { await supabase.from('mensagens').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }}
          onUpdateChatConfig={setChatConfig}
          onApprovePlan={async (pid, f) => { await supabase.from('planejamento_professor').update({ status: 'approved', manager_feedback: f }).eq('id', pid); fetchData(); }}
        />
      )}
      {currentUser.role === UserRole.TEACHER && (
        <TeacherDashboard 
          classes={classes.filter(c => c.teacherId === currentUser.id)} students={students} lessonPlans={lessonPlans.filter(p => p.teacherId === currentUser.id)} 
          posts={posts} messages={messages} chatConfig={chatConfig} users={users} currentUserId={currentUser.id} routines={routines}
          onSaveRoutine={handleSaveRoutine} 
          onSaveLessonPlan={async pd => { await supabase.from('planejamento_professor').upsert([{ professor_id: currentUser.id, turma_id: pd.classId, data: pd.date, conteudo_trabalhado: pd.content, objective: pd.objective, lesson_number: pd.lessonNumber }]); fetchData(); }}
          onCreatePost={handleCreatePost}
          onLikePost={handleLikePost}
          onSendMessage={async (c, r) => { await supabase.from('mensagens').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }}
        />
      )}
      {currentUser.role === UserRole.GUARDIAN && (
        <GuardianDashboard 
          students={students.filter(s => s.guardianIds.includes(currentUser.id))} routines={routines} posts={posts} messages={messages} 
          chatConfig={chatConfig} classes={classes} users={users} events={events} menus={menus} currentUserId={currentUser.id}
          onLikePost={handleLikePost}
          onSendMessage={async (c, r) => { await supabase.from('mensagens').insert([{ sender_id: currentUser.id, receiver_id: r, content: c }]); fetchData(); }} 
        />
      )}
    </Layout>
  );
};

export default App;
