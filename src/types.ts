import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
}

export interface Course {
  id: string;
  userId: string;
  title: string;
  code?: string;
  instructor?: string;
  color: string;
  schedule?: string;
  createdAt: Timestamp;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type Priority = 'low' | 'medium' | 'high';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  courseId?: string;
  title: string;
  description?: string;
  dueDate: Timestamp;
  status: TaskStatus;
  priority: Priority;
  subTasks: SubTask[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface StudySession {
  id: string;
  userId: string;
  courseId?: string;
  duration: number; // minutes
  startTime: Timestamp;
  notes?: string;
}

export type ViewType = 'dashboard' | 'courses' | 'tasks' | 'calendar' | 'focus';
