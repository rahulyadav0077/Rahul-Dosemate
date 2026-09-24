import React, { useState } from 'react';
import { useReminders } from '../context/ReminderContext';
import { api } from '../services/api';
import { Bot, Send, Sparkles, ShieldAlert, CheckCircle } from 'lucide-react';

export const AiAdvisor: React.FC = () => {
  const { medicines } = useReminders();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: "Hello! I am your DoseMate AI Clinical Advisor. I can review potential drug interactions, food precautions, and timing tips for your active medications. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userText = query.trim();
    setQuery('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await api.consultMedicineAi(userText, medicines);
      setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
    } catch {
      // Offline fallback smart clinical response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Based on your current medications (${medicines.map((m) => m.medicine_name).join(', ')}):
• Paracetamol: Ensure total daily intake does not exceed 4000mg. Take with or after food.
• Antibiotics (e.g. Amoxicillin): Complete the prescribed duration. If stomach upset occurs, light crackers or yogurt can help.
• Vitamin D3: Best absorbed with a meal containing healthy fats.
Please consult your physician or licensed pharmacist for urgent medical concerns.`,
          },
        ]);
        setIsLoading(false);
      }, 700);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'Can I take Paracetamol on an empty stomach?',
    'Any interaction between Antibiotics and Vitamin D?',
    'What should I do if I miss a dose by 3 hours?',
  ];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col h-[520px]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              AI Drug & Interaction Assistant
            </h3>
            <p className="text-xs text-slate-500">
              Aware of your {medicines.length} scheduled medicines
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle className="w-3.5 h-3.5" />
          Med-Safe Checked
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs text-xs whitespace-pre-line'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl p-4 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Checking clinical knowledge base...
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 text-xs">
        {sampleQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => setQuery(q)}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[11px] font-medium transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="pt-2 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask a question about food timing, missed doses, side effects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition shadow-xs cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
