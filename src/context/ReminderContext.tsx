import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Medicine, MedicineHistory, NotificationSettings, Reminder } from '../types';
import { api, getCurrentDateYYYYMMDD, getCurrentTimeHHMM } from '../services/api';
import { soundService } from '../services/soundService';
import { voiceService } from '../services/voiceService';
import { notificationService, NotificationPermissionStatus } from '../services/notificationService';
import confetti from 'canvas-confetti';

interface ReminderContextType {
  medicines: Medicine[];
  reminders: Reminder[];
  history: MedicineHistory[];
  settings: NotificationSettings;
  activeAlert: Reminder | null;
  notificationPermission: NotificationPermissionStatus;
  isAlarmPlaying: boolean;
  isVoiceSpeaking: boolean;
  lastMissedAlert: Reminder | null;
  currentTimeString: string;
  refreshAllData: () => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermissionStatus>;
  handleTaken: (reminderId: string, notes?: string) => Promise<void>;
  handleSnooze: (reminderId: string, minutes?: number) => Promise<void>;
  handleDismiss: (reminderId: string) => Promise<void>;
  updateSettings: (newSettings: NotificationSettings) => Promise<void>;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'user_id'>) => Promise<Medicine>;
  updateMedicine: (id: string, data: Partial<Medicine>) => Promise<Medicine>;
  deleteMedicine: (id: string) => Promise<void>;
  triggerTestReminderNow: (medicineName?: string, dosage?: string) => void;
  triggerFinalScenario2Min: () => Promise<void>;
  stopActiveAlerts: () => void;
  clearLastMissedAlert: () => void;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [history, setHistory] = useState<MedicineHistory[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
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
  });

  const [activeAlert, setActiveAlert] = useState<Reminder | null>(null);
  const [lastMissedAlert, setLastMissedAlert] = useState<Reminder | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus>('default');
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [currentTimeString, setCurrentTimeString] = useState('');

  // Keep track of triggered reminder IDs today so we don't trigger repeatedly in the same minute
  const triggeredMapRef = useRef<{ [reminderId: string]: string }>({});
  // Timeout ref for missed detection
  const missedTimeoutRef = useRef<number | null>(null);
  // Settings ref to access fresh settings in intervals
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Refresh all state
  const refreshAllData = useCallback(async () => {
    try {
      const [mList, rList, hList, sData] = await Promise.all([
        api.getMedicines(),
        api.getReminders(),
        api.getHistory(),
        api.getSettings(),
      ]);
      setMedicines(mList);
      setReminders(rList);
      setHistory(hList);
      setSettings(sData);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, []);

  // Initialize
  useEffect(() => {
    refreshAllData();
    setNotificationPermission(notificationService.getPermissionStatus());

    // Listen for Service Worker postMessage actions
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'DOSEMATE_NOTIFICATION_ACTION') {
        const { action, reminderId } = event.data;
        if (action === 'taken' && reminderId) {
          handleTaken(reminderId);
        } else if (action === 'snooze' && reminderId) {
          handleSnooze(reminderId);
        } else if (action === 'dismiss' && reminderId) {
          handleDismiss(reminderId);
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    // Audio unlock on first user click anywhere in the window
    const unlockAudioOnce = () => {
      soundService.unlockAudio();
      window.removeEventListener('click', unlockAudioOnce);
      window.removeEventListener('keydown', unlockAudioOnce);
      window.removeEventListener('touchstart', unlockAudioOnce);
    };
    window.addEventListener('click', unlockAudioOnce);
    window.addEventListener('keydown', unlockAudioOnce);
    window.addEventListener('touchstart', unlockAudioOnce);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
      window.removeEventListener('click', unlockAudioOnce);
      window.removeEventListener('keydown', unlockAudioOnce);
      window.removeEventListener('touchstart', unlockAudioOnce);
    };
  }, [refreshAllData]);

  // Stop active alarms and voice
  const stopActiveAlerts = useCallback(() => {
    soundService.stopAlarm();
    voiceService.stop();
    setIsAlarmPlaying(false);
    setIsVoiceSpeaking(false);
    if (missedTimeoutRef.current) {
      window.clearTimeout(missedTimeoutRef.current);
      missedTimeoutRef.current = null;
    }
  }, []);

  // Trigger alert sequence for a reminder
  const triggerReminderAlert = useCallback(async (reminder: Reminder) => {
    const currentSettings = settingsRef.current;
    setActiveAlert(reminder);

    // 1. Browser Notification
    if (currentSettings.notifications_enabled) {
      await notificationService.showMedicineNotification({
        medicineName: reminder.medicine_name,
        dosage: reminder.dosage,
        time: reminder.reminder_time,
        instructions: reminder.instructions,
        reminderId: reminder.id,
        medicineId: reminder.medicine_id,
      });
    }

    // 2. Alarm Sound
    if (currentSettings.alarm_enabled) {
      setIsAlarmPlaying(true);
      soundService.startAlarm(
        currentSettings.alarm_sound,
        currentSettings.alarm_volume,
        currentSettings.alarm_duration * 60
      );
    }

    // 3. Voice Announcement
    if (currentSettings.voice_enabled) {
      setIsVoiceSpeaking(true);
      const text = voiceService.getAnnouncementText(
        reminder.medicine_name,
        reminder.dosage,
        currentSettings.voice_language
      );
      voiceService.speak(text, currentSettings.voice_language, currentSettings.alarm_volume).finally(() => {
        setIsVoiceSpeaking(false);
      });
    }

    // 4. Set auto-missed timer if user does not respond within alarm_duration minutes
    if (missedTimeoutRef.current) {
      window.clearTimeout(missedTimeoutRef.current);
    }
    const missedTimeoutMs = Math.max(30, currentSettings.alarm_duration * 60) * 1000;
    missedTimeoutRef.current = window.setTimeout(async () => {
      stopActiveAlerts();
      setActiveAlert(null);
      // Mark as missed
      const updated = await api.markMissed(reminder.id, 'User did not respond within the reminder window');
      setLastMissedAlert(reminder);
      setReminders((prev) => prev.map((r) => (r.id === reminder.id ? updated : r)));
      const freshHistory = await api.getHistory();
      setHistory(freshHistory);
    }, missedTimeoutMs);
  }, [stopActiveAlerts]);

  // Master Heartbeat: Check every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const today = getCurrentDateYYYYMMDD(now);
      const currentTime = getCurrentTimeHHMM(now);
      const timeWithSeconds = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCurrentTimeString(timeWithSeconds);

      // If an alert is already active, don't overlap with another alert
      if (activeAlert) return;

      const currentReminders = reminders;
      const nowTimeMs = now.getTime();

      for (const reminder of currentReminders) {
        if (!reminder.enabled) continue;

        // Check Snoozed reminder: check if snooze_until <= now
        if (reminder.status === 'Snoozed' && reminder.snooze_until) {
          const snoozeDate = new Date(reminder.snooze_until).getTime();
          if (nowTimeMs >= snoozeDate) {
            // Re-trigger alert
            triggerReminderAlert(reminder);
            break;
          }
        }

        // Check Pending reminder: check if scheduled date is today and time matches
        if (reminder.status === 'Pending' && reminder.date === today) {
          const key = `${reminder.id}-${today}-${currentTime}`;
          if (reminder.reminder_time === currentTime && !triggeredMapRef.current[key]) {
            triggeredMapRef.current[key] = new Date().toISOString();
            triggerReminderAlert(reminder);
            break;
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reminders, activeAlert, triggerReminderAlert]);

  // User selects "Taken"
  const handleTaken = async (reminderId: string, notes?: string) => {
    stopActiveAlerts();
    setActiveAlert(null);

    const updated = await api.markTaken(reminderId, notes);
    setReminders((prev) => prev.map((r) => (r.id === reminderId ? updated : r)));
    const freshHistory = await api.getHistory();
    setHistory(freshHistory);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // ignore
    }
  };

  // User selects "Snooze"
  const handleSnooze = async (reminderId: string, minutes?: number) => {
    stopActiveAlerts();
    setActiveAlert(null);

    const snoozeMins = minutes || settings.snooze_duration || 10;
    const updated = await api.snoozeReminder(reminderId, snoozeMins);
    setReminders((prev) => prev.map((r) => (r.id === reminderId ? updated : r)));
  };

  // User selects "Dismiss"
  const handleDismiss = async (reminderId: string) => {
    stopActiveAlerts();
    setActiveAlert(null);

    const updated = await api.dismissReminder(reminderId);
    setReminders((prev) => prev.map((r) => (r.id === reminderId ? updated : r)));
    const freshHistory = await api.getHistory();
    setHistory(freshHistory);
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    const status = await notificationService.requestPermission();
    setNotificationPermission(status);
    return status;
  };

  // Update Settings
  const updateSettings = async (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    await api.updateSettings(newSettings);
  };

  // Add Medicine
  const addMedicine = async (medData: Omit<Medicine, 'id' | 'user_id'>) => {
    const created = await api.createMedicine(medData);
    await refreshAllData();
    return created;
  };

  // Update Medicine
  const updateMedicine = async (id: string, data: Partial<Medicine>) => {
    const updated = await api.updateMedicine(id, data);
    await refreshAllData();
    return updated;
  };

  // Delete Medicine
  const deleteMedicine = async (id: string) => {
    await api.deleteMedicine(id);
    await refreshAllData();
  };

  // Test Reminder immediately (Test Tool)
  const triggerTestReminderNow = (medicineName = 'Paracetamol', dosage = '500 mg') => {
    const testReminder: Reminder = {
      id: `test-rem-${Date.now()}`,
      medicine_id: 'med-test',
      user_id: 'user-demo-1',
      reminder_time: getCurrentTimeHHMM(),
      frequency: 'Once',
      status: 'Pending',
      snooze_until: null,
      enabled: true,
      date: getCurrentDateYYYYMMDD(),
      medicine_name: medicineName,
      dosage: dosage,
      instructions: 'After Food',
      color: '#3b82f6',
    };
    triggerReminderAlert(testReminder);
  };

  // Trigger College Final Test Scenario:
  // Paracetamol 500mg, 2 minutes from now, Once frequency
  const triggerFinalScenario2Min = async () => {
    const targetDate = new Date(Date.now() + 2 * 60 * 1000);
    const targetTime = getCurrentTimeHHMM(targetDate);
    const today = getCurrentDateYYYYMMDD();

    // Create or find medicine
    const med = await addMedicine({
      medicine_name: 'Paracetamol',
      dosage: '500 mg',
      instructions: 'After Food',
      start_date: today,
      end_date: today,
      frequency: 'Once',
      reminder_times: [targetTime],
      notes: 'Final Scenario Demonstration Medicine',
      color: '#2563eb',
      active: true,
    });

    await refreshAllData();
  };

  const clearLastMissedAlert = () => setLastMissedAlert(null);

  return (
    <ReminderContext.Provider
      value={{
        medicines,
        reminders,
        history,
        settings,
        activeAlert,
        notificationPermission,
        isAlarmPlaying,
        isVoiceSpeaking,
        lastMissedAlert,
        currentTimeString,
        refreshAllData,
        requestNotificationPermission,
        handleTaken,
        handleSnooze,
        handleDismiss,
        updateSettings,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        triggerTestReminderNow,
        triggerFinalScenario2Min,
        stopActiveAlerts,
        clearLastMissedAlert,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (!context) throw new Error('useReminders must be used within a ReminderProvider');
  return context;
};
