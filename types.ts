
export enum PatientStatus {
  WAITING = 'WAITING',
  OPD = 'OPD',
  COMPLETED = 'COMPLETED'
}

export enum PatientCategory {
  GENERAL = 'General',
  REFERENCE = 'Reference',
  RELATIVE = 'Relative',
  MR = 'MR'
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'OPERATOR' | 'DOCTOR';
  timestamp: number;
}

export interface Patient {
  id: string;
  queueId: number;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  category: PatientCategory;
  city: string;
  status: PatientStatus;
  createdAt: number;
  isVisitor: boolean;
  // Timestamps
  inTime?: number;
  outTime?: number;
  // Chat Alert System
  messages: ChatMessage[];
  hasUnreadAlert: boolean;
  // Doctor fields
  notes?: string;
  medicines?: string;
}

export type PatientFormData = Omit<Patient, 'id' | 'queueId' | 'status' | 'createdAt' | 'notes' | 'medicines' | 'hasUnreadAlert' | 'messages' | 'inTime' | 'outTime'>;

export type AppView = 'OPERATOR' | 'DOCTOR';
