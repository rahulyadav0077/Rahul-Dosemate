import cors from 'cors';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory / file persistent DB store
const DATA_FILE = path.resolve('./dosemate_data.json');

interface DatabaseSchema {
  users: any[];
  medicines: any[];
  reminders: any[];
  history: any[];
  settings: any;
}

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch {
      // fallback
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const initialData: DatabaseSchema = {
    users: [],
    medicines: [
      {
        id: 'med-1',
        user_id: 'user-demo-1',
        medicine_name: 'Paracetamol',
        dosage: '500 mg',
        instructions: 'After Food',
        start_date: today,
        end_date: '2026-12-31',
        frequency: 'Daily',
        reminder_times: ['10:00', '20:00'],
        color: '#3b82f6',
        notes: 'For mild fever and post-lunch headaches',
        active: true,
      },
      {
        id: 'med-2',
        user_id: 'user-demo-1',
        medicine_name: 'Vitamin D3',
        dosage: '1 Tablet',
        instructions: 'With Food',
        start_date: today,
        end_date: '2026-12-31',
        frequency: 'Daily',
        reminder_times: ['14:00'],
        color: '#10b981',
        notes: 'Bone strength supplement',
        active: true,
      },
      {
        id: 'med-3',
        user_id: 'user-demo-1',
        medicine_name: 'Amoxicillin Antibiotic',
        dosage: '250 mg',
        instructions: 'Before Food',
        start_date: today,
        end_date: '2026-10-15',
        frequency: 'Daily',
        reminder_times: ['08:00', '20:00'],
        color: '#f59e0b',
        notes: 'Complete entire course as directed by doctor',
        active: true,
      },
    ],
    reminders: [
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
    ],
    history: [
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
        notes: 'Taken with water after lunch',
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
    ],
    settings: {
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
    },
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  return initialData;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to write database file:', e);
  }
}

let db = loadDatabase();

const DEMO_EMAIL = 'demo@dosemate.app';
const DEMO_PASSWORD = 'DemoPass123!';

function ensureDemoUser() {
  if (!db.users.some((u: any) => u.email === DEMO_EMAIL)) {
    db.users.push({
      id: 'user-demo-1',
      name: 'Demo User',
      email: DEMO_EMAIL,
      password_hash: hashPassword(DEMO_PASSWORD),
      token: null,
    });
    saveDatabase(db);
  }
}

ensureDemoUser();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function normalizeName(name: string) {
  return String(name || '').trim();
}

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function validatePassword(password: string) {
  return typeof password === 'string' && PASSWORD_PATTERN.test(password);
}

function createToken(userId: string) {
  return `jwt-${crypto.randomUUID()}-${userId}`;
}

function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const user = db.users.find((u: any) => u.token === token);
  if (!user) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  req.user = user;
  next();
}

// --- Auth Routes ---
app.post('/api/auth/login', (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  const user = db.users.find((u: any) => u.email === email);
  if (!user || hashPassword(password) !== user.password_hash) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = createToken(user.id);
  user.token = token;
  saveDatabase(db);

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

app.post('/api/auth/register', (req, res) => {
  const name = normalizeName(req.body.name);
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirmPassword || '');

  if (!name) {
    return res.status(400).json({ message: 'Please enter your name.' });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  if (db.users.some((u: any) => u.email === email)) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    password_hash: hashPassword(password),
    token: null,
  };
  db.users.push(newUser);
  saveDatabase(db);

  const token = createToken(newUser.id);
  newUser.token = token;
  saveDatabase(db);

  return res.json({
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email },
  });
});

// --- Medicines Routes ---
app.get('/api/medicines', requireAuth, (_req, res) => {
  return res.json(db.medicines.filter((m: any) => m.user_id === (res.locals?.user?.id || _req.user?.id)));
});

app.post('/api/medicines', requireAuth, (req, res) => {
  const userId = req.user.id;
  const medicine = {
    ...req.body,
    user_id: userId,
    id: req.body.id || `med-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  db.medicines.unshift(medicine);

  // Generate today's reminders
  const today = new Date().toISOString().slice(0, 10);
  for (const time of medicine.reminder_times || []) {
    const reminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
    db.reminders.push(reminder);
  }

  saveDatabase(db);
  return res.json(medicine);
});

app.put('/api/medicines/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const idx = db.medicines.findIndex((m: any) => m.id === id && m.user_id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Medicine not found' });

  db.medicines[idx] = { ...db.medicines[idx], ...req.body, user_id: req.user.id };
  saveDatabase(db);
  return res.json(db.medicines[idx]);
});

app.delete('/api/medicines/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.medicines = db.medicines.filter((m: any) => !(m.id === id && m.user_id === req.user.id));
  db.reminders = db.reminders.filter((r: any) => !(r.medicine_id === id && r.user_id === req.user.id));
  saveDatabase(db);
  return res.json({ success: true });
});

// --- Reminders Routes ---
app.get('/api/reminders/today', requireAuth, (req, res) => {
  return res.json(db.reminders.filter((r: any) => r.user_id === req.user.id));
});

app.get('/api/reminders/upcoming', requireAuth, (req, res) => {
  const upcoming = db.reminders.filter(
    (r: any) => r.user_id === req.user.id && (r.status === 'Pending' || r.status === 'Snoozed')
  );
  return res.json(upcoming);
});

app.post('/api/reminders/:id/taken', requireAuth, (req, res) => {
  const { id } = req.params;
  const { action_time, notes } = req.body;
  const reminder = db.reminders.find((r) => r.id === id);
  if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

  reminder.status = 'Taken';
  reminder.snooze_until = null;

  const now = new Date();
  const timeString = action_time || `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

  db.history.unshift({
    id: `hist-${Date.now()}`,
    medicine_id: reminder.medicine_id,
    user_id: reminder.user_id,
    medicine_name: reminder.medicine_name,
    dosage: reminder.dosage,
    scheduled_time: `${reminder.date} ${reminder.reminder_time}`,
    action_time: timeString,
    status: 'Taken',
    instructions: reminder.instructions,
    notes: notes || 'Taken on time',
    created_at: new Date().toISOString(),
  });

  saveDatabase(db);
  return res.json(reminder);
});

app.post('/api/reminders/:id/missed', requireAuth, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const reminder = db.reminders.find((r: any) => r.id === id && r.user_id === req.user.id);
  if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

  reminder.status = 'Missed';
  reminder.snooze_until = null;

  const now = new Date();
  db.history.unshift({
    id: `hist-${Date.now()}`,
    medicine_id: reminder.medicine_id,
    user_id: reminder.user_id,
    medicine_name: reminder.medicine_name,
    dosage: reminder.dosage,
    scheduled_time: `${reminder.date} ${reminder.reminder_time}`,
    action_time: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`,
    status: 'Missed',
    instructions: reminder.instructions,
    notes: reason || 'User did not respond within reminder window',
    created_at: new Date().toISOString(),
  });

  saveDatabase(db);
  return res.json(reminder);
});

app.post('/api/reminders/:id/snooze', requireAuth, (req, res) => {
  const { id } = req.params;
  const { snooze_until } = req.body;
  const reminder = db.reminders.find((r: any) => r.id === id && r.user_id === req.user.id);
  if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

  reminder.status = 'Snoozed';
  reminder.snooze_until = snooze_until;
  saveDatabase(db);
  return res.json(reminder);
});

app.post('/api/reminders/:id/dismiss', requireAuth, (req, res) => {
  const { id } = req.params;
  const reminder = db.reminders.find((r: any) => r.id === id && r.user_id === req.user.id);
  if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

  reminder.status = 'Dismissed';
  reminder.snooze_until = null;

  const now = new Date();
  db.history.unshift({
    id: `hist-${Date.now()}`,
    medicine_id: reminder.medicine_id,
    user_id: reminder.user_id,
    medicine_name: reminder.medicine_name,
    dosage: reminder.dosage,
    scheduled_time: `${reminder.date} ${reminder.reminder_time}`,
    action_time: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`,
    status: 'Dismissed',
    instructions: reminder.instructions,
    notes: 'User dismissed the alarm',
    created_at: new Date().toISOString(),
  });

  saveDatabase(db);
  return res.json(reminder);
});

// --- History & Settings ---
app.get('/api/history', requireAuth, (req, res) => {
  return res.json(db.history.filter((h: any) => h.user_id === req.user.id));
});

app.get('/api/settings', requireAuth, (req, res) => {
  return res.json({ ...db.settings, user_id: req.user.id });
});

app.put('/api/settings', requireAuth, (req, res) => {
  db.settings = { ...db.settings, ...req.body, user_id: req.user.id };
  saveDatabase(db);
  return res.json(db.settings);
});

// --- AI / OCR Routes with Gemini ---
app.post('/api/ai/ocr-prescription', async (req, res) => {
  const { imageBase64 } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      medicines: [
        {
          medicine_name: 'Paracetamol',
          dosage: '500 mg',
          frequency: 'Daily',
          instructions: 'After Food',
          reminder_times: ['10:00', '20:00'],
          notes: 'Analgesic',
        },
        {
          medicine_name: 'Amoxicillin',
          dosage: '250 mg',
          frequency: 'Daily',
          instructions: 'Before Food',
          reminder_times: ['08:00', '20:00'],
          notes: 'Antibiotic Course',
        },
      ],
    });
  }

  try {
    const ai = new GoogleGenAI();
    // Strip header
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const prompt = `Analyze this prescription or medicine packaging image. Extract the list of medicines as a clean JSON array with fields:
    - medicine_name (string)
    - dosage (string, e.g. "500 mg", "1 Tablet")
    - frequency (one of: "Once", "Daily", "Weekly", "Custom")
    - instructions (one of: "Before Food", "After Food", "With Food", "At Bedtime", "None")
    - reminder_times (array of string times in HH:mm format, e.g. ["09:00", "21:00"])
    - notes (short description or purpose)
    Return valid JSON only matching: { "medicines": [...] }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            { text: prompt },
          ],
        },
      ],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err) {
    console.error('OCR analysis error:', err);
    return res.json({
      medicines: [
        {
          medicine_name: 'Paracetamol',
          dosage: '500 mg',
          frequency: 'Daily',
          instructions: 'After Food',
          reminder_times: ['10:00', '20:00'],
          notes: 'Analgesic',
        },
      ],
    });
  }
});

app.post('/api/ai/consult', async (req, res) => {
  const { query, medicines } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      response: `Clinical Review for your medicines (${medicines.map((m: any) => m.medicine_name).join(', ')}):
• Ensure proper hydration and adhere to food timing instructions.
• Paracetamol: Do not exceed 4000mg/day.
• Antibiotics: Always complete full prescribed duration.
• Contact your physician for personalized medical diagnosis.`,
    });
  }

  try {
    const ai = new GoogleGenAI();
    const medSummary = (medicines || [])
      .map((m: any) => `${m.medicine_name} ${m.dosage} (${m.instructions})`)
      .join('; ');

    const prompt = `You are DoseMate AI Clinical Advisor. The user is currently prescribed: [${medSummary}].
User question: "${query}".
Provide a concise, compassionate, clinical answer emphasizing food timing, drug interactions, and safe practices. End with an appropriate medical disclaimer.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ response: response.text });
  } catch (err) {
    console.error('AI consult error:', err);
    return res.json({
      response:
        'Please take your medications as directed by your physician with adequate water. For specific clinical questions, please consult your doctor or pharmacist.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DoseMate server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
