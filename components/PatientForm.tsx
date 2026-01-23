
import React, { useState, useEffect } from 'react';
import { PatientFormData, PatientCategory, Patient } from '../types';
import { CITIES, CATEGORIES, Icons } from '../constants';

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  initialData?: Patient;
  isEditing?: boolean;
}

const PatientForm: React.FC<PatientFormProps> = ({ onSubmit, initialData, isEditing }) => {
  const defaultData: PatientFormData = {
    name: '',
    age: 0,
    gender: 'Male',
    category: PatientCategory.GENERAL,
    city: CITIES[0],
    isVisitor: false,
  };

  const [formData, setFormData] = useState<PatientFormData>(defaultData);

  // Update form if initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        age: initialData.age,
        gender: initialData.gender,
        category: initialData.category,
        city: initialData.city,
        isVisitor: initialData.isVisitor,
      });
    } else {
      setFormData(defaultData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.age <= 0) {
      alert('Please enter valid patient details.');
      return;
    }
    onSubmit(formData);
    if (!isEditing) setFormData(defaultData); // Only reset if not editing (edit reset handled by cancel/complete)
  };

  const inputClasses = "w-full bg-white text-slate-900 border-2 border-slate-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-base";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Full Name</label>
          <input
            type="text"
            className={inputClasses}
            placeholder="e.g. Robert Smith"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Age */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Age (Years)</label>
          <input
            type="number"
            className={inputClasses}
            value={formData.age || ''}
            onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
            required
            min="1"
            max="120"
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Gender</label>
          <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex-1 flex items-center justify-center gap-3 cursor-pointer p-2 rounded-lg transition-colors hover:bg-white border-2 border-transparent has-[:checked]:border-indigo-500 has-[:checked]:bg-white">
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={formData.gender === 'Male'}
                onChange={() => setFormData({ ...formData, gender: 'Male' })}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-slate-900 font-semibold">Male</span>
            </label>
            <label className="flex-1 flex items-center justify-center gap-3 cursor-pointer p-2 rounded-lg transition-colors hover:bg-white border-2 border-transparent has-[:checked]:border-indigo-500 has-[:checked]:bg-white">
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={formData.gender === 'Female'}
                onChange={() => setFormData({ ...formData, gender: 'Female' })}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-slate-900 font-semibold">Female</span>
            </label>
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Category</label>
          <select
            className={inputClasses}
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value as PatientCategory })}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">City / Location</label>
          <select
            className={inputClasses}
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
          >
            {CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Visitor Toggle */}
        <div className="flex flex-col gap-2 justify-center">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.isVisitor}
                onChange={e => setFormData({ ...formData, isVisitor: e.target.checked })}
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
            <span className="text-sm font-bold text-slate-700 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">Visitor</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className={`w-full ${isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-black py-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg uppercase tracking-wide`}
      >
        {isEditing ? <Icons.Edit /> : <Icons.Plus />} 
        {isEditing ? 'Update Patient' : 'Register Patient'}
      </button>
    </form>
  );
};

export default PatientForm;
