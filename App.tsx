
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Patient, PatientStatus, PatientFormData, AppView, ChatMessage, PatientCategory, PatientType } from './types';
import QueueColumn from './components/QueueColumn';
import PatientForm from './components/PatientForm';
import DoctorConsultationForm from './components/DoctorConsultationForm';
import ChatModal from './components/ChatModal';
import { Icons } from './constants';

const API_BASE = window.location.origin.includes('replit.app') 
  ? '/api' 
  : '/api';
const LOCAL_STORAGE_KEY = 'clinicflow_patients_fallback';

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [nextQueueId, setNextQueueId] = useState(1);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [activeView, setActiveView] = useState<AppView>('OPERATOR');
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);
  const [activeChatPatientId, setActiveChatPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // Persistence Helper
  const saveToLocalStorage = (data: Patient[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

  // Initial Fetch: Try Backend -> Fallback to LocalStorage
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add cache-busting timestamp to prevent browser from serving cached 404/html
        const res = await fetch(`${API_BASE}/patients?t=${Date.now()}`);
        if (!res.ok) throw new Error('Backend responded with error');
        
        const data = await res.json();
        // If data is an array, it's valid API response
        if (!Array.isArray(data)) throw new Error('Invalid data format');
        
        setPatients(data);
        setIsBackendOnline(true);
        
        const patientEntries = data.filter((p: Patient) => p.category === PatientCategory.PATIENT);
        const maxId = patientEntries.length > 0 ? Math.max(...patientEntries.map((p: Patient) => p.queueId)) : 0;
        setNextQueueId(maxId + 1);
      } catch (err) {
        console.warn("Backend unreachable. Falling back to local storage.", err);
        setIsBackendOnline(false);
        
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          setPatients(parsed);
          const patientEntries = parsed.filter((p: Patient) => p.category === PatientCategory.PATIENT);
          const maxId = patientEntries.length > 0 ? Math.max(...patientEntries.map((p: Patient) => p.queueId)) : 0;
          setNextQueueId(maxId + 1);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addPatient = useCallback(async (formData: PatientFormData) => {
    const isVisitor = formData.category === PatientCategory.VISITOR;
    const now = Date.now();
    const newPatient: Patient = {
      ...formData,
      id: crypto.randomUUID(),
      queueId: isVisitor ? 0 : nextQueueId,
      status: PatientStatus.WAITING,
      createdAt: now,
      inTime: now,
      messages: [],
      hasUnreadAlert: false,
    };

    try {
      if (isBackendOnline) {
        await fetch(`${API_BASE}/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPatient)
        });
      }
    } catch (err) {
      console.error("API call failed, saving locally.");
    } finally {
      const updated = [...patients, newPatient];
      setPatients(updated);
      saveToLocalStorage(updated);
      if (!isVisitor) setNextQueueId(prev => prev + 1);
    }
  }, [nextQueueId, patients, isBackendOnline]);

  const updatePatient = useCallback(async (id: string, formData: Partial<Patient>) => {
    try {
      if (isBackendOnline) {
        await fetch(`${API_BASE}/patients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
    } catch (err) {
      console.error("API update failed, updating locally.");
    } finally {
      const updated = patients.map(p => p.id === id ? { ...p, ...formData } : p);
      setPatients(updated);
      saveToLocalStorage(updated);
      setEditingPatient(null);
    }
  }, [patients, isBackendOnline]);

  const addMessage = useCallback(async (patientId: string, text: string) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text,
      sender: activeView,
      timestamp: Date.now(),
    };

    try {
      if (isBackendOnline) {
        await fetch(`${API_BASE}/patients/${patientId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMessage)
        });
      }
    } catch (err) {
      console.error("API message failed, saving locally.");
    } finally {
      const updated = patients.map(p => 
        p.id === patientId ? { 
          ...p, 
          messages: [...p.messages, newMessage],
          hasUnreadAlert: true 
        } : p
      );
      setPatients(updated);
      saveToLocalStorage(updated);
    }
  }, [activeView, patients, isBackendOnline]);

  const markChatRead = useCallback(async (patientId: string) => {
    try {
      if (isBackendOnline) {
        await fetch(`${API_BASE}/patients/${patientId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hasUnreadAlert: false })
        });
      }
    } catch (err) {
      // Fail silently
    } finally {
      const updated = patients.map(p => p.id === patientId ? { ...p, hasUnreadAlert: false } : p);
      setPatients(updated);
      saveToLocalStorage(updated);
    }
  }, [patients, isBackendOnline]);

  const updatePatientStatus = useCallback(async (id: string, newStatus: PatientStatus) => {
    const patient = patients.find(p => p.id === id);
    if (!patient || patient.status === newStatus) return;

    const updates: any = { status: newStatus };
    if (newStatus === PatientStatus.COMPLETED) updates.outTime = Date.now();
    if (newStatus === PatientStatus.WAITING || newStatus === PatientStatus.OPD) updates.outTime = null;

    try {
      if (isBackendOnline) {
        await fetch(`${API_BASE}/patients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      }
    } catch (err) {
      console.error("API status update failed, saving locally.");
    } finally {
      const updated = patients.map(p => p.id === id ? { ...p, ...updates } : p);
      setPatients(updated);
      saveToLocalStorage(updated);
      if (activeConsultationId === id && newStatus !== PatientStatus.OPD) {
        setActiveConsultationId(null);
      }
    }
  }, [patients, activeConsultationId, isBackendOnline]);

  const deletePatient = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to remove this record?")) return;
    try {
      if (isBackendOnline) {
        await fetch(`${API_BASE}/patients/${id}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.error("API delete failed, removing locally.");
    } finally {
      const updated = patients.filter(p => p.id !== id);
      setPatients(updated);
      saveToLocalStorage(updated);
      if (activeConsultationId === id) setActiveConsultationId(null);
      if (activeChatPatientId === id) setActiveChatPatientId(null);
    }
  }, [patients, activeConsultationId, activeChatPatientId, isBackendOnline]);

  const handleSaveConsultation = useCallback(async (id: string, notes: string, medicines: string) => {
    const updates = { notes, medicines, status: PatientStatus.COMPLETED, outTime: Date.now() };
    try {
      if (isBackendOnline) {
        await fetch(`${API_BASE}/patients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      }
    } catch (err) {
      console.error("API finalize failed, saving locally.");
    } finally {
      const updated = patients.map(p => p.id === id ? { ...p, ...updates } : p);
      setPatients(updated);
      saveToLocalStorage(updated);
      setActiveConsultationId(null);
    }
  }, [patients, isBackendOnline]);

  const movePatient = useCallback((id: string, direction: 'up' | 'down') => {
    setPatients(prev => {
      const patient = prev.find(p => p.id === id);
      if (!patient || patient.status === PatientStatus.COMPLETED) return prev;
      const statusPatients = prev.filter(p => p.status === patient.status);
      const index = statusPatients.findIndex(p => p.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === statusPatients.length - 1) return prev;
      const targetPatient = statusPatients[direction === 'up' ? index - 1 : index + 1];
      const masterIdx = prev.findIndex(p => p.id === id);
      const targetMasterIdx = prev.findIndex(p => p.id === targetPatient.id);
      const newPatients = [...prev];
      [newPatients[masterIdx], newPatients[targetMasterIdx]] = [newPatients[targetMasterIdx], newPatients[masterIdx]];
      saveToLocalStorage(newPatients);
      return newPatients;
    });
  }, []);

  const handleReorder = useCallback((sourceId: string, targetId: string) => {
    setPatients(prev => {
      const sourceIdx = prev.findIndex(p => p.id === sourceId);
      const targetIdx = prev.findIndex(p => p.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      const sourcePatient = prev[sourceIdx];
      if (sourcePatient.status === PatientStatus.COMPLETED) return prev;
      const newPatients = [...prev];
      const [removed] = newPatients.splice(sourceIdx, 1);
      const newTargetIdx = newPatients.findIndex(p => p.id === targetId);
      newPatients.splice(newTargetIdx, 0, removed);
      saveToLocalStorage(newPatients);
      return newPatients;
    });
  }, []);

  const waitingPatients = useMemo(() => {
    const filtered = patients.filter(p => p.status === PatientStatus.WAITING);
    return [...filtered].sort((a, b) => {
      const aPinned = a.type === PatientType.FAMILY || a.type === PatientType.RELATIVE;
      const bPinned = b.type === PatientType.FAMILY || b.type === PatientType.RELATIVE;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [patients]);

  const opdPatients = useMemo(() => patients.filter(p => p.status === PatientStatus.OPD), [patients]);
  const completedPatients = useMemo(() => 
    patients
      .filter(p => p.status === PatientStatus.COMPLETED)
      .sort((a, b) => (b.outTime || 0) - (a.outTime || 0)), 
    [patients]
  );

  const activePatientCount = useMemo(() => {
    return patients.filter(p => p.category === PatientCategory.PATIENT && p.status !== PatientStatus.COMPLETED).length;
  }, [patients]);

  const handleEditPatient = (p: Patient) => setEditingPatient(p);
  const handleDoctorClick = (id: string) => setActiveConsultationId(id);
  const openChat = useCallback((id: string) => {
    setActiveChatPatientId(id);
    markChatRead(id);
  }, [markChatRead]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-indigo-700 text-white flex-col gap-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-sm">Synchronizing Clinic Data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 font-sans overflow-hidden">
      <header className="bg-indigo-700 text-white p-4 shadow-lg flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Icons.Stethoscope /> ClinicFlow
          </h1>
          <div className="flex bg-indigo-900/50 p-1 rounded-lg border border-indigo-400/30">
            <button 
              onClick={() => setActiveView('OPERATOR')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeView === 'OPERATOR' ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-200 hover:text-white'}`}
            >
              Operator
            </button>
            <button 
              onClick={() => setActiveView('DOCTOR')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeView === 'DOCTOR' ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-200 hover:text-white'}`}
            >
              Doctor
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-black bg-indigo-900/40 px-3 py-1.5 rounded-full border border-indigo-400/20 uppercase tracking-widest">
            ACTIVE PATIENTS: {activePatientCount}
          </div>
        </div>
      </header>

      <main className="flex flex-col md:flex-row flex-1 p-4 gap-4 overflow-hidden">
        <section className="w-full md:w-1/4 h-full">
          <QueueColumn 
            title="Waiting Queue" 
            patients={waitingPatients}
            onUpdateStatus={updatePatientStatus}
            onDelete={activeView === 'OPERATOR' ? deletePatient : undefined}
            onEdit={activeView === 'OPERATOR' ? handleEditPatient : undefined}
            onMove={movePatient}
            onReorder={handleReorder}
            onOpenChat={openChat}
            status={PatientStatus.WAITING}
            colorClass="border-blue-400 bg-blue-50/50"
            headerColor="bg-blue-600"
            isSortable
          />
        </section>

        <section className="w-full md:w-1/2 flex flex-col gap-4 h-full">
          <div className="h-[30%] min-h-[200px]">
            <QueueColumn 
              title="OPD (Consultation)" 
              patients={opdPatients}
              onUpdateStatus={updatePatientStatus}
              onDelete={activeView === 'OPERATOR' ? deletePatient : undefined}
              onEdit={activeView === 'OPERATOR' ? handleEditPatient : undefined}
              onReorder={handleReorder}
              onOpenChat={openChat}
              status={PatientStatus.OPD}
              colorClass="border-amber-400 bg-amber-50/50"
              headerColor="bg-amber-600"
              onCardClick={activeView === 'DOCTOR' ? handleDoctorClick : undefined}
              activeCardId={activeConsultationId || undefined}
              isLarge={activeView === 'DOCTOR'}
            />
          </div>
          
          <div className="flex-1 bg-white rounded-xl shadow-md border border-slate-200 overflow-y-auto flex flex-col">
            <div className="bg-slate-700 text-white p-3 rounded-t-xl font-bold flex items-center justify-between">
              <div className="flex items-center gap-2 uppercase tracking-wide text-xs">
                {activeView === 'OPERATOR' ? (
                  <><Icons.Plus /> {editingPatient ? 'Edit Entry' : 'New Registration'}</>
                ) : (
                  <><Icons.Stethoscope /> Consultation Desk</>
                )}
              </div>
              {activeView === 'OPERATOR' && editingPatient && (
                <button onClick={() => setEditingPatient(null)} className="text-[10px] bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded">Cancel Edit</button>
              )}
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              {activeView === 'OPERATOR' ? (
                <PatientForm 
                  onSubmit={editingPatient ? (data) => updatePatient(editingPatient.id, data) : addPatient} 
                  initialData={editingPatient || undefined}
                  isEditing={!!editingPatient}
                />
              ) : (
                <DoctorConsultationForm 
                  patient={patients.find(p => p.id === activeConsultationId)}
                  onSave={handleSaveConsultation}
                  onOpenChat={openChat}
                />
              )}
            </div>
          </div>
        </section>

        <section className="w-full md:w-1/4 h-full">
          <QueueColumn 
            title="Completed OPD" 
            patients={completedPatients}
            onUpdateStatus={updatePatientStatus}
            onDelete={activeView === 'OPERATOR' ? deletePatient : undefined}
            onOpenChat={openChat}
            status={PatientStatus.COMPLETED}
            colorClass="border-emerald-400 bg-emerald-50/50"
            headerColor="bg-emerald-600"
          />
        </section>
      </main>

      {activeChatPatientId && (
        <ChatModal 
          patient={patients.find(p => p.id === activeChatPatientId)!}
          currentView={activeView}
          onSendMessage={addMessage}
          onClose={() => setActiveChatPatientId(null)}
        />
      )}

      <footer className="bg-slate-200 text-slate-500 text-[10px] px-4 py-1 flex justify-between border-t border-slate-300">
        <div className="flex gap-4">
          <span>Database: <strong className={isBackendOnline ? "text-emerald-600 uppercase" : "text-amber-600 uppercase"}>
            {isBackendOnline ? 'POSTGRES CONNECTED' : 'OFFLINE (LOCAL STORAGE)'}
          </strong></span>
          <span>System Time: {new Date().toLocaleTimeString()}</span>
        </div>
        <span>ClinicFlow Full-Stack Edition</span>
      </footer>
    </div>
  );
};

export default App;
