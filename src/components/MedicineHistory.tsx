import React, { useState } from 'react';
import { useReminders } from '../context/ReminderContext';
import { MedicineHistory as HistoryType, ReminderStatus } from '../types';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Clock,
  Download,
  Search,
  Filter,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';

export const MedicineHistory: React.FC = () => {
  const { history } = useReminders();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter((item) => {
    const matchesFilter = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch =
      item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const exportCSV = () => {
    const headers = ['Medicine Name', 'Dosage', 'Scheduled Time', 'Action Time', 'Status', 'Instructions', 'Notes'];
    const rows = filteredHistory.map((item) => [
      `"${item.medicine_name}"`,
      `"${item.dosage}"`,
      `"${item.scheduled_time}"`,
      `"${item.action_time}"`,
      `"${item.status}"`,
      `"${item.instructions || ''}"`,
      `"${item.notes || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dosemate_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusBadge = (status: ReminderStatus) => {
    switch (status) {
      case 'Taken':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Taken
          </span>
        );
      case 'Missed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="w-3.5 h-3.5" /> Missed
          </span>
        );
      case 'Snoozed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <RotateCcw className="w-3.5 h-3.5" /> Snoozed
          </span>
        );
      case 'Dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <XCircle className="w-3.5 h-3.5" /> Dismissed
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const totalTaken = history.filter((h) => h.status === 'Taken').length;
  const totalMissed = history.filter((h) => h.status === 'Missed').length;
  const totalRecords = history.length;
  const compliancePercent = totalRecords > 0 ? Math.round((totalTaken / (totalTaken + totalMissed || 1)) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Medicine History & Audit Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified intake logs with scheduled vs actual action timestamps
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Download className="w-4 h-4 text-blue-600" />
          Export Doctor Report (CSV)
        </button>
      </div>

      {/* History Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Compliance</span>
          <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {compliancePercent}%
          </h3>
          <p className="text-xs text-slate-500 mt-1">Calculated across verified doses</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Taken</span>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalTaken} doses
          </h3>
          <p className="text-xs text-slate-500 mt-1">Acknowledged on time</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Missed</span>
          <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {totalMissed} doses
          </h3>
          <p className="text-xs text-slate-500 mt-1">Elapsed without response</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {['ALL', 'Taken', 'Missed', 'Snoozed', 'Dismissed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* History Log Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3.5 px-6">Medicine & Dosage</th>
                <th className="py-3.5 px-6">Scheduled Time</th>
                <th className="py-3.5 px-6">Action Time</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Notes / Food Timing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No history records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.medicine_name}
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {item.dosage}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">
                      {item.scheduled_time}
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {item.action_time}
                    </td>
                    <td className="py-4 px-6">{renderStatusBadge(item.status)}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                      {item.instructions && (
                        <span className="inline-block mr-2 font-semibold text-slate-700 dark:text-slate-300">
                          [{item.instructions}]
                        </span>
                      )}
                      {item.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
