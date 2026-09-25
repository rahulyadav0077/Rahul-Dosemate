// DoseMate API Client Service
// Integrates with backend endpoints (/api/*) with local offline sync & pre-seeded demonstration data

import {
  AuthResponse,
  Medicine,
  MedicineHistory,
  NotificationSettings,
  Reminder,
  User,
} from '../types';

const API_BASE = 'https://rahul-dosemate-backend.onrender.com/api';
const TOKEN_KEY = 'dosemate_jwt_token';
const USER_KEY = 'dosemate_user_data';
const MEDICINES_KEY = 'dosemate_medicines_v1';
const REMINDERS_KEY = 'dosemate_reminders_v1';
const HISTORY_KEY = 'dosemate_history_v1';
const SETTINGS_KEY = 'dosemate_settings_v1';

// Format current time HH:mm
export function getCurrentTimeHHMM(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getCurrentDateYYYYMMDD(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  id: 'settings-1',
  user_id: 'user-demo-1',
  notifications_enabled: true,
  alarm_enabled: true,
  voice_enabled: true,
  alarm_volume: 85,
  alarm_sound: 'chime',
  voice_language: 'en',
  snooze_duration: 10,
  alarm_duration: 2,
};

const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    user_id: 'user-demo-1',
    medicine_name: 'Paracetamol',
    dosage: '500 mg',
    instructions: 'After Food',
    start_date: getCurrentDateYYYYMMDD(),
    end_date: '2026-12-31',
    frequency: 'Daily',
    reminder_times: ['10:00', '20:00'],
    color: '#3b82f6', // blue
    notes: 'For mild fever and post-lunch headaches',
    active: true,
  },
  {
    id: 'med-2',
    user_id: 'user-demo-1',
    medicine_name: 'Vitamin D3',
    dosage: '1 Tablet',
    instructions: 'With Food',
    start_date: getCurrentDateYYYYMMDD(),
    end_date: '2026-12-31',
    frequency: 'Daily',
    reminder_times: ['14:00'],
    color: '#10b981', // green
    notes: 'Bone strength supplement',
    active: true,
  },
  {
    id: 'med-3',
    user_id: 'user-demo-1',
    medicine_name: 'Amoxicillin Antibiotic',
    dosage: '250 mg',
    instructions: 'Before Food',
    start_date: getCurrentDateYYYYMMDD(),
    end_date: '2026-10-15',
    frequency: 'Daily',
    reminder_times: ['08:00', '20:00'],
    color: '#f59e0b', // amber
    notes: 'Complete entire course as directed by doctor',
    active: true,
  },
];

// Helper to seed localStorage
function initializeStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(MEDICINES_KEY)) {
    localStorage.setItem(MEDICINES_KEY, JSON.stringify(INITIAL_MEDICINES));
  }

  if (!localStorage.getItem(SETTINGS_KEY)) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }

  if (!localStorage.getItem(REMINDERS_KEY)) {
    const today = getCurrentDateYYYYMMDD();
    // Pre-seed today's reminders matching user prompt's dashboard example:
    // Paracetamol 500mg at 10:00 AM Pending
    // Vitamin D 1 Tablet at 2:00 PM Taken
    // Antibiotic 250mg at 8:00 AM Missed
    const reminders: Reminder[] = [
      {
        id: 'rem-1',
        medicine_id: 'med-1',
        user_id: 'user-demo-1',
        reminder_time: '10:00',
        frequency: 'Daily',
        status: 'Pending',
        snooze_until: null,
        enabled: true,
        date: today,
        medicine_name: 'Paracetamol',
        dosage: '500 mg',
        instructions: 'After Food',
        color: '#3b82f6',
      },
      {
        id: 'rem-2',
        medicine_id: 'med-2',
        user_id: 'user-demo-1',
        reminder_time: '14:00',
        frequency: 'Daily',
        status: 'Taken',
        snooze_until: null,
        enabled: true,
        date: today,
        medicine_name: 'Vitamin D3',
        dosage: '1 Tablet',
        instructions: 'With Food',
        color: '#10b981',
      },
      {
        id: 'rem-3',
        medicine_id: 'med-3',
        user_id: 'user-demo-1',
        reminder_time: '08:00',
        frequency: 'Daily',
        status: 'Missed',
        snooze_until: null,
        enabled: true,
        date: today,
        medicine_name: 'Amoxicillin Antibiotic',
        dosage: '250 mg',
        instructions: 'Before Food',
        color: '#f59e0b',
      },
    ];
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  }

  if (!localStorage.getItem(HISTORY_KEY)) {
    const today = getCurrentDateYYYYMMDD();
    const history: MedicineHistory[] = [
      {
        id: 'hist-1',
        medicine_id: 'med-2',
        user_id: 'user-demo-1',
        medicine_name: 'Vitamin D3',
        dosage: '1 Tablet',
        scheduled_time: `${today} 14:00`,
        action_time: `${today} 14:05`,
        status: 'Taken',
        instructions: 'With Food',
        notes: 'Taken with glass of water after lunch',
        created_at: new Date().toISOString(),
      },
      {
        id: 'hist-2',
        medicine_id: 'med-3',
        user_id: 'user-demo-1',
        medicine_name: 'Amoxicillin Antibiotic',
        dosage: '250 mg',
        scheduled_time: `${today} 08:00`,
        action_time: `${today} 08:45`,
        status: 'Missed',
        instructions: 'Before Food',
        notes: 'User did not respond within reminder window',
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}

initializeStorage();

class ApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private hasAuthenticatedSession(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  private getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> | null {
    if (!this.hasAuthenticatedSession()) return null;
    return {
      Authorization: `Bearer ${this.getToken()}`,
      ...extraHeaders,
    };
  }

  private setToken(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  public getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  // --- Auth Endpoints ---
  public async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.token || !data?.user) {
      throw new Error(data?.message || 'Invalid email or password.');
    }

    this.setToken(data.token, data.user);
    return data;
  }

  public async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword: password }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.token || !data?.user) {
      throw new Error(data?.message || 'Registration failed.');
    }

    this.setToken(data.token, data.user);
    return data;
  }

  // --- Medicines Endpoints ---
  public async getMedicines(): Promise<Medicine[]> {
    const authHeaders = this.getAuthHeaders();
    if (!authHeaders) {
      const local = localStorage.getItem(MEDICINES_KEY);
      return local ? JSON.parse(local) : INITIAL_MEDICINES;
    }

    try {
      const res = await fetch(`${API_BASE}/medicines`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(MEDICINES_KEY, JSON.stringify(data));
        return data;
      }
    } catch {
      // fallback to storage
    }
    const local = localStorage.getItem(MEDICINES_KEY);
    return local ? JSON.parse(local) : INITIAL_MEDICINES;
  }

  public async createMedicine(medicineData: Omit<Medicine, 'id' | 'user_id'>): Promise<Medicine> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required.');
    }

    const newMedicine: Medicine = {
      ...medicineData,
      id: `med-${Date.now()}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    const authHeaders = this.getAuthHeaders({ 'Content-Type': 'application/json' });
    if (!authHeaders) {
      throw new Error('Authentication required.');
    }

    try {
      const res = await fetch(`${API_BASE}/medicines`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(newMedicine),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    // Save locally
    const meds = await this.getMedicines();
    const updated = [newMedicine, ...meds];
    localStorage.setItem(MEDICINES_KEY, JSON.stringify(updated));

    // Also generate today's reminders for this new medicine
    await this.generateRemindersForMedicine(newMedicine);

    return newMedicine;
  }

  public async updateMedicine(id: string, updateData: Partial<Medicine>): Promise<Medicine> {
    const authHeaders = this.getAuthHeaders({ 'Content-Type': 'application/json' });
    if (!authHeaders) {
      throw new Error('Authentication required.');
    }

    try {
      const res = await fetch(`${API_BASE}/medicines/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(updateData),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const meds = await this.getMedicines();
    const index = meds.findIndex((m) => m.id === id);
    if (index !== -1) {
      meds[index] = { ...meds[index], ...updateData };
      localStorage.setItem(MEDICINES_KEY, JSON.stringify(meds));
      return meds[index];
    }
    throw new Error('Medicine not found');
  }

  public async deleteMedicine(id: string): Promise<boolean> {
    const authHeaders = this.getAuthHeaders();
    if (!authHeaders) {
      return true;
    }

    try {
      await fetch(`${API_BASE}/medicines/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
    } catch {
      // fallback
    }

    const meds = await this.getMedicines();
    const filtered = meds.filter((m) => m.id !== id);
    localStorage.setItem(MEDICINES_KEY, JSON.stringify(filtered));

    // Also remove associated pending reminders
    const reminders = await this.getReminders();
    const filteredReminders = reminders.filter((r) => r.medicine_id !== id);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(filteredReminders));

    return true;
  }

  // --- Reminders Endpoints ---
  public async getReminders(): Promise<Reminder[]> {
    const authHeaders = this.getAuthHeaders();
    if (!authHeaders) {
      const local = localStorage.getItem(REMINDERS_KEY);
      return local ? JSON.parse(local) : [];
    }

    try {
      const res = await fetch(`${API_BASE}/reminders/today`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(data));
        return data;
      }
    } catch {
      // fallback
    }
    const local = localStorage.getItem(REMINDERS_KEY);
    return local ? JSON.parse(local) : [];
  }

  // Generate reminders for today from a medicine
  public async generateRemindersForMedicine(medicine: Medicine): Promise<Reminder[]> {
    const today = getCurrentDateYYYYMMDD();
    const reminders = await this.getReminders();
    const newReminders: Reminder[] = [];

    for (const time of medicine.reminder_times) {
      // Check if reminder already exists for today
      const exists = reminders.some(
        (r) => r.medicine_id === medicine.id && r.date === today && r.reminder_time === time
      );
      if (!exists) {
        const r: Reminder = {
          id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          medicine_id: medicine.id,
          user_id: medicine.user_id,
          reminder_time: time,
          frequency: medicine.frequency,
          status: 'Pending',
          snooze_until: null,
          enabled: true,
          date: today,
          medicine_name: medicine.medicine_name,
          dosage: medicine.dosage,
          instructions: medicine.instructions,
          color: medicine.color || '#3b82f6',
        };
        newReminders.push(r);
      }
    }

    const updated = [...reminders, ...newReminders];
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    return updated;
  }

  public async saveReminders(reminders: Reminder[]): Promise<void> {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  }

  // Mark medicine as Taken
  public async markTaken(reminderId: string, notes?: string): Promise<Reminder> {
    const now = new Date();
    const actionTime = `${getCurrentDateYYYYMMDD(now)} ${getCurrentTimeHHMM(now)}`;

    const authHeaders = this.getAuthHeaders({ 'Content-Type': 'application/json' });
    if (!authHeaders) {
      throw new Error('Authentication required.');
    }

    try {
      const res = await fetch(`${API_BASE}/reminders/${reminderId}/taken`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ action_time: actionTime, notes }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const reminders = await this.getReminders();
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) throw new Error('Reminder not found');

    reminder.status = 'Taken';
    reminder.snooze_until = null;
    await this.saveReminders(reminders);

    // Record in History
    await this.addHistoryEntry({
      medicine_id: reminder.medicine_id,
      medicine_name: reminder.medicine_name,
      dosage: reminder.dosage,
      scheduled_time: `${reminder.date} ${reminder.reminder_time}`,
      action_time: actionTime,
      status: 'Taken',
      instructions: reminder.instructions,
      notes: notes || 'Taken on time',
    });

    return reminder;
  }

  // Mark medicine as Missed
  public async markMissed(reminderId: string, reason?: string): Promise<Reminder> {
    const now = new Date();
    const actionTime = `${getCurrentDateYYYYMMDD(now)} ${getCurrentTimeHHMM(now)}`;

    const authHeaders = this.getAuthHeaders({ 'Content-Type': 'application/json' });
    if (!authHeaders) {
      throw new Error('Authentication required.');
    }

    try {
      const res = await fetch(`${API_BASE}/reminders/${reminderId}/missed`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reason }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const reminders = await this.getReminders();
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) throw new Error('Reminder not found');

    reminder.status = 'Missed';
    reminder.snooze_until = null;
    await this.saveReminders(reminders);

    // Record in History
    await this.addHistoryEntry({
      medicine_id: reminder.medicine_id,
      medicine_name: reminder.medicine_name,
      dosage: reminder.dosage,
      scheduled_time: `${reminder.date} ${reminder.reminder_time}`,
      action_time: actionTime,
      status: 'Missed',
      instructions: reminder.instructions,
      notes: reason || 'Not taken within reminder window',
    });

    return reminder;
  }

  // Snooze reminder for X minutes
  public async snoozeReminder(reminderId: string, minutes: number): Promise<Reminder> {
    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);
    const snoozeUntilIso = snoozeDate.toISOString();

    const authHeaders = this.getAuthHeaders({ 'Content-Type': 'application/json' });
    if (!authHeaders) {
      throw new Error('Authentication required.');
    }

    try {
      const res = await fetch(`${API_BASE}/reminders/${reminderId}/snooze`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ minutes, snooze_until: snoozeUntilIso }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const reminders = await this.getReminders();
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) throw new Error('Reminder not found');

    reminder.status = 'Snoozed';
    reminder.snooze_until = snoozeUntilIso;
    await this.saveReminders(reminders);

    return reminder;
  }

  // Dismiss reminder
  public async dismissReminder(reminderId: string): Promise<Reminder> {
    const now = new Date();
    const actionTime = `${getCurrentDateYYYYMMDD(now)} ${getCurrentTimeHHMM(now)}`;

    const authHeaders = this.getAuthHeaders({ 'Content-Type': 'application/json' });
    if (!authHeaders) {
      throw new Error('Authentication required.');
    }

    try {
      const res = await fetch(`${API_BASE}/reminders/${reminderId}/dismiss`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const reminders = await this.getReminders();
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) throw new Error('Reminder not found');

    reminder.status = 'Dismissed';
    reminder.snooze_until = null;
    await this.saveReminders(reminders);

    // Record in History
    await this.addHistoryEntry({
      medicine_id: reminder.medicine_id,
      medicine_name: reminder.medicine_name,
      dosage: reminder.dosage,
      scheduled_time: `${reminder.date} ${reminder.reminder_time}`,
      action_time: actionTime,
      status: 'Dismissed',
      instructions: reminder.instructions,
      notes: 'User dismissed the alarm',
    });

    return reminder;
  }

  // --- Medicine History ---
  public async getHistory(): Promise<MedicineHistory[]> {
    const authHeaders = this.getAuthHeaders();
    if (!authHeaders) {
      const local = localStorage.getItem(HISTORY_KEY);
      return local ? JSON.parse(local) : [];
    }

    try {
      const res = await fetch(`${API_BASE}/history`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
        return data;
      }
    } catch {
      // fallback
    }
    const local = localStorage.getItem(HISTORY_KEY);
    return local ? JSON.parse(local) : [];
  }

  public async addHistoryEntry(
    entry: Omit<MedicineHistory, 'id' | 'user_id' | 'created_at'>
  ): Promise<MedicineHistory> {
    const user = this.getCurrentUser() || DEFAULT_USER;
    const newEntry: MedicineHistory = {
      ...entry,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    const history = await this.getHistory();
    const updated = [newEntry, ...history];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return newEntry;
  }

  // --- Notification Settings ---
  public async getSettings(): Promise<NotificationSettings> {
    const authHeaders = this.getAuthHeaders();
    if (!authHeaders) {
      const local = localStorage.getItem(SETTINGS_KEY);
      return local ? JSON.parse(local) : DEFAULT_SETTINGS;
    }

    try {
      const res = await fetch(`${API_BASE}/settings`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
        return data;
      }
    } catch {
      // fallback
    }
    const local = localStorage.getItem(SETTINGS_KEY);
    return local ? JSON.parse(local) : DEFAULT_SETTINGS;
  }

  public async updateSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    const authHeaders = this.getAuthHeaders({ 'Content-Type': 'application/json' });
    if (!authHeaders) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return settings;
    }

    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(settings),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  }

  // --- AI / OCR Endpoint ---
  public async analyzePrescription(imageBase64: string): Promise<any> {
    const authHeaders = this.getAuthHeaders({ 'Content-Type': 'application/json' });
    if (!authHeaders) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/ai/ocr-prescription`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ imageBase64 }),
    });
    if (!res.ok) {
      throw new Error('Failed to analyze prescription');
    }
    return await res.json();
  }

  // --- AI Medicine Interaction & Advice ---
  public async consultMedicineAi(query: string, currentMeds: Medicine[]): Promise<string> {
    const authHeaders = this.getAuthHeaders({ 'Content-Type': 'application/json' });
    if (!authHeaders) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/ai/consult`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query, medicines: currentMeds }),
    });
    if (!res.ok) {
      throw new Error('Failed to consult AI');
    }
    const data = await res.json();
    return data.response;
  }
}

export const api = new ApiService();
