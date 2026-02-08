
import React from 'react';
import { Patient, PatientStatus, PatientCategory, PatientType, AppView } from '../types';
import { Icons, TYPE_THEMES } from '../constants';

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
  activeView?: AppView;
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
  isLarge,
  activeView
}) => {
  
  const handleDragStart = (e: React.DragEvent) => {
    if (onClick) return;
    e.dataTransfer.setData('patientId', patient.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const AvatarIcon = patient.gender === 'Male' ? Icons.MaleAvatar : Icons.FemaleAvatar;

  const isOPD = patient.status === PatientStatus.OPD;
  const isDoctorOPD = activeView === 'DOCTOR' && isOPD;
  const activeClasses = isActive ? 'ring-4 ring-indigo-500 ring-offset-2 scale-[1.02] shadow-xl z-30' : 'hover:shadow-md';
  
  const isVisitorCategory = patient.category === PatientCategory.VISITOR;
  const themeClasses = TYPE_THEMES[patient.type] || 'bg-slate-50 border-slate-200';
  const animationClasses = isVisitorCategory ? 'animate-radium-glow' : '';
  
  const finalThemeClasses = `${themeClasses} ${animationClasses}`;

  const formatTime = (ts?: number | string | null) => {
    if (!ts) return null;
    const date = typeof ts === 'string' ? new Date(ts) : new Date(ts);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChat?.(patient.id);
  };

  if (isDoctorOPD) {
    return (
      <div 
        onClick={() => onClick?.(patient.id)}
        className={`${finalThemeClasses} border-2 rounded-2xl transition-all duration-300 ${activeClasses} ${onClick ? 'cursor-pointer' : ''} group relative overflow-hidden flex flex-col`}
      >
        {isVisitorCategory && (
          <div className="absolute top-0 right-0 bg-red-600 text-white font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-10 text-[8px] shadow-sm">
            Visitor
          </div>
        )}

        <div className="flex items-start gap-3 p-3">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="rounded-full overflow-hidden shadow-sm w-20 h-20">
              <AvatarIcon className="w-full h-full" />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[80px] text-center shadow-sm">
              {patient.type}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1.5">
              {!isVisitorCategory && (
                <span className="bg-gray-200 text-gray-900 font-black px-2 py-0.5 rounded-full text-[11px] flex-shrink-0 shadow-md flex items-center gap-0.5">
                  <span className="text-[10px] text-gray-600">#</span>
                  <span>{patient.queueId}</span>
                </span>
              )}
              <h4 className="text-slate-900 truncate uppercase tracking-tight leading-tight flex-1 text-4xl font-extrabold">
                {patient.name}
              </h4>
              {patient.inTime && (
                <div className="bg-emerald-600 text-white rounded-xl font-black whitespace-nowrap shadow-md text-center flex-shrink-0 px-4 py-2 text-sm uppercase tracking-wide border-2 border-emerald-500 flex items-center gap-2">
                  <Icons.Clock />
                  <span>{formatTime(patient.inTime)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-slate-600 truncate text-3xl">
                {patient.age} yrs ({patient.gender === 'Male' ? 'M' : 'F'})
                {patient.mobile && (
                  <><span className="mx-1 text-slate-300">&bull;</span> {patient.mobile}</>
                )}
                <span className="mx-1 text-slate-300">&bull;</span>
                <span className="font-black text-slate-900">{patient.city}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.COMPLETED); }} 
                className="bg-slate-800 text-white hover:bg-slate-900 transition-all px-4 py-2 rounded-xl flex-shrink-0 flex items-center gap-2 text-sm font-black uppercase tracking-wide shadow-md border-2 border-slate-700 hover:shadow-lg"
                title="Mark Done"
              >
                <Icons.CheckCircle />
                <span>&nbsp; DONE &raquo;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      draggable={!onClick && activeView === 'OPERATOR'}
      onDragStart={handleDragStart}
      onClick={() => onClick?.(patient.id)}
      className={`${finalThemeClasses} border-2 rounded-2xl transition-all duration-300 ${activeClasses} ${onClick ? 'cursor-pointer' : (activeView === 'OPERATOR' ? 'cursor-grab active:cursor-grabbing' : '')} group relative overflow-hidden flex flex-col`}
    >
      {isVisitorCategory && (
        <div className="absolute top-0 right-0 bg-red-600 text-white font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-10 text-[8px] shadow-sm">
          Visitor
        </div>
      )}

      <div className={`flex items-start ${isLarge && isOPD ? 'gap-3 p-4' : isLarge ? 'gap-4 p-8' : patient.status === PatientStatus.WAITING ? 'gap-2 p-3' : 'gap-3 p-4'}`}>
        
        <div className={`flex flex-col items-center flex-shrink-0 ${patient.status === PatientStatus.WAITING ? '' : 'gap-3'}`}>
          <div className={`rounded-full overflow-hidden shadow-sm transition-all ${isLarge && isOPD ? 'w-24 h-24' : isLarge ? 'w-28 h-28' : 'w-16 h-16'}`}>
            <AvatarIcon className="w-full h-full" />
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest min-w-[75px] text-center shadow-sm">
            {patient.type}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col pt-0.5">
          <div className="flex items-center gap-2 mb-1.5">
            {patient.status !== PatientStatus.WAITING && !isVisitorCategory && (
              <span className="bg-gray-200 text-gray-900 font-black px-3 py-1 rounded-full text-[12px] flex-shrink-0 shadow-md flex items-center gap-0.5">
                <span className="text-[11px] text-gray-600">#</span>
                <span>{patient.queueId}</span>
              </span>
            )}
            <h4 className={`text-slate-900 truncate uppercase tracking-tight leading-tight flex-1 ${isLarge && isOPD ? 'text-[2.25rem] font-extrabold' : isLarge ? 'text-5xl font-extrabold' : 'text-[1.5rem] font-bold'}`}>
              {patient.name}
            </h4>
          </div>
          
          {patient.status === PatientStatus.WAITING ? (
            <div className={`font-semibold text-slate-600 truncate ${isLarge ? 'text-2xl' : 'text-xl'}`}>
              {patient.age} yrs ({patient.gender === 'Male' ? 'M' : 'F'})
              {patient.city && (
                <><span className="mx-1 text-slate-300">&bull;</span><span className="font-black text-slate-900">{patient.city}</span></>
              )}
              {patient.mobile && (
                <><span className="mx-1 text-slate-300">&bull;</span>{patient.mobile}</>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className={`font-semibold text-slate-600 truncate ${isLarge ? 'text-2xl' : 'text-sm'}`}>
                  {patient.age} yrs <span className="mx-1 text-slate-300">&bull;</span> {patient.gender}
                </div>
                {patient.status !== PatientStatus.COMPLETED && patient.inTime && (
                  <div className={`bg-emerald-500 text-white rounded-lg font-bold whitespace-nowrap shadow-sm text-center flex-shrink-0 ${isOPD ? 'px-2 py-0.5 text-[12px] min-w-[85px]' : 'px-3 py-1 text-[11px] min-w-[100px]'}`}>
                    IN &nbsp;:  {formatTime(patient.inTime)}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-auto">
                <div className={`font-black text-slate-900 truncate tracking-tight ${isLarge ? 'text-3xl' : 'text-lg'}`}>
                  {patient.city}
                </div>
                {patient.status !== PatientStatus.COMPLETED && patient.outTime && (
                  <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap shadow-sm min-w-[100px] text-center flex-shrink-0">
                    OUT: {formatTime(patient.outTime)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {patient.status === PatientStatus.COMPLETED ? (
        <div className="border-t border-slate-100 bg-slate-50/50 flex items-center px-4 py-2 transition-all group-hover:bg-white min-h-[48px]">
          <div className="flex items-center justify-center" style={{ width: '15%' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.OPD); }} 
              className="text-amber-600 hover:text-amber-700 transition-colors p-1.5 hover:bg-amber-50 rounded-lg flex items-center gap-1" 
              title="Send to OPD"
            >
              <Icons.Stethoscope />
            </button>
          </div>
          <div className="w-[1px] h-5 bg-slate-200"></div>
          <div className="flex items-center justify-center" style={{ width: '35%' }}>
            {patient.inTime && (
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap shadow-sm min-w-[100px] text-center">
                IN &nbsp;: {formatTime(patient.inTime)}
              </div>
            )}
          </div>
          <div className="w-[1px] h-5 bg-slate-200"></div>
          <div className="flex items-center justify-center" style={{ width: '35%' }}>
            {patient.outTime && (
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap shadow-sm min-w-[100px] text-center">
                OUT: {formatTime(patient.outTime)}
              </div>
            )}
          </div>
          <div className="w-[1px] h-5 bg-slate-200"></div>
          <div className="flex items-center justify-center" style={{ width: '15%' }}>
            <button 
              onClick={handleChatClick} 
              className={`transition-all relative p-1.5 rounded-lg hover:bg-indigo-50 ${patient.hasUnreadAlert ? 'text-rose-600' : 'text-indigo-600'}`} 
              title="Discussion"
            >
              <Icons.Message />
              {patient.hasUnreadAlert && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
              )}
            </button>
          </div>
        </div>
      ) : patient.status === PatientStatus.WAITING ? (
        <div className="border-t border-slate-100 bg-slate-50/50 flex items-center px-4 py-2 transition-all group-hover:bg-white min-h-[48px]">
          {!isVisitorCategory && (
            <>
              <span className="bg-gray-200 text-gray-900 font-black px-2 py-0.5 rounded-full text-[11px] shadow-md flex items-center gap-0.5">
                <span className="text-[10px] text-gray-600">#</span>
                <span>{patient.queueId}</span>
              </span>
              <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>
            </>
          )}
          <div className="flex items-center gap-1">
            {onMove && (() => {
              const isPinned = patient.type === PatientType.FAMILY || patient.type === PatientType.RELATIVE;
              const btnClass = isPinned 
                ? "text-slate-200 cursor-not-allowed p-1.5 rounded-md" 
                : "text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-md hover:bg-slate-100";
              return (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (!isPinned) onMove(patient.id, 'up'); }} 
                    className={btnClass} 
                    title={isPinned ? "Cannot move pinned type" : "Move Up"}
                    disabled={isPinned}
                  >
                    <Icons.ChevronUp />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (!isPinned) onMove(patient.id, 'down'); }} 
                    className={btnClass} 
                    title={isPinned ? "Cannot move pinned type" : "Move Down"}
                    disabled={isPinned}
                  >
                    <Icons.ChevronDown />
                  </button>
                </>
              );
            })()}
          </div>

          <div className="w-[1px] h-5 bg-slate-200"></div>

          <div className="flex items-center gap-1 px-2">
            {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(patient); }} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-md hover:bg-slate-100" title="Edit"><Icons.Edit /></button>}
            {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }} className="text-slate-300 hover:text-rose-600 transition-colors p-1.5 rounded-md hover:bg-rose-50" title="Delete"><Icons.Trash /></button>}
          </div>

          <div className="w-[1px] h-5 bg-slate-200"></div>

          <div className="flex items-center justify-center flex-1 px-2">
            {patient.inTime && (
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap shadow-sm min-w-[100px] text-center">
                IN &nbsp;: {formatTime(patient.inTime)}
              </div>
            )}
          </div>

          <div className="w-[1px] h-5 bg-slate-200"></div>

          <div className="flex items-center gap-2 pl-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.OPD); }} 
              className="text-amber-600 hover:text-amber-700 transition-colors p-1.5 hover:bg-amber-50 rounded-lg flex items-center gap-1" 
              title="Send to OPD"
            >
              <Icons.Stethoscope />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.COMPLETED); }} 
              className="text-emerald-600 hover:text-emerald-700 transition-colors p-1.5 hover:bg-emerald-50 rounded-lg" 
              title="Mark Done"
            >
              <Icons.CheckCircle />
            </button>
          </div>
        </div>
        ) : (
        <div className="border-t border-slate-100 bg-slate-50/50 flex items-center justify-between px-4 py-2 transition-all group-hover:bg-white min-h-[48px]">
          <div className="flex items-center gap-1"></div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {patient.status !== PatientStatus.OPD && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.OPD); }} 
                  className="text-amber-600 hover:text-amber-700 transition-colors p-1.5 hover:bg-amber-50 rounded-lg flex items-center gap-1" 
                  title="Send to OPD"
                >
                  <Icons.Stethoscope />
                </button>
              )}
              {patient.status !== PatientStatus.COMPLETED && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onUpdateStatus(patient.id, PatientStatus.COMPLETED); }} 
                  className="text-emerald-600 hover:text-emerald-700 transition-colors p-1.5 hover:bg-emerald-50 rounded-lg" 
                  title="Mark Done"
                >
                  <Icons.CheckCircle />
                </button>
              )}
            </div>

            <div className="w-[1px] h-5 bg-slate-200"></div>

            <button 
              onClick={handleChatClick} 
              className={`transition-all relative p-1.5 rounded-lg hover:bg-indigo-50 ${patient.hasUnreadAlert ? 'text-rose-600' : 'text-indigo-600'}`} 
              title="Discussion"
            >
              <Icons.Message />
              {patient.hasUnreadAlert && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
              )}
            </button>

            <div className="w-[1px] h-5 bg-slate-200"></div>

            <div className="flex items-center gap-1">
              {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(patient); }} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-md hover:bg-slate-100" title="Edit"><Icons.Edit /></button>}
              {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }} className="text-slate-300 hover:text-rose-600 transition-colors p-1.5 rounded-md hover:bg-rose-50" title="Delete"><Icons.Trash /></button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCard;
