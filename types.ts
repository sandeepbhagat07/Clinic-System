
export enum PatientStatus {
  WAITING = 'WAITING',
  OPD = 'OPD',
  COMPLETED = 'COMPLETED'
}

export enum PatientCategory {
  PATIENT = 'PATIENT',
  VISITOR = 'VISITOR'
}

export enum PatientType {
  // Category: PATIENT
  GEN_PATIENT = 'GEN PATIENT',
  REF_PATIENT = 'REF PATIENT',
  REL_PATIENT = 'REL PATIENT',
  // Category: VISITOR
  VISITOR = 'VISITOR',
  RELATIVE = 'RELATIVE',
  FAMILY = 'FAMILY',
  MR = 'MR',
  DOCTOR = 'DOCTOR',
  SOCIAL = 'SOCIAL'
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
  type: PatientType;
  city: string;
  status: PatientStatus;
  createdAt: number;
  mobile?: string;
  // Link to patient master record
  patientId?: number;
  // Timestamps
  inTime?: number;
  outTime?: number;
  // Sort order for waiting queue
  sortOrder?: number;
  // Chat Alert System
  messages: ChatMessage[];
  hasUnreadAlert: boolean;
  // Doctor fields
  notes?: string;
  medicines?: string;
}

export type PatientFormData = Omit<Patient, 'id' | 'queueId' | 'status' | 'createdAt' | 'notes' | 'medicines' | 'hasUnreadAlert' | 'messages' | 'inTime' | 'outTime'>;

export type AppView = 'OPERATOR' | 'DOCTOR' | 'LOGIN';

export enum EventType {
  NORMAL = 'NORMAL',
  OPERATION = 'OPERATION',
  VISIT = 'VISIT',
  HOSPITAL_RELATED = 'HOSPITAL RELATED',
  SOCIAL = 'SOCIAL'
}

export interface CalendarEvent {
  id: number;
  title: string;
  eventDate: string;
  eventTime: string | null;
  description: string;
  eventType: EventType;
  remindMe: boolean;
  createdBy: string;
  createdAt: string;
}
