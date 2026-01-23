
import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
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
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="text-xl font-bold">No Active Consultation</p>
        <p className="text-center mt-2 max-w-xs">Select a patient from the <span className="text-amber-600 font-bold uppercase">OPD</span> column to start the examination.</p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(patient.id, notes, medicines);
    setNotes('');
    setMedicines('');
  };

  const inputClasses = "w-full bg-white text-slate-900 border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-base";

  return (
    <form onSubmit={handleSave} className="space-y-6 h-full flex flex-col">
      {/* Patient Header Info */}
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col gap-4 shadow-inner">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-indigo-900 uppercase">Patient: {patient.name}</h2>
            <p className="text-indigo-700 font-medium">{!patient.isVisitor ? `#${patient.queueId} • ` : ''}{patient.age} Yrs • {patient.gender} • {patient.category}</p>
          </div>
          <button 
            type="button"
            onClick={() => onOpenChat(patient.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-sm transition-all border ${
              patient.hasUnreadAlert 
              ? 'bg-rose-600 text-white border-rose-500 animate-pulse' 
              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            <Icons.Message /> {patient.hasUnreadAlert ? 'NEW ALERT' : 'Discussion'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Medical Notes */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
            Clinical Notes
          </label>
          <textarea
            className={`${inputClasses} flex-1 resize-none`}
            placeholder="Diagnosis, symptoms, patient history..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Medicines / Prescription */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
            Medicines
          </label>
          <textarea
            className={`${inputClasses} flex-1 resize-none font-mono text-sm`}
            placeholder="1. TAB Paracetamol 500mg (1-0-1)&#10;2. CAP Amoxicillin (1-1-1)..."
            value={medicines}
            onChange={e => setMedicines(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg uppercase tracking-wide"
      >
        <Icons.CheckCircle />
        Complete & Move to History
      </button>
    </form>
  );
};

export default DoctorConsultationForm;
