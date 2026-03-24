
import React, { useState, useEffect } from 'react';
import { User, UserRole, Class, Student, RoutineLog, ViewState, LessonPlan, FeedPost, ChatMessage, ChatConfig, SchoolEvent, SchoolMenu } from './types';
import Layout from './components/Layout';
import ManagerDashboard from './components/ManagerDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import GuardianDashboard from './components/GuardianDashboard';
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

const apiFetchAll = async () => {
  const res = await fetch('/api/data');
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON from /api/data:", text);
    throw new Error("Resposta do servidor não é um JSON válido. Verifique se o servidor está rodando corretamente.");
  }
};

const apiExecute = async (query: string, values: any[] = []) => {
  const res = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, values }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON from /api/execute:", text);
    throw new Error("Resposta do servidor não é um JSON válido.");
  }
};

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('LOGIN');
  const [loginRole, setLoginRole] = useState<UserRole>(UserRole.GUARDIAN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const isSigningUpRef = React.useRef(isSigningUp);
  useEffect(() => {
    isSigningUpRef.current = isSigningUp;
  }, [isSigningUp]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ message, onConfirm });
  };
  const [error, setError] = useState<string | null>(null);

  // Global Data States
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [routineLogs, setRoutineLogs] = useState<RoutineLog[]>([]);
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
  const [signupRole, setSignupRole] = useState<UserRole>(UserRole.GUARDIAN);

  const mapDbRoleToUserRole = (dbRole: string): UserRole => {
    const r = dbRole.toLowerCase();
    if (r === 'gestao' || r === 'gestor') return UserRole.MANAGER;
    if (r === 'professor') return UserRole.TEACHER;
    return UserRole.GUARDIAN;
  };

  const mapUserRoleToDbRole = (role: UserRole): string => {
    if (role === UserRole.MANAGER) return 'gestor';
    if (role === UserRole.TEACHER) return 'professor';
    return 'responsavel';
  };

  const fetchData = async () => {
    setError(null);
    try {
      const data = await apiFetchAll();
      
      const dbUsers = data.usuarios;
      const dbClasses = data.turmas;
      const dbStudents = data.alunos;
      const dbLogs = data.registros_rotina;
      const dbPlans = data.planejamento_professor;
      const dbPosts = data.mural;
      const dbEvents = data.eventos;
      const dbMenus = data.cardapio;
      const dbMessages = data.mensagens;

      setUsers((dbUsers || []).map((u: any) => ({
        id: u.id, name: u.nome, email: u.email, role: mapDbRoleToUserRole(u.tipo)
      })));

      setClasses((dbClasses || []).map((c: any) => ({
        id: c.id, name: c.nome, teacherId: c.professor_id
      })));

      setStudents((dbStudents || []).map((s: any) => ({
        id: s.id, name: s.nome, classId: s.turma_id, guardianIds: s.responsavel_id ? [s.responsavel_id] : [],
        birthDate: s.data_nascimento
      })));

      setRoutineLogs((dbLogs || []).map((l: any) => ({
        id: l.id, studentId: l.aluno_id, teacherId: l.professor_id, teacherName: l.professor_nome,
        category: l.categoria, content: l.conteudo, date: l.data, time: l.horario, createdAt: l.criado_em
      } as any)));

      setLessonPlans((dbPlans || []).map((p: any) => ({
        id: p.id, teacherId: p.professor_id, classId: p.turma_id, date: p.data, status: p.status, 
        content: p.conteudo_trabalhado, objective: p.objective, managerFeedback: p.manager_feedback, lessonNumber: p.lesson_number,
        materials: p.materials, bnccCodes: p.bncc_codes, assessment: p.assessment, 
        grade: dbClasses?.find((c:any) => c.id === p.turma_id)?.nome || ''
      } as any)));

      setPosts((dbPosts || []).map((p: any) => ({
        id: p.id, authorId: p.author_id, authorName: p.author_name, authorRole: mapDbRoleToUserRole(p.author_role || 'professor'), 
        content: p.content, likes: p.likes || [], createdAt: p.created_at, title: p.title, type: p.type || 'general',
        attachments: p.attachments || []
      } as any)).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      setEvents((dbEvents || []));
      setMessages((dbMessages || []).map((m: any) => ({ id: m.id, senderId: m.sender_id, receiverId: m.receiver_id, content: m.content, timestamp: m.timestamp })));

      const uniqueMenus = (dbMenus || []).reduce((acc: any, curr: any) => {
        if (!acc[curr.data]) acc[curr.data] = { date: curr.data, id: curr.data };
        acc[curr.data][curr.refeicao] = curr.descricao;
        return acc;
      }, {});
      setMenus(Object.values(uniqueMenus));

    } catch (err: any) {
      console.error("Erro ao sincronizar dados:", err);
      setError(err.message || "Erro desconhecido ao sincronizar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If we are in the middle of a signup, don't try to fetch the user yet
        // handleSignup will handle the redirection after the DB call
        if (isSigningUpRef.current) return;

        try {
          console.log("Auth state changed: user logged in", firebaseUser.uid);
          const res = await fetch(`/api/user/${firebaseUser.uid}`);
          if (res.ok) {
            const data = await res.json();
            console.log("User profile fetched successfully:", data.nome);
            setCurrentUser({
              id: data.id,
              name: data.nome,
              email: data.email,
              role: mapDbRoleToUserRole(data.tipo)
            });
            setViewState('DASHBOARD');
          } else {
            console.warn("User exists in Firebase but not in our DB. Auto-registering as 'responsavel'.");
            const registerRes = await fetch('/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firebase_uid: firebaseUser.uid,
                nome: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
                email: firebaseUser.email,
                tipo: 'responsavel',
                is_signup: false
              }),
            });
            
            if (registerRes.ok) {
              const data = await registerRes.json();
              console.log("User auto-registered successfully:", data.nome);
              setCurrentUser({
                id: data.id,
                name: data.nome,
                email: data.email,
                role: mapDbRoleToUserRole(data.tipo)
              });
              setViewState('DASHBOARD');
            } else {
              console.error("Failed to auto-register user. Proceeding with Firebase data.");
              setCurrentUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
                email: firebaseUser.email || '',
                role: UserRole.GUARDIAN
              });
              setViewState('DASHBOARD');
              showNotification("Aviso: Não foi possível vincular sua conta ao banco de dados, algumas funcionalidades podem estar limitadas.", 'info');
            }
          }
        } catch (err) {
          console.error("Error fetching or auto-registering user profile:", err);
          setCurrentUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            email: firebaseUser.email || '',
            role: UserRole.GUARDIAN
          });
          setViewState('DASHBOARD');
        }
      } else {
        console.log("Auth state changed: no user logged in");
        setCurrentUser(null);
        setViewState('LOGIN');
      }
      setIsLoading(false);
    });

    fetchData();
    return () => unsubscribe();
  }, [isSigningUp]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        showNotification("E-mail ou senha incorretos.", 'error');
      } else if (err.code === 'auth/too-many-requests') {
        showNotification("Muitas tentativas malsucedidas. Tente novamente mais tarde.", 'error');
      } else {
        showNotification("Erro no login: " + err.message, 'error');
      }
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword.length < 6) {
      showNotification("A senha deve ter pelo menos 6 caracteres.", 'error');
      return;
    }
    setIsLoading(true);
    setIsSigningUp(true);
    try {
      console.log("Starting Firebase signup for:", signupEmail);
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail.trim(), signupPassword);
      const firebaseUser = userCredential.user;
      console.log("Firebase user created:", firebaseUser.uid);

      console.log("Registering user in PostgreSQL...");
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          nome: signupName,
          email: signupEmail.trim(),
          tipo: mapUserRoleToDbRole(signupRole),
          is_signup: true
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erro ao salvar no banco de dados: ${errorText}`);
      }

      const dbUser = await res.json();
      console.log("User registered in PostgreSQL successfully:", dbUser.id);

      setCurrentUser({
        id: dbUser.id,
        name: dbUser.nome,
        email: dbUser.email,
        role: mapDbRoleToUserRole(dbUser.tipo)
      });
      
      showNotification("Cadastro realizado com sucesso!", 'success');
      setViewState('DASHBOARD');
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === 'auth/email-already-in-use') {
        showNotification("Este e-mail já está em uso. Tente fazer login.", 'error');
        setViewState('LOGIN');
      } else {
        showNotification("Erro no cadastro: " + err.message, 'error');
      }
    } finally {
      setIsLoading(false);
      setIsSigningUp(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setViewState('LOGIN');
    setCurrentUser(null);
  };

  const handleSaveRoutineLog = async (log: Omit<RoutineLog, 'id' | 'createdAt'>) => {
    const query = `
      INSERT INTO registros_rotina (aluno_id, professor_id, professor_nome, categoria, conteudo, data, horario)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const values = [log.studentId, log.teacherId, log.teacherName, log.category, log.content, log.date, log.time];
    try {
      await apiExecute(query, values);
      fetchData();
    } catch (err: any) {
      showNotification("Erro ao salvar registro: " + err.message, 'error');
    }
  };

  const handleDeleteRoutineLog = async (id: string) => {
    try {
      await apiExecute("DELETE FROM registros_rotina WHERE id = $1", [id]);
      fetchData();
    } catch (err: any) {
      showNotification("Erro ao excluir registro: " + err.message, 'error');
    }
  };

  const handleUpdateRoutineLog = async (id: string, content: string) => {
    try {
      await apiExecute("UPDATE registros_rotina SET conteudo = $1 WHERE id = $2", [content, id]);
      fetchData();
    } catch (err: any) {
      showNotification("Erro ao atualizar registro: " + err.message, 'error');
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newLikes = post.likes.includes(currentUser.id)
      ? post.likes.filter(id => id !== currentUser.id)
      : [...post.likes, currentUser.id];

    try {
      await apiExecute("UPDATE mural SET likes = $1 WHERE id = $2", [newLikes, postId]);
      fetchData();
    } catch (err: any) {
      console.error("Erro ao curtir:", err);
    }
  };

  const handleCreatePost = async (p: any) => {
    if (!currentUser) return;
    const query = `
      INSERT INTO mural (author_id, author_name, author_role, title, content, type, attachments)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const values = [
      currentUser.id, currentUser.name, mapUserRoleToDbRole(currentUser.role),
      p.title, p.content, p.type || 'general', JSON.stringify(p.attachments || [])
    ];
    try {
      await apiExecute(query, values);
      fetchData();
    } catch (err: any) {
      showNotification("Erro ao publicar: " + err.message, 'error');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-orange-50 text-orange-400 font-black animate-pulse uppercase">Aquarela Carregando...</div>;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 font-['Quicksand']">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-xl border border-red-100 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Erro de Conexão</h2>
        <p className="text-gray-600 mb-6 font-bold">{error}</p>
        <p className="text-sm text-gray-400 mb-6">Verifique se a variável de ambiente <strong>DATABASE_URL</strong> está configurada corretamente nas configurações do projeto.</p>
        <button onClick={() => fetchData()} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-lg uppercase hover:bg-gray-800 transition-colors">Tentar Novamente</button>
      </div>
    </div>
  );

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

  if (viewState === 'SIGNUP') return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-orange-50 font-['Quicksand']">
      <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-orange-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Novo Cadastro</h1>
          <p className="text-gray-500 font-bold mt-2">Crie sua conta na Aquarela</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <input required type="text" placeholder="Nome Completo" value={signupName} onChange={e => setSignupName(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold outline-none" />
          <input required type="email" placeholder="E-mail" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold outline-none" />
          <input required type="password" minLength={6} placeholder="Senha (mín. 6 caracteres)" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="w-full p-4 rounded-2xl border bg-gray-50 font-bold outline-none" />
          
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase ml-2">Tipo de Usuário</label>
            <select 
              value={signupRole} 
              onChange={e => setSignupRole(e.target.value as UserRole)}
              className="w-full p-4 rounded-2xl border bg-gray-50 font-bold outline-none appearance-none"
            >
              <option value={UserRole.GUARDIAN}>Responsável / Família</option>
              <option value={UserRole.TEACHER}>Professor(a)</option>
              <option value={UserRole.MANAGER}>Gestão / Direção</option>
            </select>
          </div>

          <button type="submit" className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl shadow-xl uppercase mt-4">CADASTRAR</button>
        </form>
        <button onClick={() => setViewState('LOGIN')} className="w-full text-center mt-6 text-[10px] font-black text-gray-400 uppercase hover:text-orange-500">Já tem conta? Entrar</button>
      </div>
    </div>
  );

  if (!currentUser) return null;

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 font-bold text-sm shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Usuário logado com sucesso! Bem-vindo(a) à Agenda Aquarela.
      </div>
      {currentUser.role === UserRole.MANAGER && (
        <ManagerDashboard 
          classes={classes} students={students} users={users} posts={posts} lessonPlans={lessonPlans}
          messages={messages} chatConfig={chatConfig} events={events} menus={menus} currentUserId={currentUser.id}
          onAddClass={async (n, t) => { await apiExecute("INSERT INTO turmas (nome, professor_id) VALUES ($1, $2)", [n, t]); fetchData(); showNotification("Turma criada!"); }}
          onUpdateClassTeacher={async (c, t) => { await apiExecute("UPDATE turmas SET professor_id = $1 WHERE id = $2", [t, c]); fetchData(); showNotification("Professor atualizado!"); }}
          onDeleteClass={async id => { showConfirm("Apagar turma permanentemente?", async () => { await apiExecute("DELETE FROM turmas WHERE id = $1", [id]); fetchData(); showNotification("Turma removida."); }); }}
          onAddStudent={async (n, c, e, b) => { 
            const email = e.split(',')[0].trim().toLowerCase();
            let respId = null;
            const exUsers = await apiExecute("SELECT * FROM usuarios WHERE email = $1", [email]);
            if (exUsers.length > 0) respId = exUsers[0].id;
            else {
              const nuUsers = await apiExecute("INSERT INTO usuarios (nome, email, tipo, password) VALUES ($1, $2, $3, $4) RETURNING id", [`Família de ${n}`, email, 'responsavel', '123456']);
              if (nuUsers.length > 0) respId = nuUsers[0].id;
            }
            await apiExecute("INSERT INTO alunos (nome, turma_id, responsavel_id, data_nascimento) VALUES ($1, $2, $3, $4)", [n, c, respId, b]);
            fetchData();
            showNotification("Aluno cadastrado!");
          }}
          onUpdateStudent={async (id, n, c, e, b) => {
            const email = e.split(',')[0].trim().toLowerCase();
            let respId = null;
            const exUsers = await apiExecute("SELECT * FROM usuarios WHERE email = $1", [email]);
            if (exUsers.length > 0) respId = exUsers[0].id;
            else {
              const nuUsers = await apiExecute("INSERT INTO usuarios (nome, email, tipo, password) VALUES ($1, $2, $3, $4) RETURNING id", [`Família de ${n}`, email, 'responsavel', '123456']);
              if (nuUsers.length > 0) respId = nuUsers[0].id;
            }
            await apiExecute("UPDATE alunos SET nome = $1, turma_id = $2, responsavel_id = $3, data_nascimento = $4 WHERE id = $5", [n, c, respId, b, id]);
            fetchData();
            showNotification("Dados do aluno atualizados!");
          }}
          onDeleteStudent={async id => { showConfirm("Apagar este aluno?", async () => { await apiExecute("DELETE FROM alunos WHERE id = $1", [id]); fetchData(); showNotification("Aluno removido."); }); }}
          onAddUser={async (n, e, r) => { 
            await apiExecute(`
              INSERT INTO usuarios (nome, email, tipo, password) 
              VALUES ($1, $2, $3::tipo_usuario, $4) 
              ON CONFLICT (email) DO UPDATE SET 
                nome = EXCLUDED.nome, 
                tipo = EXCLUDED.tipo
            `, [n, e.toLowerCase(), mapUserRoleToDbRole(r), '123456']); 
            fetchData(); 
            showNotification("Usuário cadastrado!"); 
          }}
          onDeleteUser={async id => {
            const user = users.find(u => u.id === id);
            if (!user) return;
            
            const confirmMsg = user.role === UserRole.TEACHER 
              ? `ATENÇÃO: Deseja excluir o(a) professor(a) ${user.name}? \n\nIsso apagará permanentemente todos os seus planejamentos, registros de rotina e mensagens. Esta ação não pode ser desfeita.`
              : `Deseja excluir o usuário ${user.name}?`;

            showConfirm(confirmMsg, async () => {
              try {
                await apiExecute("DELETE FROM mensagens WHERE sender_id = $1 OR receiver_id = $1", [id]);
                if (user.role === UserRole.TEACHER) {
                  await apiExecute("DELETE FROM planejamento_professor WHERE professor_id = $1", [id]);
                  await apiExecute("DELETE FROM registros_rotina WHERE professor_id = $1", [id]);
                  await apiExecute("DELETE FROM mural WHERE author_id = $1", [id]);
                }
                await apiExecute("DELETE FROM usuarios WHERE id = $1", [id]);
                showNotification("Usuário e todos os seus dados vinculados foram excluídos com sucesso.", 'success');
                fetchData();
              } catch (err: any) {
                showNotification("Erro ao excluir usuário: " + err.message, 'error');
              }
            });
          }}
          onAddEvent={async ev => { await apiExecute("INSERT INTO eventos (title, date, description, location) VALUES ($1, $2, $3, $4)", [ev.title, ev.date, ev.description, ev.location]); fetchData(); showNotification("Evento publicado!"); }}
          onDeleteEvent={async id => { showConfirm("Excluir este evento?", async () => { await apiExecute("DELETE FROM eventos WHERE id = $1", [id]); fetchData(); showNotification("Evento removido."); }); }}
          onAddMenu={async m => { 
            const items = [
              { data: m.date, refeicao: 'colacao', descricao: m.colacao },
              { data: m.date, refeicao: 'almoco', descricao: m.almoco },
              { data: m.date, refeicao: 'lanche', descricao: m.lanche },
              { data: m.date, refeicao: 'janta', descricao: m.janta }
            ].filter(r => r.descricao && r.descricao.trim() !== '');
            
            for (const item of items) {
              await apiExecute("INSERT INTO cardapio (data, refeicao, descricao) VALUES ($1, $2, $3) ON CONFLICT (data, refeicao) DO UPDATE SET descricao = EXCLUDED.descricao", [item.data, item.refeicao, item.descricao]);
            }
            fetchData(); 
            showNotification("Cardápio salvo!");
          }}
          onDeleteMenu={async id => { showConfirm("Excluir este cardápio?", async () => { await apiExecute("DELETE FROM cardapio WHERE data = $1", [id]); fetchData(); showNotification("Cardápio removido."); }); }}
          onCreatePost={handleCreatePost}
          onLikePost={handleLikePost}
          onSendMessage={async (c, r) => { await apiExecute("INSERT INTO mensagens (sender_id, receiver_id, content) VALUES ($1, $2, $3)", [currentUser.id, r, c]); fetchData(); }}
          onUpdateChatConfig={async (c) => { await apiExecute("UPDATE configuracao_chat SET inicio_hora = $1, fim_hora = $2, habilitado = $3", [c.startHour, c.endHour, c.isEnabled]); fetchData(); showNotification("Configuração do chat salva!"); }}
          onApprovePlan={async (pid: string, status: 'approved' | 'rejected', f: string) => { await apiExecute("UPDATE planejamento_professor SET status = $1, manager_feedback = $2 WHERE id = $3", [status, f, pid]); fetchData(); showNotification(`Planejamento ${status === 'approved' ? 'aprovado' : 'enviado para revisão'}!`); }}
          routineLogs={routineLogs}
          onSaveRoutineLog={handleSaveRoutineLog}
          onDeleteRoutineLog={handleDeleteRoutineLog}
          onUpdateRoutineLog={handleUpdateRoutineLog}
          showNotification={showNotification}
          showConfirm={showConfirm}
        />
      )}
      {currentUser.role === UserRole.TEACHER && (
        <TeacherDashboard 
          classes={classes} students={students} lessonPlans={lessonPlans.filter(p => p.teacherId === currentUser.id)} 
          posts={posts} messages={messages} chatConfig={chatConfig} users={users} currentUserId={currentUser.id}
          routineLogs={routineLogs}
          onSaveRoutineLog={handleSaveRoutineLog}
          onDeleteRoutineLog={handleDeleteRoutineLog}
          onUpdateRoutineLog={handleUpdateRoutineLog}
          onSaveLessonPlan={async pd => { 
            const query = `
              INSERT INTO planejamento_professor (id, professor_id, turma_id, data, conteudo_trabalhado, objective, lesson_number, materials, bncc_codes, assessment)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (id) DO UPDATE SET
                turma_id = EXCLUDED.turma_id,
                data = EXCLUDED.data,
                conteudo_trabalhado = EXCLUDED.conteudo_trabalhado,
                objective = EXCLUDED.objective,
                lesson_number = EXCLUDED.lesson_number,
                materials = EXCLUDED.materials,
                bncc_codes = EXCLUDED.bncc_codes,
                assessment = EXCLUDED.assessment
            `;
            const id = (pd as any).id || crypto.randomUUID();
            const values = [id, currentUser.id, pd.classId, pd.date, pd.content, pd.objective, pd.lessonNumber, pd.materials, pd.bnccCodes, pd.assessment];
            await apiExecute(query, values); 
            fetchData(); 
          }}
          onDeleteLessonPlan={async (id, status) => {
            const msg = status === 'approved' 
              ? "Este planejamento já recebeu o visto do gestor. Tem certeza que deseja excluí-lo permanentemente?"
              : "Tem certeza que deseja apagar este plano de aula?";
            showConfirm(msg, async () => {
              await apiExecute("DELETE FROM planejamento_professor WHERE id = $1", [id]);
              fetchData();
              showNotification("Planejamento removido.");
            });
          }}
          onCreatePost={handleCreatePost}
          onLikePost={handleLikePost}
          onSendMessage={async (c, r) => { await apiExecute("INSERT INTO mensagens (sender_id, receiver_id, content) VALUES ($1, $2, $3)", [currentUser.id, r, c]); fetchData(); }}
          showNotification={showNotification}
          showConfirm={showConfirm}
        />
      )}
      {currentUser.role === UserRole.GUARDIAN && (
        <GuardianDashboard 
          students={students.filter(s => s.guardianIds.includes(currentUser.id))} routineLogs={routineLogs} posts={posts} messages={messages} 
          chatConfig={chatConfig} classes={classes} users={users} events={events} menus={menus} currentUserId={currentUser.id}
          onLikePost={handleLikePost}
          onSendMessage={async (c, r) => { await apiExecute("INSERT INTO mensagens (sender_id, receiver_id, content) VALUES ($1, $2, $3)", [currentUser.id, r, c]); fetchData(); }} 
        />
      )}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 flex items-center gap-3 border ${
          notification.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' :
          notification.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
          'bg-blue-50 border-blue-100 text-blue-700'
        }`}>
          <span className="text-xl">
            {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <p className="font-bold text-sm">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-2 text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full card-shadow border border-orange-100 space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl mx-auto">❓</div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-gray-900">Confirmar Ação</h3>
              <p className="text-sm font-medium text-gray-500">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="flex-1 py-4 gradient-aquarela text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
