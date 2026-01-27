
import React, { useState, useEffect } from 'react';
import { PatientFormData, PatientCategory, Patient, PatientType } from '../types';
import { CITIES, CATEGORY_OPTIONS, PATIENT_TYPE_OPTIONS, VISITOR_TYPE_OPTIONS, Icons } from '../constants';

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  initialData?: Patient;
  isEditing?: boolean;
}

const PatientForm: React.FC<PatientFormProps> = ({ onSubmit, initialData, isEditing }) => {
  const defaultData: PatientFormData = {
    name: '',
    age: 25,
    gender: 'Male',
    category: PatientCategory.PATIENT,
    type: PatientType.GEN_PATIENT,
    city: CITIES[0],
    mobile: '',
  };

  const [formData, setFormData] = useState<PatientFormData>(defaultData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        age: initialData.age,
        gender: initialData.gender,
        category: initialData.category,
        type: initialData.type,
        city: initialData.city,
        mobile: initialData.mobile || '',
      });
    } else {
      setFormData(defaultData);
    }
  }, [initialData]);

  const handleCategoryChange = (cat: PatientCategory) => {
    const defaultType = cat === PatientCategory.PATIENT 
      ? PatientType.GEN_PATIENT 
      : PatientType.VISITOR;
    
    setFormData(prev => ({ 
      ...prev, 
      category: cat, 
      type: defaultType 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a name.');
      return;
    }
    
    onSubmit({
      ...formData,
      age: formData.age || 25,
    });
    
    if (!isEditing) setFormData(defaultData);
  };

  const currentTypeOptions = formData.category === PatientCategory.PATIENT 
    ? PATIENT_TYPE_OPTIONS 
    : VISITOR_TYPE_OPTIONS;

  const inputClasses = "w-full bg-white text-slate-900 border-2 border-slate-200 rounded-xl p-3 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium";
  const labelClasses = "text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1";
  const radioGroupClasses = "flex flex-wrap gap-2 p-1.5 bg-slate-100/50 border border-slate-200 rounded-xl";
  const radioLabelClasses = "flex-1 min-w-[90px] flex items-center justify-center gap-2 cursor-pointer p-2 rounded-lg transition-all border-2 border-transparent has-[:checked]:border-indigo-600 has-[:checked]:bg-white has-[:checked]:shadow-sm";
  const radioTextClasses = "text-slate-700 font-bold text-[10px] uppercase tracking-wider";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        
        {/* Full Name */}
        <div className="flex flex-col gap-2 sm:col-span-1">
          <label className={labelClasses}>Full Name</label>
          <input
            type="text"
            className={inputClasses}
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Mobile Number */}
        <div className="flex flex-col gap-2">
          <label className={labelClasses}>Mobile (Optional)</label>
          <input
            type="tel"
            className={inputClasses}
            placeholder="Contact number"
            value={formData.mobile}
            onChange={e => setFormData({ ...formData, mobile: e.target.value })}
          />
        </div>

        {/* Category Radio Group */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className={labelClasses}>Primary Category</label>
          <div className={radioGroupClasses}>
            {CATEGORY_OPTIONS.map(cat => (
              <label key={cat} className={radioLabelClasses}>
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={formData.category === cat}
                  onChange={() => handleCategoryChange(cat)}
                  className="sr-only"
                />
                <span className={radioTextClasses}>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Type Radio Group (Dynamic based on Category) */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className={labelClasses}>Entry Type</label>
          <div className={radioGroupClasses}>
            {currentTypeOptions.map(type => (
              <label key={type} className={radioLabelClasses}>
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={formData.type === type}
                  onChange={() => setFormData({ ...formData, type: type })}
                  className="sr-only"
                />
                <span className={radioTextClasses}>{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Age */}
        <div className="flex flex-col gap-2">
          <label className={labelClasses}>Age</label>
          <input
            type="number"
            className={inputClasses}
            value={formData.age || ''}
            placeholder="25"
            onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-2">
          <label className={labelClasses}>Gender</label>
          <div className={radioGroupClasses}>
            <label className={radioLabelClasses}>
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={formData.gender === 'Male'}
                onChange={() => setFormData({ ...formData, gender: 'Male' })}
                className="sr-only"
              />
              <span className={radioTextClasses}>Male</span>
            </label>
            <label className={radioLabelClasses}>
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={formData.gender === 'Female'}
                onChange={() => setFormData({ ...formData, gender: 'Female' })}
                className="sr-only"
              />
              <span className={radioTextClasses}>Female</span>
            </label>
          </div>
        </div>

        {/* City */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className={labelClasses}>City / Location</label>
          <select
            className={`${inputClasses} cursor-pointer`}
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
          >
            {CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setFormData(defaultData)}
          className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-base uppercase tracking-widest"
        >
          <Icons.X />
          Clear
        </button>
        <button
          type="submit"
          className={`flex-[2] ${isEditing ? 'bg-amber-600' : 'bg-indigo-700'} text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-base uppercase tracking-widest`}
        >
          {isEditing ? <Icons.Edit /> : <Icons.CheckCircle />} 
          {isEditing ? 'Update Profile' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default PatientForm;
