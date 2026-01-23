
import React from 'react';
import { Patient, PatientStatus, PatientCategory } from '../types';
import { Icons, CATEGORY_COLORS } from '../constants';

interface PatientCardProps {
  patient: Patient;
  onUpdateStatus: (id: string, newStatus: PatientStatus) => void;
  onDelete?: (id: string) => void;
  onEdit?: (patient: Patient) => void;
  onMove?: (id: string, direction: 'up' | 'down') => void;
  onClick?: (id: string) => void;
  onOpenChat?: (id: string) => void;
  isActive?: boolean;
  isLarge?: boolean;
}

const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  onUpdateStatus, 
  onDelete, 
  onEdit,
  onMove,
  onClick,
  onOpenChat,
  isActive,
  isLarge
}) => {
  
  const handleDragStart = (e: React.DragEvent) => {
    if (onClick) return;
    e.dataTransfer.setData('patientId', patient.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.id}&gender=${patient.gender === 'Male' ? 'male' : 'female'}`;

  const activeClasses = isActive ? 'ring-4 ring-indigo-500 ring-offset-2 scale-[1.02] shadow-xl z-30' : '';
  
  // Theme logic based on Category and Visitor status
  const categoryTheme = CATEGORY_COLORS[patient.category] || 'bg-slate-50 border-slate-200';
  const visitorTheme = 'bg-red-50 border-red-400 animate-radium-glow';
  const finalThemeClasses = patient.isVisitor ? visitorTheme : categoryTheme;

  const formatTime = (ts?: number) => {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChat?.(patient.id);
  };

  return (
    <div 
      draggable={!onClick}
      onDragStart={handleDragStart}
      onClick={() => onClick?.(patient.id)}
      className={`${finalThemeClasses} border-2 rounded-xl shadow-sm transition-all duration-200 ${activeClasses} ${onClick ? 'cursor-pointer hover:border-indigo-400' : 'cursor-grab active:cursor-grabbing'} group relative overflow-hidden flex flex-col`}
    >
      {/* Visitor Overlay Badge */}
      {patient.isVisitor && (
        <div className="absolute top-0 right-0 bg-red-600 text-white font-black px-3 py-0.5 rounded-bl-lg uppercase tracking-wider z-10 text-[9px]">
          Visitor
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex items-start gap-4 ${isLarge ? 'p-6' : 'p-3.5'}`}>
        
        {/* Left Column: Avatar & Category Badge */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className={`rounded-full bg-white border border-slate-200 overflow-hidden shadow-inner transition-all ${isLarge ? 'w-24 h-24' : 'w-14 h-14'}`}>
            <img src={avatarUrl} alt="Patient Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="bg-white border border-slate-300 rounded-md px-1.5 py-1 text-[8px] font-black text-slate-500 uppercase tracking-tight min-w-[65px] text-center shadow-sm">
            {patient.category}
          </div>
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Row 1: Name and Queue ID - Fixed for long names */}
          <div className="flex items-center gap-2 mb-0.5">
            {!patient.isVisitor && (
              <span className="bg-slate-800 text-white font-black px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">
                #{patient.queueId}
              </span>
            )}
            <h4 className={`font-black text-slate-900 truncate uppercase tracking-tight ${isLarge ? 'text-4xl' : 'text-lg'}`}>
              {patient.name}
            </h4>
          </div>
          
          {/* Row 2: Age/Gender + IN Time - Moved here to prevent collision with Name */}
          <div className="flex items-center justify-between gap-2">
            <div className={`font-bold text-slate-600 truncate ${isLarge ? 'text-2xl' : 'text-[13px]'}`}>
              {patient.age} yrs • {patient.gender}
            </div>
            {patient.inTime && (
              <div className="flex items-center gap-1 text-slate-400 font-bold whitespace-nowrap text-[9px] uppercase flex-shrink-0">
                <Icons.Clock />
                <span className="hidden sm:inline">IN:</span> {formatTime(patient.inTime)}
              </div>
            )}
          </div>

          {/* Row 3: City + OUT Time */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className={`font-black text-slate-900 truncate ${isLarge ? 'text-3xl' : 'text-[15px]'}`}>
              {patient.city}
            </div>
            {patient.outTime && (
              <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black text-[9px] whitespace-nowrap uppercase border border-emerald-200 shadow-sm flex-shrink-0">
                OUT: {formatTime(patient.outTime)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-t border-slate-200 bg-slate-100/30 flex items-center justify-between px-3 py-1.5 transition-all group-hover:bg-white min-h-[42px]">
        
        {/* Reorder Controls */}
        <div className="flex items-center gap-2">
          {patient.status === PatientStatus.WAITING && onMove && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onMove(patient.id, 'up'); }} className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="Move Up"><Icons.ChevronUp /></button>
              <button onClick={(e) => { e.stopPropagation(); onMove(patient.id, 'down'); }} className="text-slate-400 hover:text-indigo-600 transition-colors p-1" title="Move Down"><Icons.ChevronDown /></button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-4 w-[1px] bg-slate-300"></div>

          {/* Core Status Transitions */}
          <div className="flex items-center gap-2">
            {patient.status !== PatientStatus.OPD && (
              <button 
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.OPD); }} 
                className="text-amber-500 hover:text-amber-600 transition-colors p-1 hover:bg-amber-50 rounded" 
                title="To OPD"
              >
                <Icons.Stethoscope />
              </button>
            )}
            {patient.status !== PatientStatus.COMPLETED && (
              <button 
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.COMPLETED); }} 
                className="text-emerald-500 hover:text-emerald-600 transition-colors p-1 hover:bg-emerald-50 rounded" 
                title="Mark Completed"
              >
                <Icons.CheckCircle />
              </button>
            )}
          </div>

          <div className="h-4 w-[1px] bg-slate-300"></div>

          {/* Discussion */}
          <button 
            onClick={handleChatClick} 
            className={`transition-all relative p-1 rounded hover:bg-indigo-50 ${patient.hasUnreadAlert ? 'text-rose-600 scale-110' : 'text-indigo-500'}`} 
            title="Open Discussion"
          >
            <div className={patient.hasUnreadAlert ? 'animate-bounce' : ''}>
              <Icons.Message />
            </div>
            {patient.hasUnreadAlert && (
              <span className="absolute top-0 right-0 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
            )}
          </button>

          <div className="h-4 w-[1px] bg-slate-300"></div>

          {/* Management */}
          <div className="flex items-center gap-1.5">
            {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(patient); }} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded" title="Edit"><Icons.Edit /></button>}
            {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }} className="text-slate-300 hover:text-rose-500 transition-colors p-1 hover:bg-rose-50 rounded" title="Delete"><Icons.Trash /></button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;
