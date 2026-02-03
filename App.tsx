import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Patient, PatientStatus, PatientFormData, AppView, ChatMessage, PatientCategory, PatientType } from './types';
import QueueColumn from './components/QueueColumn';
import PatientForm from './components/PatientForm';
import DoctorConsultationForm from './components/DoctorConsultationForm';
import ChatModal from './components/ChatModal';
import Login from './components/Login';
import PatientReport from './components/PatientReport';
import Calendar from './components/Calendar';
import { Icons } from './constants';

const API_BASE = '/api';
const LOCAL_STORAGE_KEY = 'clinicflow_patients_fallback';

type PageView = 'DASHBOARD' | 'REPORT' | 'CALENDAR';

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [nextQueueId, setNextQueueId] = useState(1);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [activeView, setActiveView] = useState<AppView>(() => {
    const saved = localStorage.getItem('clinicflow_activeView');
    return (saved === 'OPERATOR' || saved === 'DOCTOR') ? saved : 'LOGIN';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('clinicflow_isLoggedIn') === 'true';
  });
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);
  const [activeChatPatientId, setActiveChatPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageView>('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDoctorCallAlert, setShowDoctorCallAlert] = useState(false);
  const [isCallingOperator, setIsCallingOperator] = useState(false);
  const [callOperatorSuccess, setCallOperatorSuccess] = useState(false);
  const [hasEventsToday, setHasEventsToday] = useState(false);
  const [opdStatus, setOpdStatus] = useState<{isPaused: boolean; pauseReason: string}>({ isPaused: false, pauseReason: '' });
  const [opdStatusOptions, setOpdStatusOptions] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const alertSoundRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play alert sound using Web Audio API
  const playAlertSound = useCallback(() => {
    try {
      // Create AudioContext if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (required by browsers)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // Create oscillator for a pleasant two-tone alert
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        // Smooth envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play a pleasant chime pattern (3 ascending tones)
      playTone(523.25, now, 0.15);        // C5
      playTone(659.25, now + 0.15, 0.15); // E5
      playTone(783.99, now + 0.30, 0.25); // G5
      
      // Repeat the pattern after a short pause
      playTone(523.25, now + 0.7, 0.15);  // C5
      playTone(659.25, now + 0.85, 0.15); // E5
      playTone(783.99, now + 1.0, 0.25);  // G5

    } catch (e) {
      console.log('Web Audio API not supported, trying fallback audio');
      // Fallback to HTML audio element
      if (alertSoundRef.current) {
        alertSoundRef.current.currentTime = 0;
        alertSoundRef.current.play().catch(err => console.log('Audio play failed:', err));
      }
    }
  }, []);

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

  // Check if there are any events for today
  const checkTodayEvents = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const res = await fetch(`${API_BASE}/events?year=${year}&month=${month}`);
      if (res.ok) {
        const events = await res.json();
        const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayEvents = events.filter((e: any) => e.eventDate === todayStr);
        setHasEventsToday(todayEvents.length > 0);
      }
    } catch (err) {
      console.warn("Could not check today's events", err);
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
        
        // Fetch OPD status options and current status
        try {
          const [optionsRes, statusRes] = await Promise.all([
            fetch(`${API_BASE}/opd-status-options`),
            fetch(`${API_BASE}/opd-status`)
          ]);
          if (optionsRes.ok) {
            const { options } = await optionsRes.json();
            setOpdStatusOptions(options || []);
          }
          if (statusRes.ok) {
            const status = await statusRes.json();
            setOpdStatus(status);
          }
        } catch (opdErr) {
          console.warn('Could not fetch OPD status:', opdErr);
        }
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

    socket.on('patient:reorder', () => {
      console.log('Socket: patient reordered, refreshing...');
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

    // Doctor calls operator - show alert only for OPERATOR users
    socket.on('doctor:call-operator', () => {
      console.log('Socket: Doctor is calling operator!');
      // Only show alert if user is logged in as OPERATOR
      setShowDoctorCallAlert(true);
      // Play notification sound using Web Audio API
      playAlertSound();
    });

    // Event calendar updates - refresh today's events indicator
    socket.on('event:add', () => {
      console.log('Socket: event added, checking today events...');
      checkTodayEvents();
    });
    socket.on('event:update', () => {
      console.log('Socket: event updated, checking today events...');
      checkTodayEvents();
    });
    // OPD status change - sync across all clients
    socket.on('opd:status-change', (status: {isPaused: boolean; pauseReason: string}) => {
      console.log('Socket: OPD status changed:', status);
      setOpdStatus(status);
    });

    socket.on('event:delete', () => {
      console.log('Socket: event deleted, checking today events...');
      checkTodayEvents();
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
    
    if (newStatus === PatientStatus.OPD && opdStatus.isPaused) {
      console.log('Cannot move patient to OPD - OPD is paused');
      return;
    }

    const updates: any = { status: newStatus };
    if (newStatus === PatientStatus.COMPLETED) updates.outTime = Date.now();
    if (newStatus === PatientStatus.WAITING || newStatus === PatientStatus.OPD) updates.outTime = null;

    try {
      if (isBackendOnline) {
        // Use dedicated status endpoint for proper sort_order handling
        await fetch(`${API_BASE}/patients/${id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, outTime: updates.outTime })
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
  }, [patients, activeConsultationId, isBackendOnline, opdStatus.isPaused]);

  const reorderPatient = useCallback(async (id: string, direction: 'up' | 'down') => {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    
    // Cannot reorder FAMILY/RELATIVE types
    if (patient.type === PatientType.FAMILY || patient.type === PatientType.RELATIVE) return;
    
    try {
      if (isBackendOnline) {
        await fetch(`${API_BASE}/patients/${id}/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ direction })
        });
      }
    } catch (err) {
      console.error("Reorder failed:", err);
    }
  }, [patients, isBackendOnline]);

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

  // Doctor calls operator - sends alert via socket
  const callOperator = useCallback(async () => {
    if (isCallingOperator) return; // Prevent double-press during cooldown
    
    setIsCallingOperator(true);
    try {
      await fetch(`${API_BASE}/call-operator`, { method: 'POST' });
      console.log('Called operator successfully');
      
      // Show success flash
      setCallOperatorSuccess(true);
      setTimeout(() => setCallOperatorSuccess(false), 500);
    } catch (err) {
      console.error('Failed to call operator:', err);
    }
    
    // 2-second cooldown
    setTimeout(() => setIsCallingOperator(false), 2000);
  }, [isCallingOperator]);

  // Update OPD status (pause/resume)
  const updateOpdStatus = useCallback(async (isPaused: boolean, pauseReason: string) => {
    try {
      const res = await fetch(`${API_BASE}/opd-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused, pauseReason })
      });
      if (res.ok) {
        const status = await res.json();
        setOpdStatus({ isPaused: status.isPaused, pauseReason: status.pauseReason });
        console.log('OPD status updated:', status);
      }
    } catch (err) {
      console.error('Failed to update OPD status:', err);
    }
  }, []);

  const movePatient = useCallback((id: string, direction: 'up' | 'down') => {
    if (isBackendOnline) {
      // Call backend to update sort_order
      reorderPatient(id, direction);
    } else {
      // Local fallback when backend is offline
      setPatients(prev => {
        const patient = prev.find(p => p.id === id);
        if (!patient || patient.status !== PatientStatus.WAITING) return prev;
        // Skip FAMILY/RELATIVE types
        if (patient.type === PatientType.FAMILY || patient.type === PatientType.RELATIVE) return prev;
        
        const reorderablePatients = prev
          .filter(p => p.status === PatientStatus.WAITING && p.type !== PatientType.FAMILY && p.type !== PatientType.RELATIVE)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        
        const index = reorderablePatients.findIndex(p => p.id === id);
        if (index === -1) return prev;
        if (direction === 'up' && index === 0) return prev;
        if (direction === 'down' && index === reorderablePatients.length - 1) return prev;
        
        // Swap sort orders
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const targetPatient = reorderablePatients[targetIndex];
        
        const newPatients = prev.map(p => {
          if (p.id === id) return { ...p, sortOrder: targetPatient.sortOrder };
          if (p.id === targetPatient.id) return { ...p, sortOrder: patient.sortOrder };
          return p;
        });
        
        saveToLocalStorage(newPatients);
        return newPatients;
      });
    }
  }, [reorderPatient, isBackendOnline]);

  const handleReorder = useCallback(async (sourceId: string, targetId: string) => {
    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/api/patients/${sourceId}/move-to`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetId })
        });
        if (res.ok) {
          await refreshPatients();
        }
      } catch (err) {
        console.error('Drag-and-drop reorder failed:', err);
      }
    } else {
      // Local fallback
      setPatients(prev => {
        const sourceIdx = prev.findIndex(p => p.id === sourceId);
        const targetIdx = prev.findIndex(p => p.id === targetId);
        if (sourceIdx === -1 || targetIdx === -1) return prev;
        const sourcePatient = prev[sourceIdx];
        const targetPatient = prev[targetIdx];
        
        if (sourcePatient.status !== PatientStatus.WAITING) return prev;
        // Skip if source or target is FAMILY/RELATIVE
        if (sourcePatient.type === PatientType.FAMILY || sourcePatient.type === PatientType.RELATIVE) return prev;
        if (targetPatient.type === PatientType.FAMILY || targetPatient.type === PatientType.RELATIVE) return prev;
        
        // Swap sort orders for local reordering
        const newPatients = prev.map(p => {
          if (p.id === sourceId) return { ...p, sortOrder: targetPatient.sortOrder };
          if (p.id === targetId) return { ...p, sortOrder: sourcePatient.sortOrder };
          return p;
        });
        saveToLocalStorage(newPatients);
        return newPatients;
      });
    }
  }, [isBackendOnline, refreshPatients]);

  // Helper function to check if patient matches search term
  const matchesSearch = useCallback((p: Patient, term: string) => {
    if (!term.trim()) return true;
    const search = term.toLowerCase();
    return (
      p.name.toLowerCase().includes(search) ||
      (p.mobile && p.mobile.toLowerCase().includes(search)) ||
      (p.city && p.city.toLowerCase().includes(search))
    );
  }, []);

  const waitingPatients = useMemo(() => {
    const filtered = patients.filter(p => p.status === PatientStatus.WAITING && matchesSearch(p, searchTerm));
    return [...filtered].sort((a, b) => {
      const aPinned = a.type === PatientType.FAMILY || a.type === PatientType.RELATIVE;
      const bPinned = b.type === PatientType.FAMILY || b.type === PatientType.RELATIVE;
      // Pinned types (FAMILY/RELATIVE) always at top, sorted by creation time
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      if (aPinned && bPinned) return (a.createdAt || 0) - (b.createdAt || 0);
      // Non-pinned types sorted by sortOrder (lower = higher priority)
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
  }, [patients, searchTerm, matchesSearch]);

  // OPD queue: latest moved to OPD at top (by inTime or createdAt DESC)
  const opdPatients = useMemo(() => 
    patients
      .filter(p => p.status === PatientStatus.OPD && matchesSearch(p, searchTerm))
      .sort((a, b) => (b.inTime || b.createdAt || 0) - (a.inTime || a.createdAt || 0)), 
    [patients, searchTerm, matchesSearch]
  );
  const completedPatients = useMemo(() => {
    const toTimestamp = (val: any): number => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return new Date(val).getTime() || 0;
      return 0;
    };
    return patients
      .filter(p => p.status === PatientStatus.COMPLETED && matchesSearch(p, searchTerm))
      .sort((a, b) => {
        const aTime = toTimestamp(a.outTime) || toTimestamp(a.createdAt);
        const bTime = toTimestamp(b.outTime) || toTimestamp(b.createdAt);
        return bTime - aTime;
      });
  }, [patients, searchTerm, matchesSearch]);

  const handleEditPatient = (p: Patient) => setEditingPatient(p);
  const handleDoctorClick = (id: string) => setActiveConsultationId(id);
  const openChat = useCallback((id: string) => {
    setActiveChatPatientId(id);
    markChatRead(id);
  }, [markChatRead]);

  const handleLogin = (role: AppView) => {
    setActiveView(role);
    setIsLoggedIn(true);
    
    // Persist login state to localStorage
    localStorage.setItem('clinicflow_isLoggedIn', 'true');
    localStorage.setItem('clinicflow_activeView', role);
    
    // Check for today's events to show notification dot on Calendar menu
    checkTodayEvents();
    
    // Unlock AudioContext on user gesture (login click)
    // This ensures alert sounds can play later
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {
      console.log('AudioContext initialization failed:', e);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveView('LOGIN');
    setActiveConsultationId(null);
    
    // Clear persisted login state
    localStorage.removeItem('clinicflow_isLoggedIn');
    localStorage.removeItem('clinicflow_activeView');
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
              className={`px-3 py-1 rounded-md text-[12px] font-bold uppercase tracking-wide transition-all ${
                currentPage === 'DASHBOARD' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-indigo-100 hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('REPORT')}
              className={`px-3 py-1 rounded-md text-[12px] font-bold uppercase tracking-wide transition-all ${
                currentPage === 'REPORT' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-indigo-100 hover:bg-white/10'
              }`}
            >
              Patient Report
            </button>
            <button
              onClick={() => setCurrentPage('CALENDAR')}
              className={`px-3 py-1 rounded-md text-[12px] font-bold uppercase tracking-wide transition-all relative ${
                currentPage === 'CALENDAR' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-indigo-100 hover:bg-white/10'
              }`}
            >
              Calendar
              {hasEventsToday && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
            <button
              onClick={() => window.open('/display', '_blank')}
              className="px-3 py-1 rounded-md text-[12px] font-bold uppercase tracking-wide transition-all text-indigo-100 hover:bg-white/10 flex items-center gap-1"
              title="Open Queue Display for waiting room TV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Display
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* Global Search - Only on Dashboard */}
          {currentPage === 'DASHBOARD' && (
            <div className="relative flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-200/70 pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search name, mobile, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border border-indigo-400/30 rounded-lg px-3 py-1.5 pl-8 text-[11px] text-white placeholder-indigo-200/70 focus:outline-none focus:ring-2 focus:ring-white/30 w-52"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-200/70 hover:text-white"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
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
          {/* Call Operator Button - Only for DOCTOR */}
          {activeView === 'DOCTOR' && (
            <div className="relative group">
              <button
                onClick={callOperator}
                disabled={isCallingOperator}
                className={`
                  w-9 h-9 rounded-lg flex items-center justify-center
                  transition-all duration-200 shadow-lg
                  ${callOperatorSuccess 
                    ? 'bg-emerald-500 scale-110' 
                    : isCallingOperator 
                      ? 'bg-amber-400 cursor-not-allowed opacity-70' 
                      : 'bg-amber-500 hover:bg-amber-400 hover:scale-105 active:scale-95'
                  }
                `}
                style={{ animation: callOperatorSuccess ? 'pulse 0.3s ease-out' : 'none' }}
              >
                <Icons.Phone className="w-5 h-5 text-white" />
              </button>
              {/* Success notification - positioned below button */}
              {callOperatorSuccess && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-emerald-600 text-white text-xs rounded whitespace-nowrap z-50 animate-pulse">
                  Sent!
                </div>
              )}
              {/* Tooltip - positioned below button to avoid getting cut off at page top */}
              {!callOperatorSuccess && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {isCallingOperator ? 'Calling...' : 'Call Operator'}
                </div>
              )}
            </div>
          )}
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
                  isOpdColumn={true}
                  opdStatus={opdStatus}
                  opdStatusOptions={opdStatusOptions}
                  onOpdStatusChange={updateOpdStatus}
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
        ) : currentPage === 'REPORT' ? (
          <PatientReport apiBase={API_BASE} />
        ) : (
          <Calendar currentUser={activeView as 'OPERATOR' | 'DOCTOR'} isBackendOnline={isBackendOnline} />
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

      {/* Doctor Call Operator Alert - Only shows for OPERATOR */}
      {showDoctorCallAlert && activeView === 'OPERATOR' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-pulse">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center border-4 border-amber-400">
            <div className="bg-amber-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-amber-600 uppercase tracking-widest mb-3">Doctor Calling</h2>
            <p className="text-slate-600 mb-6">Doctor needs your assistance. Please go to the consultation room.</p>
            <button
              onClick={() => setShowDoctorCallAlert(false)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-black px-8 py-3 rounded-xl uppercase tracking-widest transition-all shadow-lg"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Notification sound for doctor call */}
      <audio ref={alertSoundRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVoGAACBhYqFbF1NQDI1MDQwNDY4Oj9ETFRbYWpzfYaOlp2lrbW9xc3V3ePq8fj/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACBhYqFbF1NQDI1MDQwNDY4Oj9ETFRbYWpzfYaOlp2lrbW9xc3V3ePq8fj/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACBhYqFbF1NQDI1MDQwNDY4Oj9ETFRbYWpzfYaOlp2lrbW9xc3V3ePq8fj/" type="audio/wav" />
      </audio>

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
