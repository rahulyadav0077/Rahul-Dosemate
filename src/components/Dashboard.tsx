import React, { useState } from 'react';
import { useReminders } from '../context/ReminderContext';
import { Reminder, ReminderStatus } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Bell,
  Play,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Check,
  RotateCcw,
} from 'lucide-react';

interface DashboardProps {
  onOpenAddMedicine: () => void;
  onOpenSettings: () => void;
  onOpenOcr: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAddMedicine,
  onOpenSettings,
  onOpenOcr,
}) => {
  const {
    reminders,
    history,
    notificationPermission,
    requestNotificationPermission,
    handleTaken,
    handleSnooze,
    triggerTestReminderNow,
    triggerFinalScenario2Min,
    lastMissedAlert,
    clearLastMissedAlert,
    currentTimeString,
  } = useReminders();

  const [selectedReminderForDetail, setSelectedReminderForDetail] = useState<Reminder | null>(null);

  // Status statistics
  const totalToday = reminders.length;
  const takenToday = reminders.filter((r) => r.status === 'Taken').length;
  const missedToday = reminders.filter((r) => r.status === 'Missed').length;
  const pendingToday = reminders.filter((r) => r.status === 'Pending').length;
  const snoozedToday = reminders.filter((r) => r.status === 'Snoozed').length;

  const adherenceRate = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0;

  // Find next upcoming pending reminder
  const upcomingReminders = reminders
    .filter((r) => r.status === 'Pending' || r.status === 'Snoozed')
    .sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));
  const nextReminder = upcomingReminders[0];

  // Status Badge Component
  const renderStatusBadge = (status: ReminderStatus) => {
    switch (status) {
      case 'Taken':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Taken
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'Snoozed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <RotateCcw className="w-3.5 h-3.5" />
            Snoozed
          </span>
        );
      case 'Missed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3.5 h-3.5" />
            Missed
          </span>
        );
      case 'Dismissed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <XCircle className="w-3.5 h-3.5" />
            Dismissed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Missed Medicine Alert Banner (Requirement 9) */}
      {lastMissedAlert && (
        <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 p-4 text-rose-900 flex items-start justify-between shadow-xs dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200 animate-slide-down">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base flex items-center gap-2">
                ⚠ Medicine Missed
              </h4>
              <p className="text-sm mt-0.5">
                <span className="font-semibold">{lastMissedAlert.medicine_name}</span> ({lastMissedAlert.dosage}) was scheduled for{' '}
                <span className="font-semibold">{lastMissedAlert.reminder_time}</span> and was not marked as taken.
              </p>
            </div>
          </div>
          <button
            onClick={clearLastMissedAlert}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 p-1"
            title="Dismiss notice"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Notification Permission Notice */}
      {notificationPermission !== 'granted' && (
        <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 dark:bg-slate-800/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Enable Browser Medicine Alerts</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Allow desktop notifications to receive alerts when it is time to take your medicine even if you switch tabs.
              </p>
            </div>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* Quick Test Demo Bar (College Demo / Evaluation Accelerator) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Demo & Evaluation Testing
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live System Time: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{currentTimeString || '00:00:00'}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => triggerTestReminderNow('Paracetamol', '500 mg')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
              title="Trigger browser notification, alarm sound, and voice announcement right now"
            >
              <Play className="w-3.5 h-3.5 fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400" />
              Test Alarm & Voice Now
            </button>
            <button
              onClick={triggerFinalScenario2Min}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              title="Schedule Paracetamol 500mg 2 minutes from now (Final Test Scenario Requirement)"
            >
              <Clock className="w-3.5 h-3.5" />
              Schedule 2-Min Final Test Scenario
            </button>
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Adherence Rate */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Today's Adherence
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {adherenceRate}%
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {takenToday} of {totalToday} doses completed
            </p>
          </div>
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <TrendingUp className="h-7 w-7" />
          </div>
        </div>

        {/* Pending Medicines */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Pending Doses
            </p>
            <h3 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {pendingToday + snoozedToday}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {snoozedToday > 0 ? `${snoozedToday} currently snoozed` : 'Scheduled for today'}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock className="h-7 w-7" />
          </div>
        </div>

        {/* Taken Medicines */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Taken on Time
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {takenToday}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Recorded in history
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
        </div>

        {/* Missed Medicines */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Missed Doses
            </p>
            <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {missedToday}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Unanswered reminders
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <AlertCircle className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Next Up Hero Card */}
      {nextReminder && (
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md mb-2">
                <Clock className="w-3.5 h-3.5" />
                Next Scheduled Dose
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {nextReminder.medicine_name} — {nextReminder.dosage}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Scheduled at <span className="font-bold text-white">{nextReminder.reminder_time}</span>
                {nextReminder.instructions && nextReminder.instructions !== 'None' && ` • ${nextReminder.instructions}`}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => handleTaken(nextReminder.id)}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl shadow-lg transition"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Take Now
              </button>
              <button
                onClick={() => handleSnooze(nextReminder.id, 10)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-2xl backdrop-blur-md transition text-sm"
              >
                Snooze 10m
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Today's Medicines Table (Requirement 10) */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Today's Medicines
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live schedule, real-time reminder state and adherence actions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddMedicine}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              Add Medicine
            </button>
            <button
              onClick={onOpenOcr}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
            >
              <Sparkles className="w-4 h-4" />
              Scan Prescription
            </button>
          </div>
        </div>

        {/* Table representation matching requirement 10 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800">
                <th className="py-3.5 px-6">Medicine</th>
                <th className="py-3.5 px-6">Dosage</th>
                <th className="py-3.5 px-6">Time</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {reminders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No scheduled medicines for today. Click "Add Medicine" to begin!
                  </td>
                </tr>
              ) : (
                reminders.map((reminder) => (
                  <tr
                    key={reminder.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: reminder.color || '#3b82f6' }}
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {reminder.medicine_name}
                          </span>
                          {reminder.instructions && reminder.instructions !== 'None' && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {reminder.instructions}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                      {reminder.dosage}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                      {reminder.reminder_time}
                    </td>
                    <td className="py-4 px-6">
                      {renderStatusBadge(reminder.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {reminder.status === 'Pending' || reminder.status === 'Snoozed' ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleTaken(reminder.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Take
                          </button>
                          <button
                            onClick={() => setSelectedReminderForDetail(reminder)}
                            className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedReminderForDetail(reminder)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                        >
                          View
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Detail Modal */}
      {selectedReminderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                Medicine Details
              </h4>
              <button
                onClick={() => setSelectedReminderForDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Medicine Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedReminderForDetail.medicine_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Dosage:</span>
                <span className="font-semibold">{selectedReminderForDetail.dosage}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Scheduled Time:</span>
                <span className="font-semibold">{selectedReminderForDetail.reminder_time}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Food Instruction:</span>
                <span className="font-semibold">{selectedReminderForDetail.instructions || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Status:</span>
                <div>{renderStatusBadge(selectedReminderForDetail.status)}</div>
              </div>
              {selectedReminderForDetail.status === 'Snoozed' && selectedReminderForDetail.snooze_until && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Snoozed Until:</span>
                  <span className="font-mono text-xs text-amber-600">
                    {new Date(selectedReminderForDetail.snooze_until).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-3 flex gap-2">
              {selectedReminderForDetail.status !== 'Taken' && (
                <button
                  onClick={() => {
                    handleTaken(selectedReminderForDetail.id);
                    setSelectedReminderForDetail(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Mark as Taken
                </button>
              )}
              <button
                onClick={() => setSelectedReminderForDetail(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
