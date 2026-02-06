import React, { useState, useEffect } from 'react';

function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('clinicflow_authToken');
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

interface Visit {
  id: string;
  queueId: number;
  name: string;
  age: number;
  gender: string;
  category: string;
  type: string;
  city: string;
  mobile: string;
  status: string;
  createdAt: string;
  inTime: string | null;
  outTime: string | null;
  notes: string | null;
  medicines: string | null;
}

interface PatientInfo {
  id: number;
  name: string;
  age: number;
  gender: string;
  city: string;
  mobile: string;
  createdAt: string;
}

interface PatientHistoryData {
  patient: PatientInfo;
  visits: Visit[];
  totalVisits: number;
}

interface PatientHistoryModalProps {
  patientId: number;
  apiBase: string;
  onClose: () => void;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patientId, apiBase, onClose }) => {
  const [data, setData] = useState<PatientHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`${apiBase}/patients/${patientId}/history`);
        if (!res.ok) {
          throw new Error('Failed to fetch patient history');
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [patientId, apiBase]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '-';
    }
  };

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full uppercase">Completed</span>;
      case 'OPD':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full uppercase">OPD</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase">Waiting</span>;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-indigo-700 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div>
              <h3 className="font-black text-lg uppercase tracking-tight">Patient History</h3>
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Complete Visit Records</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="mt-2 font-medium">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Patient Info Card */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                    {data.patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xl text-slate-800 uppercase">{data.patient.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                      <span>{data.patient.age} yrs</span>
                      <span className="text-slate-300">|</span>
                      <span>{data.patient.gender}</span>
                      <span className="text-slate-300">|</span>
                      <span>{data.patient.city}</span>
                      <span className="text-slate-300">|</span>
                      <span>{data.patient.mobile || '-'}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                        {data.totalVisits} Previous Visit{data.totalVisits !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-slate-500">
                        First Visit: {formatDate(data.patient.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visits List */}
              <div className="p-4">
                <h5 className="font-bold text-sm text-slate-700 uppercase tracking-wide mb-3">Previous Visits</h5>
                {data.visits.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No previous visits found</p>
                ) : (
                  <div className="space-y-3">
                    {data.visits.map((visit, index) => (
                      <div 
                        key={visit.id} 
                        className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="bg-gray-200 text-gray-900 font-black px-2 py-0.5 rounded-full text-sm">
                              #{visit.queueId}
                            </span>
                            <span className="font-semibold text-slate-800">{formatDate(visit.createdAt)}</span>
                            <span className="text-slate-500 text-sm">{formatTime(visit.inTime)}</span>
                          </div>
                          {getStatusBadge(visit.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{visit.category}</span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{visit.type}</span>
                        </div>

                        {visit.notes && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Doctor Notes</p>
                            <p className="text-sm text-amber-900 whitespace-pre-wrap">{visit.notes}</p>
                          </div>
                        )}

                        {visit.medicines && (
                          <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">Medicines</p>
                            <p className="text-sm text-emerald-900 whitespace-pre-wrap">{visit.medicines}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryModal;
