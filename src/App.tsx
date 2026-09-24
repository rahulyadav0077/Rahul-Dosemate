/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReminderProvider, useReminders } from './context/ReminderContext';
import { Dashboard } from './components/Dashboard';
import { MedicineManager } from './components/MedicineManager';
import { MedicineHistory } from './components/MedicineHistory';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { AiPrescriptionOcr } from './components/AiPrescriptionOcr';
import { AiAdvisor } from './components/AiAdvisor';
import { ActiveReminderModal } from './components/ActiveReminderModal';
import { AuthModal } from './components/AuthModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  Pill,
  Clock,
  History,
  Settings,
  Sparkles,
  Bot,
  User,
  LogOut,
  Bell,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

type TabType = 'dashboard' | 'medicines' | 'history' | 'ai';

const MainLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const { isAlarmPlaying, isVoiceSpeaking, currentTimeString } = useReminders();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">Loading DoseMate...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal isOpen={true} onClose={() => undefined} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      {/* Active Scheduled Reminder Modal (Alarms, Voice, Take, Snooze, Dismiss) */}
      <ActiveReminderModal />

      {/* Settings Modal */}
      <ReminderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* AI Prescription OCR Modal */}
      <AiPrescriptionOcr
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 dark:bg-slate-900/90 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  DoseMate
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Smart Reminder
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5">
                Alarm & Voice Assisted Healthcare
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTab === 'medicines'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Medicines
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              History & Logs
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3.5 py-1.5 rounded-xl transition inline-flex items-center gap-1 ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Clinical Advisor
            </button>
          </nav>

          {/* Right Action Icons: PWA Install, Settings, User Profile */}
          <div className="flex items-center gap-2.5">
            <PWAInstallButton />

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              title="Reminder & Voice Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden lg:block text-right">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {user.name}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 dark:bg-slate-900/95 dark:border-slate-800 flex justify-around p-2 text-[10px] font-bold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
          }`}
        >
          <Clock className="w-5 h-5" />
          Today
        </button>
        <button
          onClick={() => setActiveTab('medicines')}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === 'medicines' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
          }`}
        >
          <Pill className="w-5 h-5" />
          Medicines
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === 'history' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
          }`}
        >
          <History className="w-5 h-5" />
          History
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center gap-1 p-1 ${
            activeTab === 'ai' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          AI Advisor
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenAddMedicine={() => {
              setActiveTab('medicines');
              setIsAddMedicineOpen(true);
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenOcr={() => {
              setActiveTab('ai');
              setIsOcrOpen(true);
            }}
          />
        )}

        {activeTab === 'medicines' && (
          <MedicineManager
            isAddModalOpen={isAddMedicineOpen}
            onCloseAddModal={() => setIsAddMedicineOpen(false)}
          />
        )}

        {activeTab === 'history' && <MedicineHistory />}

        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AiAdvisor />
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      AI Prescription OCR Scanning
                    </h3>
                    <p className="text-xs text-slate-500">
                      Instantly convert physical medical prescriptions into scheduled alarms
                    </p>
                  </div>
                </div>

                <div className="py-6 space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p>
                    DoseMate's OCR module uses Google Gemini Vision to read handwritten or printed doctor prescriptions, identifying drug brand names, active salts, dosages (e.g. 500mg), intervals, and food timing directions (e.g. after food).
                  </p>
                  <div className="rounded-2xl bg-blue-50 dark:bg-slate-800 p-4 border border-blue-100 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      Key Features
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                      <li>Automatic schedule extraction (morning, afternoon, night)</li>
                      <li>Standardized food instruction detection</li>
                      <li>1-click injection into today's live reminder queue</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOcrOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-blue-500/20 text-xs transition cursor-pointer"
              >
                Launch Prescription Camera / Scanner
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>
          DoseMate &copy; 2026 • Smart Medicine Reminder, Alarm & Hindi/English Voice System
        </p>
        <p className="mt-1 text-[11px] text-slate-400/80">
          Designed for high accessibility, senior usability, and clinical adherence tracking.
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ReminderProvider>
        <MainLayout />
      </ReminderProvider>
    </AuthProvider>
  );
}
