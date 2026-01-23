
import React, { useState, useCallback, useMemo } from 'react';
import { Patient, PatientStatus, PatientFormData, AppView, ChatMessage } from './types';
import QueueColumn from './components/QueueColumn';
import PatientForm from './components/PatientForm';
import DoctorConsultationForm from './components/DoctorConsultationForm';
import ChatModal from './components/ChatModal';
import { Icons } from './constants';

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [nextQueueId, setNextQueueId] = useState(1);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [activeView, setActiveView] = useState<AppView>('OPERATOR');
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);
  const [activeChatPatientId, setActiveChatPatientId] = useState<string | null>(null);

  const addPatient = useCallback((formData: PatientFormData) => {
    const isVisitor = formData.isVisitor;
    const now = Date.now();
    const newPatient: Patient = {
      ...formData,
      id: crypto.randomUUID(),
      queueId: isVisitor ? 0 : nextQueueId,
      status: PatientStatus.WAITING,
      createdAt: now,
      inTime: now, // Record initial entry time
      messages: [],
      hasUnreadAlert: false,
    };
    setPatients(prev => [...prev, newPatient]);
    if (!isVisitor) {
      setNextQueueId(prev => prev + 1);
    }
  }, [nextQueueId]);

  const updatePatient = useCallback((id: string, formData: Partial<Patient>) => {
    setPatients(prev => prev.map(p => 
      p.id === id ? { ...p, ...formData } : p
    ));
    setEditingPatient(null);
  }, []);

  const addMessage = useCallback((patientId: string, text: string) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text,
      sender: activeView,
      timestamp: Date.now(),
    };
    setPatients(prev => prev.map(p => 
      p.id === patientId ? { 
        ...p, 
        messages: [...p.messages, newMessage],
        hasUnreadAlert: true 
      } : p
    ));
  }, [activeView]);

  const markChatRead = useCallback((patientId: string) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId ? { ...p, hasUnreadAlert: false } : p
    ));
  }, []);

  const updatePatientStatus = useCallback((id: string, newStatus: PatientStatus) => {
    setPatients(prev => {
      const index = prev.findIndex(p => p.id === id);
      if (index === -1) return prev;
      
      const newPatients = [...prev];
      const [patient] = newPatients.splice(index, 1);
      
      const now = Date.now();
      const updates: Partial<Patient> = { 
        status: newStatus 
      };

      // Set Out Time when moving to COMPLETED
      if (newStatus === PatientStatus.COMPLETED) {
        updates.outTime = now;
      }
      
      // Reset outTime if moved back to active states
      if (newStatus === PatientStatus.WAITING || newStatus === PatientStatus.OPD) {
        updates.outTime = undefined;
      }

      return [...newPatients, { ...patient, ...updates }];
    });

    if (activeConsultationId === id && newStatus !== PatientStatus.OPD) {
      setActiveConsultationId(null);
    }
  }, [activeConsultationId]);

  const deletePatient = useCallback((id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    if (activeConsultationId === id) setActiveConsultationId(null);
    if (activeChatPatientId === id) setActiveChatPatientId(null);
  }, [activeConsultationId, activeChatPatientId]);

  const movePatient = useCallback((id: string, direction: 'up' | 'down') => {
    setPatients(prev => {
      const patient = prev.find(p => p.id === id);
      if (!patient) return prev;
      
      const statusPatients = prev.filter(p => p.status === patient.status);
      const index = statusPatients.findIndex(p => p.id === id);
      
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === statusPatients.length - 1) return prev;

      const targetPatient = statusPatients[direction === 'up' ? index - 1 : index + 1];
      
      // Check visitor constraint
      if (direction === 'up' && !patient.isVisitor && targetPatient.isVisitor) return prev;
      if (direction === 'down' && patient.isVisitor && !targetPatient.isVisitor) return prev;

      // Swap in master array
      const masterIdx = prev.findIndex(p => p.id === id);
      const targetMasterIdx = prev.findIndex(p => p.id === targetPatient.id);
      
      const newPatients = [...prev];
      [newPatients[masterIdx], newPatients[targetMasterIdx]] = [newPatients[targetMasterIdx], newPatients[masterIdx]];
      
      return newPatients;
    });
  }, []);

  const handleReorder = useCallback((sourceId: string, targetId: string) => {
    setPatients(prev => {
      const sourceIdx = prev.findIndex(p => p.id === sourceId);
      const targetIdx = prev.findIndex(p => p.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const sourcePatient = prev[sourceIdx];
      const targetPatient = prev[targetIdx];

      // Enforce visitor-on-top constraint within the same status
      if (sourcePatient.status === targetPatient.status) {
        if (!sourcePatient.isVisitor && targetPatient.isVisitor) return prev; 
        if (sourcePatient.isVisitor && !targetPatient.isVisitor) return prev;
      }

      const newPatients = [...prev];
      const [removed] = newPatients.splice(sourceIdx, 1);
      
      // Find new position of target after removal
      const newTargetIdx = newPatients.findIndex(p => p.id === targetId);
      
      const updates: Partial<Patient> = { status: targetPatient.status };
      if (targetPatient.status === PatientStatus.COMPLETED) {
        updates.outTime = Date.now();
      } else {
        updates.outTime = undefined;
      }

      newPatients.splice(newTargetIdx, 0, { ...removed, ...updates });
      
      return newPatients;
    });
  }, []);

  const handleSaveConsultation = useCallback((id: string, notes: string, medicines: string) => {
    setPatients(prev => prev.map(p => 
      p.id === id ? { ...p, notes, medicines, status: PatientStatus.COMPLETED, outTime: Date.now() } : p
    ));
    setActiveConsultationId(null);
  }, []);

  const waitingPatients = useMemo(() => {
    const filtered = patients.filter(p => p.status === PatientStatus.WAITING);
    // Sort primarily by isVisitor, then preserve array index order for stability
    return [...filtered].sort((a, b) => {
      if (a.isVisitor && !b.isVisitor) return -1;
      if (!a.isVisitor && b.isVisitor) return 1;
      return 0; // Native sort is stable, but manual logic in handleReorder handles the rest
    });
  }, [patients]);

  const opdPatients = useMemo(() => patients.filter(p => p.status === PatientStatus.OPD), [patients]);
  const completedPatients = useMemo(() => patients.filter(p => p.status === PatientStatus.COMPLETED).sort((a, b) => b.createdAt - a.createdAt), [patients]);

  const activePatient = useMemo(() => 
    patients.find(p => p.id === activeConsultationId), 
    [patients, activeConsultationId]
  );

  const activeChatPatient = useMemo(() => 
    patients.find(p => p.id === activeChatPatientId),
    [patients, activeChatPatientId]
  );

  const activePatientCount = useMemo(() => {
    return waitingPatients.filter(p => !p.isVisitor).length + opdPatients.filter(p => !p.isVisitor).length;
  }, [waitingPatients, opdPatients]);

  const handleEditPatient = (p: Patient) => {
    setEditingPatient(p);
  };

  const handleDoctorClick = (id: string) => {
    setActiveConsultationId(id);
  };

  const openChat = useCallback((id: string) => {
    setActiveChatPatientId(id);
    markChatRead(id);
  }, [markChatRead]);

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
              Operator View
            </button>
            <button 
              onClick={() => setActiveView('DOCTOR')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeView === 'DOCTOR' ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-200 hover:text-white'}`}
            >
              Doctor View
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-medium bg-indigo-600/50 px-3 py-1.5 rounded-full border border-indigo-400/30">
            Active Patients: {activePatientCount}
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
          <div className="h-[30%] min-h-[220px]">
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
              <div className="flex items-center gap-2 uppercase tracking-wide">
                {activeView === 'OPERATOR' ? (
                  <><Icons.Plus /> {editingPatient ? 'Edit Patient Details' : 'Registration Area'}</>
                ) : (
                  <><Icons.Stethoscope /> Patient Consultation Form</>
                )}
              </div>
              {activeView === 'OPERATOR' && editingPatient && (
                <button onClick={() => setEditingPatient(null)} className="text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded">Cancel Edit</button>
              )}
            </div>
            <div className="p-6 flex-1">
              {activeView === 'OPERATOR' ? (
                <PatientForm 
                  onSubmit={editingPatient ? (data) => updatePatient(editingPatient.id, data) : addPatient} 
                  initialData={editingPatient || undefined}
                  isEditing={!!editingPatient}
                />
              ) : (
                <DoctorConsultationForm 
                  patient={activePatient}
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

      {/* Chat Popup / Modal */}
      {activeChatPatient && (
        <ChatModal 
          patient={activeChatPatient}
          currentView={activeView}
          onSendMessage={addMessage}
          onClose={() => setActiveChatPatientId(null)}
        />
      )}

      <footer className="bg-slate-200 text-slate-500 text-[10px] px-4 py-1 flex justify-between border-t border-slate-300">
        <span>Mode: <strong className="text-indigo-600">{activeView}</strong></span>
        <span>ClinicFlow Management Suite</span>
      </footer>
    </div>
  );
};

export default App;
