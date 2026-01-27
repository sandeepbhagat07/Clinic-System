
import React, { useState, useEffect } from 'react';
import { Patient, PatientCategory } from '../types';
import { Icons } from '../constants';

interface DoctorConsultationFormProps {
  patient?: Patient;
  onSave: (id: string, notes: string, medicines: string) => void;
  onOpenChat: (id: string) => void;
}

const DoctorConsultationForm: React.FC<DoctorConsultationFormProps> = ({ patient, onSave, onOpenChat }) => {
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState('');

  useEffect(() => {
    if (patient) {
      setNotes(patient.notes || '');
      setMedicines(patient.medicines || '');
    }
  }, [patient]);

  if (!patient) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
        <div className="bg-white p-6 rounded-full shadow-sm mb-6 opacity-30">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-xl font-black text-slate-800 uppercase tracking-widest">Station Idle</p>
        <p className="text-center mt-3 max-w-xs text-sm font-medium text-slate-500 leading-relaxed">Select a patient from the <span className="text-amber-600 font-bold uppercase">OPD Queue</span> to begin clinical documentation.</p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(patient.id, notes, medicines);
    setNotes('');
    setMedicines('');
  };

  const inputClasses = "w-full bg-white text-slate-900 border-2 border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base font-medium";

  return (
    <form onSubmit={handleSave} className="space-y-6 h-full flex flex-col">
      <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              {patient.category !== PatientCategory.VISITOR && (
                <span className="bg-indigo-900 text-white font-black px-2.5 py-1 rounded-lg text-[10px] shadow-sm tracking-widest flex items-center gap-0.5">
                  <span className="opacity-60">#</span>
                  <span>{patient.queueId}</span>
                </span>
              )}
              <h2 className="text-2xl font-black text-indigo-900 uppercase truncate tracking-tight">
                {patient.name}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-indigo-600/70 uppercase tracking-widest">
              <span>{patient.age} Yrs <span className="mx-1">•</span> {patient.gender} <span className="mx-1">•</span> {patient.type}</span>
              {patient.mobile && (
                <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-indigo-100 text-indigo-900 shadow-sm">
                  <Icons.Phone /> {patient.mobile}
                </span>
              )}
            </div>
          </div>
          <button 
            type="button"
            onClick={() => onOpenChat(patient.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold shadow-sm transition-all border-2 ${
              patient.hasUnreadAlert 
              ? 'bg-rose-600 text-white border-rose-500 animate-pulse' 
              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
            } text-xs uppercase tracking-widest`}
          >
            <Icons.Message /> {patient.hasUnreadAlert ? 'URGENT ALERT' : 'CHAT'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
            Clinical Observations
          </label>
          <textarea
            className={`${inputClasses} flex-1 resize-none placeholder:text-slate-300`}
            placeholder="Document symptoms, history, and observations..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
            Prescription Plan
          </label>
          <textarea
            className={`${inputClasses} flex-1 resize-none font-mono text-sm placeholder:text-slate-300 leading-relaxed`}
            placeholder="Rx: Medicine name, dosage, and instructions..."
            value={medicines}
            onChange={e => setMedicines(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 text-base uppercase tracking-[0.2em]"
      >
        <Icons.CheckCircle />
        Finalize Consultation
      </button>
    </form>
  );
};

export default DoctorConsultationForm;
