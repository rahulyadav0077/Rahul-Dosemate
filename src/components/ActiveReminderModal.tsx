import React, { useState, useEffect } from 'react';
import { useReminders } from '../context/ReminderContext';
import { Bell, Check, Clock, Volume2, X, AlertTriangle, Utensils } from 'lucide-react';

export const ActiveReminderModal: React.FC = () => {
  const {
    activeAlert,
    settings,
    isAlarmPlaying,
    isVoiceSpeaking,
    handleTaken,
    handleSnooze,
    handleDismiss,
    stopActiveAlerts,
  } = useReminders();

  const [selectedSnoozeMin, setSelectedSnoozeMin] = useState(settings.snooze_duration || 10);
  const [secondsRemaining, setSecondsRemaining] = useState((settings.alarm_duration || 2) * 60);

  useEffect(() => {
    setSelectedSnoozeMin(settings.snooze_duration || 10);
    setSecondsRemaining((settings.alarm_duration || 2) * 60);
  }, [activeAlert, settings]);

  // Countdown timer for visual awareness before auto-missed
  useEffect(() => {
    if (!activeAlert) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeAlert]);

  if (!activeAlert) return null;

  const totalSeconds = (settings.alarm_duration || 2) * 60;
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-4 ring-blue-500/30 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 animate-scale-up">
        {/* Top Urgency Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <Bell className="h-7 w-7 text-white animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500"></span>
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  DoseMate Scheduled Alert
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  💊 Take Your Medicine
                </h2>
              </div>
            </div>

            {/* Silence Audio button if user needs quick quiet while deciding */}
            {(isAlarmPlaying || isVoiceSpeaking) && (
              <button
                onClick={stopActiveAlerts}
                title="Mute alarm sound"
                className="flex items-center space-x-1 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25 transition"
              >
                <Volume2 className="h-4 w-4" />
                <span>Mute</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar to auto-missed */}
        <div className="w-full bg-slate-100 h-1.5 dark:bg-slate-800">
          <div
            className="h-1.5 bg-gradient-to-r from-blue-500 to-amber-500 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Main Medicine Display Card */}
          <div className="rounded-2xl bg-blue-50/70 p-6 border border-blue-100 dark:bg-slate-800/60 dark:border-slate-700/60 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs mb-3 dark:bg-blue-900/40 dark:text-blue-300">
              <Clock className="w-3.5 h-3.5" />
              Scheduled for {activeAlert.reminder_time}
            </div>

            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeAlert.medicine_name}
            </h3>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center text-lg font-bold text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-xl shadow-xs border border-blue-200 dark:border-slate-700">
                Dosage: {activeAlert.dosage}
              </span>

              {activeAlert.instructions && activeAlert.instructions !== 'None' && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/50 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <Utensils className="w-4 h-4" />
                  {activeAlert.instructions}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              "Your medicine time has arrived. Please take your scheduled medicine with water."
            </p>
          </div>

          {/* Voice & Sound Indicators */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isAlarmPlaying ? 'bg-amber-500 animate-ping' : 'bg-slate-300'}`} />
              <span>Alarm Sound: {isAlarmPlaying ? 'Playing' : 'Active / Ready'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isVoiceSpeaking ? 'bg-blue-500 animate-ping' : 'bg-slate-300'}`} />
              <span>Voice Announcement: {settings.voice_language === 'hi' ? 'Hindi' : 'English'}</span>
            </div>
          </div>

          {/* Action Buttons - Large and Senior Accessible */}
          <div className="space-y-3 pt-2">
            {/* BIG PRIMARY TAKEN BUTTON */}
            <button
              onClick={() => handleTaken(activeAlert.id)}
              className="w-full group flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:scale-110 transition">
                <Check className="h-5 w-5 text-white stroke-[3]" />
              </div>
              <span>TAKE MEDICINE (TAKEN)</span>
            </button>

            {/* Secondary Actions: Snooze & Dismiss */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Snooze button with quick duration select */}
              <div className="flex rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => handleSnooze(activeAlert.id, selectedSnoozeMin)}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold px-4 py-3 text-sm transition dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/70"
                >
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Snooze {selectedSnoozeMin}m</span>
                </button>
                <select
                  aria-label="Snooze duration in minutes"
                  value={selectedSnoozeMin}
                  onChange={(e) => setSelectedSnoozeMin(Number(e.target.value))}
                  className="bg-amber-100/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs px-2 font-medium border-l border-amber-200 dark:border-amber-800 cursor-pointer outline-none"
                >
                  <option value={5}>5m</option>
                  <option value={10}>10m</option>
                  <option value={15}>15m</option>
                  <option value={30}>30m</option>
                </select>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(activeAlert.id)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 px-4 py-3 text-sm font-semibold transition"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Dismiss</span>
              </button>
            </div>
          </div>

          {/* Missed Warning Notification */}
          <div className="text-center pt-1">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Unanswered reminders automatically record as <span className="font-semibold text-rose-500">Missed</span> after{' '}
              {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
