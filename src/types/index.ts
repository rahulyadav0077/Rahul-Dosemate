export type FrequencyType = 'Once' | 'Daily' | 'Weekly' | 'Custom';

export type InstructionType = 'Before Food' | 'After Food' | 'With Food' | 'At Bedtime' | 'None';

export type ReminderStatus = 'Pending' | 'Taken' | 'Snoozed' | 'Missed' | 'Dismissed';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Medicine {
  id: string;
  user_id: string;
  medicine_name: string;
  dosage: string;
  instructions: InstructionType;
  start_date: string;
  end_date: string;
  frequency: FrequencyType;
  reminder_times: string[]; // e.g. ["09:00", "21:00"]
  color?: string;
  notes?: string;
  active: boolean;
  created_at?: string;
}

export interface Reminder {
  id: string;
  medicine_id: string;
  user_id: string;
  reminder_time: string; // HH:mm
  frequency: FrequencyType;
  status: ReminderStatus;
  snooze_until: string | null; // ISO timestamp string if snoozed
  enabled: boolean;
  date: string; // YYYY-MM-DD
  medicine_name: string;
  dosage: string;
  instructions: InstructionType;
  color?: string;
  triggered_at?: string | null;
}

export interface MedicineHistory {
  id: string;
  medicine_id: string;
  user_id: string;
  medicine_name: string;
  dosage: string;
  scheduled_time: string;
  action_time: string;
  status: ReminderStatus;
  instructions?: string;
  notes?: string;
  created_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  alarm_enabled: boolean;
  voice_enabled: boolean;
  alarm_volume: number; // 0 to 100
  alarm_sound: 'chime' | 'digital' | 'melodic' | 'bell';
  voice_language: 'en' | 'hi'; // English or Hindi/Hinglish
  snooze_duration: number; // minutes: 5, 10, 15, 30
  alarm_duration: number; // minutes: 1, 2, 3, 5 (auto-mark missed after this)
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface OcrExtractedMedicine {
  medicine_name: string;
  dosage: string;
  frequency: FrequencyType;
  instructions: InstructionType;
  reminder_times: string[];
  notes?: string;
}
