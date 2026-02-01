import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Patient, PatientStatus, PatientCategory } from '../types';
import { Icons, TYPE_THEMES } from '../constants';

const API_BASE = '/api';

interface DisplayCardProps {
  patient: Patient;
  size: 'large' | 'medium';
  position?: number;
}

const formatTime = (timestamp: number | string | undefined): string => {
  if (!timestamp) return '--:--';
  const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp);
  if (isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const DisplayCard: React.FC<DisplayCardProps> = ({ patient, size, position }) => {
  const isLarge = size === 'large';
  const theme = TYPE_THEMES[patient.type] || 'bg-emerald-50 border-emerald-300';
  
  const getCategoryBadge = () => {
    const isPatient = patient.category === PatientCategory.PATIENT;
    const baseClasses = isLarge 
      ? "px-4 py-2 text-xl font-bold rounded-full uppercase whitespace-nowrap"
      : "px-3 py-1.5 text-base font-bold rounded-full uppercase whitespace-nowrap";
    return isPatient 
      ? <span className={`${baseClasses} bg-emerald-100 text-emerald-700`}>{patient.type}</span>
      : <span className={`${baseClasses} bg-orange-100 text-orange-700`}>{patient.type}</span>;
  };

  return (
    <div className="relative">
      {position && (
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-slate-700 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg z-10">
          {position}
        </div>
      )}
      <div className={`${theme} border-3 rounded-2xl ${isLarge ? 'p-8' : 'p-5 pt-8'} flex flex-col shadow-lg`}>
        <div className="flex items-start gap-5">
          <div className="flex-shrink-0">
            {patient.gender === 'Male' 
              ? <Icons.MaleAvatar className={isLarge ? "w-28 h-28" : "w-20 h-20"} />
              : <Icons.FemaleAvatar className={isLarge ? "w-28 h-28" : "w-20 h-20"} />
            }
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className={`${isLarge ? 'text-4xl' : 'text-2xl'} font-bold text-slate-800 uppercase mb-3 leading-tight`}>
              {patient.name}
            </h2>
            
            <div className={`${isLarge ? 'text-2xl' : 'text-lg'} text-slate-600 mb-4`}>
              {patient.age} yrs  |  {patient.gender}  |  {patient.city}
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              {getCategoryBadge()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QueueDisplay: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hospitalName, setHospitalName] = useState<string>('');

  const fetchPatients = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/patients`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('patient:add', fetchPatients);
    newSocket.on('patient:update', fetchPatients);
    newSocket.on('patient:delete', fetchPatients);
    newSocket.on('patient:reorder', fetchPatients);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      newSocket.disconnect();
      clearInterval(timeInterval);
    };
  }, [fetchPatients]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch('/metadata.json');
        if (response.ok) {
          const data = await response.json();
          setHospitalName(data.hospitalName || '');
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };
    fetchMetadata();
  }, []);

  const opdPatients = patients
    .filter(p => p.status === PatientStatus.OPD)
    .sort((a, b) => (a.inTime || 0) - (b.inTime || 0))
    .slice(0, 2);

  const waitingPatients = patients
    .filter(p => p.status === PatientStatus.WAITING)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .slice(0, 3);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatClock = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col">
      <div className="bg-slate-800 text-white px-8 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Icons.Stethoscope />
          </div>
          <h1 className="text-3xl font-bold tracking-wide">ClinicFlow Queue Display</h1>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold font-mono">{formatClock(currentTime)}</div>
          <div className="text-lg text-slate-300">{formatDate(currentTime)}</div>
        </div>
      </div>

      <div className="flex-1 p-8 flex flex-col gap-8">
        <div className="bg-orange-500 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-orange-600 px-8 py-4 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white uppercase tracking-wider">
              Currently in OPD
            </h2>
            <div className="bg-white text-orange-600 w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold">
              {opdPatients.length}
            </div>
          </div>
          
          <div className="p-6">
            {opdPatients.length === 0 ? (
              <div className="bg-orange-100 rounded-2xl p-12 text-center">
                <p className="text-2xl text-orange-600 font-semibold">No patients currently in OPD</p>
              </div>
            ) : (
              <div className={`grid gap-6 ${opdPatients.length === 1 ? 'grid-cols-1 max-w-4xl mx-auto' : 'grid-cols-2'}`}>
                {opdPatients.map((patient) => (
                  <DisplayCard key={patient.id} patient={patient} size="large" />
                ))}
              </div>
            )}
          </div>
        </div>

        {hospitalName && (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl shadow-lg overflow-hidden py-4">
            <div className="marquee-container flex">
              <div className="marquee-content flex shrink-0">
                <span className="text-3xl font-bold text-white tracking-wider mx-8">{hospitalName}</span>
                <span className="text-3xl text-white mx-4">★</span>
                <span className="text-3xl font-bold text-white tracking-wider mx-8">{hospitalName}</span>
                <span className="text-3xl text-white mx-4">★</span>
                <span className="text-3xl font-bold text-white tracking-wider mx-8">{hospitalName}</span>
                <span className="text-3xl text-white mx-4">★</span>
                <span className="text-3xl font-bold text-white tracking-wider mx-8">{hospitalName}</span>
                <span className="text-3xl text-white mx-4">★</span>
              </div>
              <div className="marquee-content flex shrink-0">
                <span className="text-3xl font-bold text-white tracking-wider mx-8">{hospitalName}</span>
                <span className="text-3xl text-white mx-4">★</span>
                <span className="text-3xl font-bold text-white tracking-wider mx-8">{hospitalName}</span>
                <span className="text-3xl text-white mx-4">★</span>
                <span className="text-3xl font-bold text-white tracking-wider mx-8">{hospitalName}</span>
                <span className="text-3xl text-white mx-4">★</span>
                <span className="text-3xl font-bold text-white tracking-wider mx-8">{hospitalName}</span>
                <span className="text-3xl text-white mx-4">★</span>
              </div>
            </div>
            <style>{`
              .marquee-container {
                animation: scroll 20s linear infinite;
              }
              @keyframes scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
          </div>
        )}

        <div className="flex-1 bg-teal-500 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-teal-600 px-8 py-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="17 11 12 6 7 11"/>
                <polyline points="17 18 12 13 7 18"/>
              </svg>
              <svg className="w-10 h-10 text-white -ml-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="17 11 12 6 7 11"/>
                <polyline points="17 18 12 13 7 18"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white uppercase tracking-wider">
              Next in Queue
            </h2>
          </div>
          
          <div className="p-6">
            {waitingPatients.length === 0 ? (
              <div className="bg-teal-100 rounded-2xl p-12 text-center">
                <p className="text-2xl text-teal-600 font-semibold">No patients waiting</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {waitingPatients.map((patient, index) => (
                  <DisplayCard 
                    key={patient.id} 
                    patient={patient} 
                    size="medium" 
                    position={index + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 text-slate-400 text-center py-3 text-lg">
        Please wait for your number to be called
      </div>
    </div>
  );
};

export default QueueDisplay;
