
import { UserRole, User, Class, Student } from './types';

export const INITIAL_USERS: User[] = [
  { 
    id: '1', 
    name: 'Admin Aquarela', 
    email: 'gestor@aquarela.com', 
    role: UserRole.MANAGER,
    password: '123',
    function: 'Diretor'
  },
  { id: '2', name: 'Professora Ana', email: 'ana@aquarela.com', role: UserRole.TEACHER },
  { id: '3', name: 'Pai do Léo', email: 'pai@aquarela.com', role: UserRole.GUARDIAN },
];

export const INITIAL_CLASSES: Class[] = [
  { id: 'c1', name: 'Maternal I - Manhã', teacherId: '2' },
  { id: 'c2', name: 'Jardim II - Tarde', teacherId: '2' },
];

export const INITIAL_STUDENTS: Student[] = [
  { id: 's1', name: 'Leonardo Silva', classId: 'c1', guardianIds: ['3'] },
];
