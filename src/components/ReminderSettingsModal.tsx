import React, { useState } from 'react';
import { useReminders } from '../context/ReminderContext';
import { NotificationSettings } from '../types';
import { soundService } from '../services/soundService';
import { voiceService } from '../services/voiceService';
import {
  Bell,
  Volume2,
  Mic,
  Clock,
  Check,
  X,
  Play,
  Square,
  Info,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderSettingsModal: React.FC<ReminderSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings, notificationPermission, requestNotificationPermission } =
    useReminders();

  const [formData, setFormData] = useState<NotificationSettings>({ ...settings });
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);
  const [isSpeakingTestVoice, setIsSpeakingTestVoice] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSoundTest = () => {
    soundService.previewSound(formData.alarm_sound, formData.alarm_volume);
    setIsPlayingTestSound(true);
    setTimeout(() => setIsPlayingTestSound(false), 2500);
  };

  const handleVoiceTest = async () => {
    setIsSpeakingTestVoice(true);
    const text = voiceService.getAnnouncementText(
      'Paracetamol',
      '500 milligrams',
      formData.voice_language
    );
    await voiceService.speak(text, formData.voice_language, formData.alarm_volume);
    setIsSpeakingTestVoice(false);
  };

  const handleSave = async () => {
    await updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Reminder & Alarm Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure alarms, speech language, snooze preferences, and audio levels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="py-6 space-y-6">
          {/* Section 1: Core Toggles */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-5 space-y-4 border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Alert Channels
            </h4>

            {/* Browser Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    Browser Notifications
                  </span>
                  <span className="text-xs text-slate-500">
                    Status:{' '}
                    <strong className={notificationPermission === 'granted' ? 'text-emerald-600' : 'text-amber-600'}>
                      {notificationPermission}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={requestNotificationPermission}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Grant Permission
                  </button>
                )}
                <input
                  type="checkbox"
                  checked={formData.notifications_enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, notifications_enabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Audible Alarm Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    Audible Alarm Sound
                  </span>
                  <span className="text-xs text-slate-500">
                    Plays sound loop at scheduled reminder time
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.alarm_enabled}
                onChange={(e) => setFormData({ ...formData, alarm_enabled: e.target.checked })}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Voice Announcement Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    Speech & Voice Announcement
                  </span>
                  <span className="text-xs text-slate-500">
                    Announces medicine name and dosage out loud
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.voice_enabled}
                onChange={(e) => setFormData({ ...formData, voice_enabled: e.target.checked })}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Section 2: Audio & Voice Parameters */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audio & Speech Preferences
            </h4>

            {/* Alarm Sound Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Alarm Sound Tone
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.alarm_sound}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alarm_sound: e.target.value as NotificationSettings['alarm_sound'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="chime">Gentle Medical Chime</option>
                    <option value="digital">Urgent Digital Beep</option>
                    <option value="melodic">Marimba Melodic</option>
                    <option value="bell">Resonant Bell</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleSoundTest}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center gap-1 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Test
                  </button>
                </div>
              </div>

              {/* Voice Language Selection (English vs Hindi/Hinglish) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Voice Announcement Language
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.voice_language}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        voice_language: e.target.value as 'en' | 'hi',
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="en">English ("It is time to take your medicine...")</option>
                    <option value="hi">Hindi / Hinglish ("Medicine lene ka time ho gaya hai...")</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleVoiceTest}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center gap-1 transition"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {isSpeakingTestVoice ? 'Speaking...' : 'Test'}
                  </button>
                </div>
              </div>
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Alarm & Voice Volume: {formData.alarm_volume}%
                </label>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={formData.alarm_volume}
                onChange={(e) => setFormData({ ...formData, alarm_volume: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Snooze & Alarm Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Default Snooze Duration
                </label>
                <select
                  value={formData.snooze_duration}
                  onChange={(e) =>
                    setFormData({ ...formData, snooze_duration: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes (Default)</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Alarm Duration / Missed Timeout
                </label>
                <select
                  value={formData.alarm_duration}
                  onChange={(e) =>
                    setFormData({ ...formData, alarm_duration: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={1}>1 Minute</option>
                  <option value={2}>2 Minutes (Recommended)</option>
                  <option value={3}>3 Minutes</option>
                  <option value={5}>5 Minutes</option>
                </select>
                <span className="text-xs text-slate-400 mt-1 block">
                  After this window, unhandled reminders auto-record as Missed.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Browser Background Limitations & Architecture Note (Requirements 12 & 13) */}
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 text-xs space-y-2 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4" />
              <span>Browser Background Notification Architecture Note</span>
            </div>
            <p className="leading-relaxed">
              DoseMate uses the <strong>Browser Notification API</strong> and a registered <strong>Service Worker</strong> for cross-tab and background notification delivery.
            </p>
            <p className="leading-relaxed text-amber-800/90 dark:text-amber-300/90">
              <strong>Browser Limitation:</strong> Modern browsers suspend JavaScript timers and audio contexts if the browser process is completely closed or deeply battery-throttled by the operating system. When tabs become visible again, DoseMate automatically catches up and fires any due reminders. For production mobile alerts, this codebase is structured to connect to Web Push / FCM.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
