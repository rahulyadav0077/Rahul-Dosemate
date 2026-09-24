import React, { useState } from 'react';
import { useReminders } from '../context/ReminderContext';
import { FrequencyType, InstructionType, Medicine } from '../types';
import { getCurrentDateYYYYMMDD, getCurrentTimeHHMM } from '../services/api';
import {
  Pill,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Utensils,
  Check,
  X,
  Search,
} from 'lucide-react';

interface MedicineManagerProps {
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
}

export const MedicineManager: React.FC<MedicineManagerProps> = ({
  isAddModalOpen,
  onCloseAddModal,
}) => {
  const { medicines, addMedicine, updateMedicine, deleteMedicine } = useReminders();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);

  // Form states
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [reminderTime, setReminderTime] = useState(getCurrentTimeHHMM());
  const [additionalTimes, setAdditionalTimes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(getCurrentDateYYYYMMDD());
  const [endDate, setEndDate] = useState('2026-12-31');
  const [frequency, setFrequency] = useState<FrequencyType>('Daily');
  const [instructions, setInstructions] = useState<InstructionType>('After Food');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setMedicineName('');
    setDosage('');
    setReminderTime(getCurrentTimeHHMM());
    setAdditionalTimes([]);
    setStartDate(getCurrentDateYYYYMMDD());
    setEndDate('2026-12-31');
    setFrequency('Daily');
    setInstructions('After Food');
    setNotes('');
    setColor('#2563eb');
    setEditingMed(null);
  };

  const openAddForm = () => {
    resetForm();
    onCloseAddModal(); // toggle will be handled by caller
  };

  const handleEditClick = (med: Medicine) => {
    setEditingMed(med);
    setMedicineName(med.medicine_name);
    setDosage(med.dosage);
    setReminderTime(med.reminder_times[0] || '10:00');
    setAdditionalTimes(med.reminder_times.slice(1));
    setStartDate(med.start_date);
    setEndDate(med.end_date);
    setFrequency(med.frequency);
    setInstructions(med.instructions);
    setNotes(med.notes || '');
    setColor(med.color || '#2563eb');
  };

  const handleAddExtraTime = () => {
    setAdditionalTimes([...additionalTimes, '20:00']);
  };

  const handleRemoveExtraTime = (idx: number) => {
    setAdditionalTimes(additionalTimes.filter((_, i) => i !== idx));
  };

  const handleUpdateExtraTime = (idx: number, val: string) => {
    const updated = [...additionalTimes];
    updated[idx] = val;
    setAdditionalTimes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim() || !dosage.trim()) return;

    setIsSubmitting(true);
    const allTimes = [reminderTime, ...additionalTimes].filter(Boolean);

    try {
      if (editingMed) {
        await updateMedicine(editingMed.id, {
          medicine_name: medicineName.trim(),
          dosage: dosage.trim(),
          reminder_times: allTimes,
          start_date: startDate,
          end_date: endDate,
          frequency,
          instructions,
          notes: notes.trim(),
          color,
        });
        setEditingMed(null);
      } else {
        await addMedicine({
          medicine_name: medicineName.trim(),
          dosage: dosage.trim(),
          reminder_times: allTimes,
          start_date: startDate,
          end_date: endDate,
          frequency,
          instructions,
          notes: notes.trim(),
          color,
          active: true,
        });
        onCloseAddModal();
      }
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMedicines = medicines.filter((m) =>
    m.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.dosage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFormOpen = isAddModalOpen || editingMed !== null;

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Medicine Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your prescriptions, reminder schedules and food instructions
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine or dosage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              // trigger add modal
              if (!isAddModalOpen) {
                // If caller gave us toggle
              }
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Pill className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {editingMed ? 'Edit Medicine Schedule' : 'Schedule New Medicine'}
                </h3>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  onCloseAddModal();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Medicine Name & Dosage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 mg or 1 Tablet"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Primary Reminder Time + Extra times */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Reminder Time(s) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddExtraTime}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Time
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      required
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium px-2">Primary</span>
                  </div>
                  {additionalTimes.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        required
                        value={t}
                        onChange={(e) => handleUpdateExtraTime(idx, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraTime(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition dark:hover:bg-rose-950/40"
                        title="Remove time"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frequency & Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Frequency *
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Once">Once (Single Dose)</option>
                    <option value="Daily">Daily (Every Day)</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Food Instructions *
                  </label>
                  <select
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value as InstructionType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Before Food">Before Food</option>
                    <option value="After Food">After Food</option>
                    <option value="With Food">With Food</option>
                    <option value="At Bedtime">At Bedtime</option>
                    <option value="None">None / General</option>
                  </select>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Color Tag & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Color Tag
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full transition transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Doctor's Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Take with warm water"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onCloseAddModal();
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  {editingMed ? 'Save Changes' : 'Save & Schedule Reminders'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medicines Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMedicines.map((med) => (
          <div
            key={med.id}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: med.color || '#2563eb' }}
                  />
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                      {med.medicine_name}
                    </h3>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {med.dosage}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditClick(med)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition dark:hover:bg-blue-950/40"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMedicine(med.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition dark:hover:bg-rose-950/40"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    Reminders:{' '}
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {med.reminder_times.join(', ')}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-slate-400" />
                  <span>Instruction: <strong className="text-slate-800 dark:text-slate-200">{med.instructions}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    {med.frequency} • {med.start_date} to {med.end_date}
                  </span>
                </div>
                {med.notes && (
                  <p className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs italic">
                    "{med.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                Active Schedule
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
