
export enum UserRole {
  MANAGER = 'MANAGER',
  TEACHER = 'TEACHER',
  GUARDIAN = 'GUARDIAN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  function?: string; 
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  guardianIds: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

export interface ChatConfig {
  startHour: number;
  endHour: number;
  isEnabled: boolean;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  title: string;
  content: string;
  type: 'general' | 'calendar' | 'event' | 'alert';
  attachments: {
    name: string;
    url: string;
    type: 'image' | 'video' | 'pdf' | 'other';
  }[];
  likes: string[];
  createdAt: string;
}

export interface LessonPlan {
  id: string;
  teacherId: string;
  classId: string;
  date: string;
  lessonNumber: string;
  grade: string;
  shift: string;
  objective: string;
  content: string;
  materials: string;
  bnccCodes: string;
  structure: string;
  assessment: string;
  status: 'pending' | 'approved';
  managerFeedback?: string;
  createdAt: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
}

export interface SchoolMenu {
  id: string;
  date: string;
  colacao: string;
  almoco: string;
  lanche: string;
  janta: string;
}

export interface RoutineEntry {
  id: string;
  studentId: string;
  date: string;
  attendance: 'present' | 'absent';
  colacao: 'comeu tudo' | 'comeu bem' | 'comeu metade' | 'recusou' | 'não ofertado';
  almoco: 'comeu tudo' | 'comeu bem' | 'comeu metade' | 'recusou' | 'não ofertado';
  lanche: 'comeu tudo' | 'comeu bem' | 'comeu metade' | 'recusou' | 'não ofertado';
  janta: 'comeu tudo' | 'comeu bem' | 'comeu metade' | 'recusou' | 'não ofertado';
  banho: 'sim' | 'não' | 'não se aplica';
  agua: 'bebeu bastante' | 'bebeu pouco';
  evacuacao: 'sim' | 'não';
  fralda: '1x' | '2x' | '3x' | 'não se aplica';
  sleep: 'dormiu' | 'não dormiu';
  activities: string;
  observations: string;
  mood: 'happy' | 'calm' | 'fussy' | 'tired';
  authorId: string;
}

export type ViewState = 'LOGIN' | 'SIGNUP' | 'DASHBOARD';
