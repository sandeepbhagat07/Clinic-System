import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Patient, PatientStatus, PatientFormData, AppView, ChatMessage, PatientCategory, PatientType } from './types';
import QueueColumn from './components/QueueColumn';
import PatientForm from './components/PatientForm';
import DoctorConsultationForm from './components/DoctorConsultationForm';
import ChatModal from './components/ChatModal';
import Login from './components/Login';
import PatientReport from './components/PatientReport';
import { Icons } from './constants';

const API_BASE = '/api';
const LOCAL_STORAGE_KEY = 'clinicflow_patients_fallback';

type PageView = 'DASHBOARD' | 'REPORT';

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [nextQueueId, setNextQueueId] = useState(1);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [activeView, setActiveView] = useState<AppView>('LOGIN');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);
  const [activeChatPatientId, setActiveChatPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageView>('DASHBOARD');
  const socketRef = useRef<Socket | null>(null);

  // Persistence Helper
  const saveToLocalStorage = (data: Patient[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

  // Fetch next queue ID from server (for today)
  const fetchNextQueueId = async () => {
    try {
      const res = await fetch(`${API_BASE}/next-queue-id`);
      if (res.ok) {
        const data = await res.json();
        setNextQueueId(data.nextQueueId);
      }
    } catch (err) {
      console.warn("Could not fetch next queue ID", err);
    }
  };

  // Initial Fetch: Try Backend -> Fallback to LocalStorage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/patients?t=${Date.now()}`);
        if (!res.ok) throw new Error('Backend responded with error');
        
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid data format');
        
        setPatients(data);
        setIsBackendOnline(true);
        
        // Fetch next queue ID for today from server
        await fetchNextQueueId();
      } catch (err) {
        console.warn("Backend unreachable. Falling back to local storage.", err);
        setIsBackendOnline(false);
        
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          // Filter to today's patients only for local storage fallback
          const today = new Date().toDateString();
          const todayPatients = parsed.filter((p: Patient) => 
            new Date(p.createdAt).toDateString() === today
          );
          setPatients(todayPatients);
          const patientEntries = todayPatients.filter((p: Patient) => p.category === PatientCategory.PATIENT);
          const maxId = patientEntries.length > 0 ? Math.max(...patientEntries.map((p: Patient) => p.queueId)) : 0;
          setNextQueueId(maxId + 1);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Socket.IO connection for real-time sync
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('patient:add', () => {
      console.log('Socket: patient added, refreshing...');
      refreshPatients();
    });

    socket.on('patient:update', () => {
      console.log('Socket: patient updated, refreshing...');
      refreshPatients();
    });

    socket.on('patient:delete', () => {
      console.log('Socket: patient deleted, refreshing...');
      refreshPatients();
    });

    socket.on('message:new', ({ patientId, message }) => {
      console.log('Socket: new message for patient', patientId);
      setPatients(prev => prev.map(p => {
        if (p.id !== patientId) return p;
        const messageExists = p.messages.some(m => m.id === message.id);
        if (messageExists) return p;
        return { 
          ...p, 
          messages: [...p.messages, message],
          hasUnreadAlert: true 
        };
      }));
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Refresh patients from server
  const refreshPatients = async () => {
    try {
      const res = await fetch(`${API_BASE}/patients?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.warn('Failed to refresh patients:', err);
    }
  };

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
        const res = await fetch(`${API_BASE}/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPatient)
        });
        const responseData = await res.json();
        if (!res.ok) {
          throw new Error(responseData.error || 'Failed to save to database');
        }
        // Get the server-assigned queue ID
        if (responseData.queueId) {
          newPatient.queueId = responseData.queueId;
        }
      }
    } catch (err) {
      console.error("API call failed, saving locally only.", err);
    } finally {
      const updated = [...patients, newPatient];
      setPatients(updated);
      saveToLocalStorage(updated);
      // Fetch updated next queue ID from server
      if (isBackendOnline && !isVisitor) {
        fetchNextQueueId();
      } else if (!isVisitor) {
        setNextQueueId(prev => prev + 1);
      }
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

  const handleEditPatient = (p: Patient) => setEditingPatient(p);
  const handleDoctorClick = (id: string) => setActiveConsultationId(id);
  const openChat = useCallback((id: string) => {
    setActiveChatPatientId(id);
    markChatRead(id);
  }, [markChatRead]);

  const handleLogin = (role: AppView) => {
    setActiveView(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveView('LOGIN');
    setActiveConsultationId(null);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-indigo-700 text-white flex-col gap-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-sm">Synchronizing Clinic Data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] font-sans overflow-hidden">
      <header className="bg-[#4338ca] text-white p-3 px-4 shadow-md flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Icons.Stethoscope className="w-5 h-5" /> ClinicFlow
          </h1>
          <div className="text-[10px] font-black bg-[#1e1b4b]/50 px-2.5 py-1 rounded-lg border border-indigo-400/30 uppercase tracking-widest text-indigo-100">
            {activeView} PANEL
          </div>
          {/* Navigation Menu */}
          <nav className="flex items-center gap-1 bg-[#1e1b4b]/30 rounded-lg p-1 border border-indigo-400/20">
            <button
              onClick={() => setCurrentPage('DASHBOARD')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${
                currentPage === 'DASHBOARD' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-indigo-100 hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('REPORT')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${
                currentPage === 'REPORT' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-indigo-100 hover:bg-white/10'
              }`}
            >
              Patient Report
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* Compact Stats Badge */}
          <div className="flex items-center gap-3 bg-[#1e1b4b]/40 px-3 py-1.5 rounded-full border border-indigo-400/20">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-bold text-white uppercase tracking-wide">{patients.filter(p => p.category === PatientCategory.PATIENT).length} PATIENTS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span className="text-[11px] font-bold text-white uppercase tracking-wide">{patients.filter(p => p.category === PatientCategory.VISITOR).length} VISITOR</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-[#e11d48] hover:bg-[#be123c] text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex flex-1 p-3 gap-3 overflow-hidden">
        {currentPage === 'DASHBOARD' ? (
          <>
            {/* LEFT COLUMN: WAITING QUEUE */}
            <section className="w-1/4 h-full">
              <QueueColumn 
                title="WAITING QUEUE" 
                patients={waitingPatients}
                onUpdateStatus={updatePatientStatus}
                onDelete={activeView === 'OPERATOR' ? deletePatient : undefined}
                onEdit={activeView === 'OPERATOR' ? handleEditPatient : undefined}
                onMove={movePatient}
                onReorder={handleReorder}
                onOpenChat={openChat}
                status={PatientStatus.WAITING}
                colorClass="bg-[#f0f9ff] border-[#bae6fd]"
                headerColor="bg-[#2563eb]"
                isSortable
                activeView={activeView}
              />
            </section>

            {/* CENTER COLUMN: OPD QUEUE + FORM */}
            <section className="w-1/2 flex flex-col gap-3 h-full">
              {/* TOP: OPD QUEUE */}
              <div className="h-1/3 min-h-[180px]">
                <QueueColumn 
                  title="OPD (CONSULTATION)" 
                  patients={opdPatients}
                  onUpdateStatus={updatePatientStatus}
                  onDelete={activeView === 'OPERATOR' ? deletePatient : undefined}
                  onEdit={activeView === 'OPERATOR' ? handleEditPatient : undefined}
                  onReorder={handleReorder}
                  onOpenChat={openChat}
                  status={PatientStatus.OPD}
                  colorClass="bg-[#fffbeb] border-[#fde68a]"
                  headerColor="bg-[#d97706]"
                  onCardClick={activeView === 'DOCTOR' ? handleDoctorClick : undefined}
                  activeCardId={activeConsultationId || undefined}
                  isLarge={activeView === 'DOCTOR'}
                  activeView={activeView}
                />
              </div>
              
              {/* BOTTOM: FORM */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden flex flex-col">
                <div className="bg-[#334155] text-white p-2.5 px-4 font-bold flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 uppercase tracking-wide text-[11px]">
                    {activeView === 'OPERATOR' ? (
                      <><Icons.Plus className="w-4 h-4" /> {editingPatient ? 'Edit Entry' : 'NEW REGISTRATION FORM'}</>
                    ) : (
                      <><Icons.Stethoscope className="w-4 h-4" /> OPD (CONSULTATION) FORM</>
                    )}
                  </div>
                  {activeView === 'OPERATOR' && editingPatient && (
                    <button 
                      onClick={() => setEditingPatient(null)} 
                      className="text-[9px] bg-[#475569] hover:bg-[#64748b] px-2 py-0.5 rounded uppercase font-bold"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
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

            {/* RIGHT COLUMN: COMPLETED OPD */}
            <section className="w-1/4 h-full">
              <QueueColumn 
                title="COMPLETED OPD" 
                patients={completedPatients}
                onUpdateStatus={updatePatientStatus}
                onDelete={activeView === 'OPERATOR' ? deletePatient : undefined}
                onOpenChat={openChat}
                status={PatientStatus.COMPLETED}
                colorClass="bg-[#f0fdf4] border-[#bbf7d0]"
                headerColor="bg-[#059669]"
                activeView={activeView}
              />
            </section>
          </>
        ) : (
          <PatientReport apiBase={API_BASE} />
        )}
      </main>

      {activeChatPatientId && (
        <ChatModal 
          patient={patients.find(p => p.id === activeChatPatientId)!}
          currentView={activeView}
          onSendMessage={addMessage}
          onClose={() => setActiveChatPatientId(null)}
        />
      )}

      <footer className="bg-[#f1f5f9] text-[#64748b] text-[9px] px-4 py-1 flex justify-between border-t border-[#e2e8f0] shrink-0">
        <div className="flex gap-4">
          <span>Database: <strong className={isBackendOnline ? "text-[#059669] uppercase" : "text-[#d97706] uppercase"}>
            {isBackendOnline ? 'POSTGRES CONNECTED' : 'OFFLINE (LOCAL STORAGE)'}
          </strong></span>
          <span>System Time: {new Date().toLocaleTimeString()}</span>
        </div>
        <span className="font-medium">ClinicFlow Management v2.0</span>
      </footer>
    </div>
  );
};

export default App;
