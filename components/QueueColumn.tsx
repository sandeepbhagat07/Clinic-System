
import React, { useMemo, useState } from 'react';
import { Patient, PatientStatus } from '../types';
import PatientCard from './PatientCard';

interface QueueColumnProps {
  title: string;
  patients: Patient[];
  onUpdateStatus: (id: string, newStatus: PatientStatus) => void;
  onDelete?: (id: string) => void;
  onEdit?: (patient: Patient) => void;
  onMove?: (id: string, direction: 'up' | 'down') => void;
  onReorder?: (sourceId: string, targetId: string) => void;
  onCardClick?: (id: string) => void;
  onOpenChat?: (id: string) => void;
  activeCardId?: string;
  status: PatientStatus;
  colorClass: string;
  headerColor: string;
  isSortable?: boolean;
  isLarge?: boolean;
}

const QueueColumn: React.FC<QueueColumnProps> = ({ 
  title, 
  patients, 
  onUpdateStatus, 
  onDelete, 
  onEdit,
  onMove,
  onReorder,
  onCardClick,
  onOpenChat,
  activeCardId,
  status,
  colorClass,
  headerColor,
  isSortable,
  isLarge
}) => {
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent) => {
    setDragOverCardId(null);
    const patientId = e.dataTransfer.getData('patientId');
    if (patientId) {
      onUpdateStatus(patientId, status);
    }
  };

  const handleCardDrop = (e: React.DragEvent, targetId: string) => {
    e.stopPropagation();
    setDragOverCardId(null);
    const sourceId = e.dataTransfer.getData('patientId');
    if (sourceId && sourceId !== targetId && onReorder) {
      onReorder(sourceId, targetId);
    } else if (sourceId === targetId) {
       // Optional: do nothing if dropped on self
    } else if (sourceId && !onReorder) {
       // Fallback to simple status update if reordering is not supported for this column
       onUpdateStatus(sourceId, status);
    }
  };

  const patientCount = useMemo(() => {
    return patients.filter(p => !p.isVisitor).length;
  }, [patients]);

  return (
    <div 
      className={`flex flex-col h-full rounded-2xl border-2 shadow-inner transition-colors ${colorClass}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className={`${headerColor} text-white px-5 py-4 rounded-t-[14px] font-black flex items-center justify-between shadow-sm z-10`}>
        <span className="uppercase tracking-wider text-sm">{title}</span>
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-mono border border-white/30" title={`${patientCount} Patients + ${patients.length - patientCount} Visitors`}>
          {patientCount}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300">
        {patients.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 italic text-sm py-12 border-2 border-dashed border-slate-300 rounded-xl">
            <p className="font-medium text-center px-4">No patients currently in {title}</p>
          </div>
        ) : (
          patients.map(p => (
            <div 
              key={p.id} 
              className={`transition-all duration-200 w-full rounded-xl ${dragOverCardId === p.id ? 'bg-indigo-100 ring-2 ring-indigo-400 ring-offset-2' : ''}`}
              onDragOver={(e) => {
                onDragOver(e);
                setDragOverCardId(p.id);
              }}
              onDragLeave={() => setDragOverCardId(null)}
              onDrop={(e) => handleCardDrop(e, p.id)}
            >
              <PatientCard 
                patient={p} 
                onUpdateStatus={onUpdateStatus} 
                onDelete={onDelete} 
                onEdit={onEdit}
                onMove={onMove}
                onClick={onCardClick}
                onOpenChat={onOpenChat}
                isActive={activeCardId === p.id}
                isLarge={isLarge}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QueueColumn;
