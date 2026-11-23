import { supabase } from '@/lib/supabase'
import { addDaysISO, fromInputLocal, todayISO } from '@/lib/time'

/** A full example semester: every page of the app gets something to show. Every row is flagged is_demo,
 *  so "Clear demo data" removes exactly these and never touches real data. Dates are relative to today. */
const D = (v: unknown) => ({ ...(v as object), is_demo: true })
async function ins<T>(table: string, rows: object[]): Promise<T[]> {
  if (!rows.length) return []
  const { data, error } = await supabase.from(table).insert(rows.map(D), { defaultToNull: false }).select() // columns a row leaves out get the database default
  if (error) throw error
  return (data ?? []) as T[]
}
type Id = { id: string }
const pick = <T,>(xs: T[], i: number) => xs[((i % xs.length) + xs.length) % xs.length]
/** Small deterministic noise so the charts look lived-in rather than random each time. */
const wave = (i: number, a = 1) => Math.sin(i * 1.7) * 0.5 + Math.sin(i * 0.53 + 1) * 0.5 * a

export async function seedDemo(tz: string): Promise<void> {
  const today = todayISO(tz), day = (n: number) => addDaysISO(today, n)
  const at = (days: number, hm: string) => fromInputLocal(`${day(days)}T${hm}`, tz)
  const month0 = today.slice(0, 8) + '01'

  // ---------- semesters, breaks, courses, timetable ----------
  const { data: cur } = await supabase.from('semesters').select('id').eq('is_current', true).is('deleted_at', null)
  const [past, sem] = await ins<Id>('semesters', [
    { name: 'Demo: Semester 1', start_date: day(-210), end_date: day(-100), is_current: false },
    { name: 'Demo: Semester 2', start_date: day(-35), end_date: day(70), is_current: !(cur && cur.length) },
  ])
  await ins('semester_breaks', [{ semester_id: sem.id, name: 'Mid-semester break', start_date: day(21), end_date: day(27) }])
  const courses = await ins<Id & { code: string }>('courses', [
    { code: 'COMP2041', name: 'Software Construction', semester_id: sem.id, color: '#8B83C8', lecturer: 'Dr Nguyen', credit_points: 6, target_grade: 'D' },
    { code: 'MATH1231', name: 'Calculus & Linear Algebra', semester_id: sem.id, color: '#7FA3C7', lecturer: 'Prof. Tran', credit_points: 6, target_grade: 'Cr' },
    { code: 'ECON1101', name: 'Microeconomics', semester_id: sem.id, color: '#8FAE8F', lecturer: 'Dr Lee', credit_points: 6, target_grade: 'D' },
    { code: 'CHIN1000', name: 'Chinese Communication 1', semester_id: sem.id, color: '#D9A3B0', lecturer: 'Li Laoshi', credit_points: 6, target_grade: 'HD' },
  ])
  const pastCourses = await ins<Id>('courses', [
    { code: 'COMP1511', name: 'Programming Fundamentals', semester_id: past.id, color: '#E3B48F', credit_points: 6 },
    { code: 'MATH1131', name: 'Mathematics 1A', semester_id: past.id, color: '#CDBE8A', credit_points: 6 },
    { code: 'ACCT1501', name: 'Accounting & Financial Mgt', semester_id: past.id, color: '#86B8B2', credit_points: 6 },
  ])
  await ins('course_results', [
    { course_id: pastCourses[0].id, final_grade: 'HD', final_mark: 88, credit_points: 6 },
    { course_id: pastCourses[1].id, final_grade: 'Cr', final_mark: 68, credit_points: 6 },
    { course_id: pastCourses[2].id, final_grade: 'D', final_mark: 77, credit_points: 6 },
  ])
  const slots: [number, string, string, string, string][] = [
    [1, 'lecture', '09:00', '11:00', 'Ainsworth G03'], [3, 'practical', '14:00', '16:00', 'K17 Lab 2'],
    [2, 'lecture', '10:00', '12:00', 'Mathews A'], [4, 'tutorial', '13:00', '14:00', 'Quad 1042'],
    [2, 'lecture', '15:00', '17:00', 'Law Theatre G04'], [5, 'tutorial', '11:00', '12:00', 'Quad 1048'],
    [1, 'workshop', '13:00', '15:00', 'Webster 250'], [4, 'tutorial', '09:00', '10:00', 'Webster 327'],
  ]
  await ins('course_meetings', slots.map(([weekday, type, start_time, end_time, location], i) => ({ course_id: courses[Math.floor(i / 2)].id, type, weekday, start_time, end_time, location })))

  // ---------- deadlines (every type, status and urgency) ----------
  const dl = await ins<Id>('deadlines', [
    { title: 'Demo: Assignment 1 — shell scripting', course_id: courses[0].id, type: 'assignment', due_at: at(-12, '17:00'), priority: 'high', status: 'submitted', progress_percent: 100, weight_percent: 15 },
    { title: 'Demo: Problem set 3', course_id: courses[1].id, type: 'assignment', due_at: at(-1, '23:59'), priority: 'high', status: 'in_progress', progress_percent: 70, weight_percent: 5 },
    { title: 'Demo: Online quiz 4', course_id: courses[2].id, type: 'quiz', due_at: at(0, '22:00'), priority: 'medium', status: 'not_started', weight_percent: 5 },
    { title: 'Demo: Assignment 2 — Python tool', course_id: courses[0].id, type: 'assignment', due_at: at(3, '17:00'), priority: 'high', status: 'in_progress', progress_percent: 35, weight_percent: 20 },
    { title: 'Demo: Oral presentation', course_id: courses[3].id, type: 'presentation', due_at: at(6, '13:00'), priority: 'medium', status: 'not_started', weight_percent: 15, location: 'Webster 327' },
    { title: 'Demo: Essay — market failure', course_id: courses[2].id, type: 'assignment', due_at: at(12, '23:59'), priority: 'medium', status: 'not_started', weight_percent: 25 },
    { title: 'Demo: Mid-term exam', course_id: courses[1].id, type: 'exam', due_at: at(17, '09:00'), priority: 'high', status: 'not_started', weight_percent: 30, location: 'Roundhouse' },
    { title: 'Demo: Final exam', course_id: courses[0].id, type: 'exam', due_at: at(60, '13:30'), priority: 'high', status: 'not_started', weight_percent: 45, location: 'Main Hall' },
  ])

  // ---------- tasks (today, overdue, upcoming, someday, done) with subtasks ----------
  const tasks = await ins<Id>('tasks', [
    { title: 'Demo: Finish problem set 3 Q4–Q6', course_id: courses[1].id, deadline_id: dl[1].id, due_date: today, is_top: true, priority: 'high', category: 'study' },
    { title: 'Demo: Write tests for Assignment 2', course_id: courses[0].id, deadline_id: dl[3].id, due_date: today, is_top: true, priority: 'high', category: 'study' },
    { title: 'Demo: Practise presentation intro in Chinese', course_id: courses[3].id, deadline_id: dl[4].id, due_date: today, priority: 'medium', category: 'study' },
    { title: 'Demo: Reply to group chat about the report', due_date: today, priority: 'low', category: 'admin' },
    { title: 'Demo: Pay phone bill', due_date: day(-2), priority: 'medium', category: 'personal' },
    { title: 'Demo: Read chapter 7 (elasticity)', course_id: courses[2].id, due_date: day(-1), category: 'study' },
    { title: 'Demo: Essay outline', course_id: courses[2].id, deadline_id: dl[5].id, due_date: day(2), priority: 'medium', category: 'study' },
    { title: 'Demo: Book mid-term revision room', course_id: courses[1].id, due_date: day(4), category: 'admin' },
    { title: 'Demo: Shift at the café', due_date: day(5), category: 'work' },
    { title: 'Demo: Make mid-term summary sheet', course_id: courses[1].id, deadline_id: dl[6].id, due_date: day(10), priority: 'high', category: 'study' },
    { title: 'Demo: Update résumé for internships', category: 'personal' },
    { title: 'Demo: Watch Lecture 6 recording', course_id: courses[0].id, status: 'done', completed_at: at(0, '08:30'), category: 'study' },
    { title: 'Demo: Submit Assignment 1', course_id: courses[0].id, deadline_id: dl[0].id, status: 'done', completed_at: at(-12, '16:20'), category: 'study' },
    { title: 'Demo: Buy groceries', status: 'done', completed_at: at(-1, '18:00'), category: 'personal' },
  ])
  await ins('subtasks', [
    ...['Q4 integration by parts', 'Q5 eigenvalues', 'Q6 proof', 'Check answers with key'].map((title, i) => ({ task_id: tasks[0].id, title, is_done: i < 1, position: i })),
    ...['Unit tests for parser', 'Edge cases', 'Run style checker'].map((title, i) => ({ task_id: tasks[1].id, title, is_done: i < 2, position: i })),
    ...['Thesis sentence', 'Three arguments', 'Find 5 sources'].map((title, i) => ({ task_id: tasks[6].id, title, is_done: false, position: i })),
  ])

  // ---------- personal calendar: recurring and one-off ----------
  await ins('events', [
    { title: 'Demo: Gym', type: 'personal', start_at: at(0, '07:00'), end_at: at(0, '08:00'), time_zone: tz, repeat_rule: { freq: 'weekly', interval: 1, by_weekday: [1, 3, 5] } },
    { title: 'Demo: Café shift', type: 'work', start_at: at(-1, '17:00'), end_at: at(-1, '21:00'), time_zone: tz, repeat_rule: { freq: 'weekly', interval: 1, by_weekday: [6] } },
    { title: 'Demo: Study group', type: 'learn', start_at: at(1, '16:00'), end_at: at(1, '18:00'), time_zone: tz, location: 'Library L3' },
    { title: 'Demo: Dinner with friends', type: 'personal', start_at: at(3, '19:00'), end_at: at(3, '21:30'), time_zone: tz },
    { title: 'Demo: Internship info night', type: 'other', start_at: at(8, '18:00'), end_at: at(8, '20:00'), time_zone: tz, location: 'Roundhouse' },
    { title: 'Demo: Sleep', type: 'routine', start_at: at(0, '23:00'), end_at: at(1, '06:45'), time_zone: tz, repeat_rule: { freq: 'daily', interval: 1 } },
  ])

  // ---------- grades: assessments for every current course ----------
  const assess: [number, string, number, number | null, number, boolean?][] = [
    [0, 'Assignment 1', 15, 17, 20], [0, 'Assignment 2', 20, null, 100], [0, 'Weekly labs', 20, 34, 40], [0, 'Final exam', 45, null, 100, true],
    [1, 'Problem sets', 15, 22, 30], [1, 'Mid-term exam', 30, null, 60], [1, 'Final exam', 55, null, 100, true],
    [2, 'Online quizzes', 15, 11, 15], [2, 'Essay', 25, null, 100], [2, 'Tutorial participation', 10, 8, 10], [2, 'Final exam', 50, null, 100],
    [3, 'Character tests', 20, 19, 20], [3, 'Oral presentation', 15, null, 20], [3, 'Listening test', 25, 21, 25], [3, 'Final exam', 40, null, 100],
  ]
  await ins('assessments', assess.map(([c, name, weight_pct, mark, max_mark, hurdle]) => ({ course_id: courses[c].id, name, weight_pct, mark, max_mark, ...(hurdle ? { hurdle: true, hurdle_min_pct: 40 } : {}) })))

  // ---------- notes ----------
  await ins('notes', [
    { title: 'Demo: Lecture 5 — Regular expressions', course_id: courses[0].id, pinned: true, body: '# Regex cheatsheet\n\n- `^` start, `$` end\n- `\\d+` one or more digits\n- `(a|b)` either\n\n- [x] Rewatch the demo\n- [ ] Try the 10 practice questions\n\n**Exam tip:** know greedy vs lazy matching.' },
    { title: 'Demo: Eigenvalues in 5 lines', course_id: courses[1].id, body: '# Eigenvalues\n\n1. Solve det(A − λI) = 0\n2. For each λ solve (A − λI)v = 0\n3. Check: Av = λv\n\n> If A is triangular, the eigenvalues are on the diagonal.' },
    { title: 'Demo: Essay plan — market failure', course_id: courses[2].id, task_id: tasks[6].id, body: '# Plan\n\n- **Intro:** define market failure\n- **Body 1:** externalities (pollution)\n- **Body 2:** public goods\n- **Body 3:** information asymmetry\n- **Conclusion:** when government helps, when it hurts' },
    { title: 'Demo: 自我介绍 draft', course_id: courses[3].id, body: '# 自我介绍\n\n大家好！我叫 Kayden。我是大学生，我学习经济和电脑。我喜欢旅游和音乐。谢谢！' },
    { title: 'Demo: Weekly reflection', body: '# This week\n\n- Went to every lecture ✅\n- Slept late twice, felt it\n- Next week: start the essay early' },
  ])

  // ---------- study sessions: 4 weeks, every course and mode (fills Analytics + streaks) ----------
  const sessions: object[] = []
  for (let d = -27; d <= 0; d++) {
    const n = d === 0 ? 1 : Math.max(0, Math.round(1.6 + wave(d, 1.2) * 1.4))
    for (let k = 0; k < n; k++) {
      const c = pick(courses, d + k * 3), mode = pick(['pomodoro', 'pomodoro', 'deep_work', 'custom'], d + k), mins = mode === 'deep_work' ? 50 : mode === 'custom' ? 40 : 25
      const start = `${String(9 + k * 3 + (Math.abs(d) % 2)).padStart(2, '0')}:${k % 2 ? '30' : '00'}`, s = at(d, start)
      sessions.push({ course_id: c.id, mode, goal: pick(['Problem set', 'Revise notes', 'Assignment work', 'Flashcards', 'Readings'], d + k), started_at: s, ended_at: new Date(+new Date(s) + mins * 60000).toISOString(), focus_seconds: mins * 60 })
    }
  }
  await ins('study_sessions', sessions)

  // ---------- well-being: 30 days of check-ins (skips days you already logged), habits ----------
  const { data: haveCk } = await supabase.from('daily_checkins').select('date').gte('date', day(-29))
  const logged = new Set((haveCk ?? []).map((r: { date: string }) => r.date))
  const notes = ['Good lecture today', 'Tired after the café shift', 'Gym felt great', 'Stressed about the mid-term', 'Calm, productive day', 'Late night coding']
  await ins('daily_checkins', Array.from({ length: 30 }, (_, i) => day(-i)).filter((d) => !logged.has(d)).map((date, i) => ({
    date, mood: Math.min(5, Math.max(1, Math.round(3.4 + wave(i) * 1.4))), energy: Math.min(5, Math.max(1, Math.round(3 + wave(i + 4) * 1.5))),
    sleep_hours: Math.round((7 + wave(i + 2) * 1.4) * 2) / 2, water_ml: Math.round((1700 + wave(i + 7) * 700) / 250) * 250, note: i % 4 === 0 ? pick(notes, i) : null,
  })))
  const habits = await ins<Id>('habits', ['Demo: Read 20 minutes', 'Demo: Exercise', 'Demo: No phone after 11pm', 'Demo: 10 new words'].map((name, i) => ({ name, sort_order: 100 + i })))
  await ins('habit_logs', habits.flatMap((h, hi) => Array.from({ length: 21 }, (_, i) => ({ habit_id: h.id, date: day(-i), done: true, keep: wave(i + hi * 5) > -0.25 + hi * 0.1 }))
    .filter((r) => r.keep).map(({ keep: _k, ...r }) => r)))

  // ---------- finance: income, rent, bills, daily spending over ~2 months, budgets ----------
  const { data: cats } = await supabase.from('finance_categories').select('id,name,kind').is('deleted_at', null)
  const catId = async (name: string, kind: 'expense' | 'income', color: string) => {
    const found = (cats ?? []).find((c: { name: string; kind: string }) => c.name.toLowerCase() === name.toLowerCase() && c.kind === kind) as Id | undefined
    if (found) return found.id
    const [c] = await ins<Id>('finance_categories', [{ name, kind, color, sort_order: 50 }]); return c.id
  }
  const C = {
    salary: await catId('Salary', 'income', '#5FA88A'), food: await catId('Food', 'expense', '#E3B48F'), transport: await catId('Transport', 'expense', '#7FA3C7'),
    rent: await catId('Rent', 'expense', '#8B83C8'), study: await catId('Study', 'expense', '#CDBE8A'), social: await catId('Social', 'expense', '#D9A3B0'), health: await catId('Health', 'expense', '#86B8B2'), shopping: await catId('Shopping', 'expense', '#CDBE8A'),
  }
  const rec = await ins<Id>('recurring_transactions', [
    { title: 'Demo: Café wages', amount_cents: 52000, type: 'income', category_id: C.salary, frequency: 'weekly', next_date: day(5) },
    { title: 'Demo: Rent', amount_cents: 110000, type: 'expense', category_id: C.rent, frequency: 'fortnightly', next_date: day(9) },
    { title: 'Demo: Phone plan', amount_cents: 3500, type: 'expense', category_id: C.health, frequency: 'monthly', next_date: day(12), anchor_day: Number(day(12).slice(8)) },
  ])
  const tx: object[] = []
  for (let d = -55; d <= 0; d++) {
    const dow = new Date(day(d) + 'T12:00:00').getDay()
    if (dow === 6) tx.push({ date: day(d), amount_cents: 52000, type: 'income', category_id: C.salary, note: 'Café wages', recurring_id: rec[0].id })
    if ((d + 55) % 14 === 4) tx.push({ date: day(d), amount_cents: 110000, type: 'expense', category_id: C.rent, note: 'Rent', recurring_id: rec[1].id })
    tx.push({ date: day(d), amount_cents: Math.round(900 + Math.abs(wave(d)) * 1800), type: 'expense', category_id: C.food, note: pick(['Lunch on campus', 'Bubble tea', 'Groceries', 'Bánh mì', 'Coffee'], d) })
    if (dow >= 1 && dow <= 4) tx.push({ date: day(d), amount_cents: 450, type: 'expense', category_id: C.transport, note: 'Bus/train' })
    if (dow === 5) tx.push({ date: day(d), amount_cents: Math.round(2500 + Math.abs(wave(d + 3)) * 3000), type: 'expense', category_id: C.social, note: pick(['Movies', 'Dinner out', 'Karaoke', 'Birthday gift'], d) })
    if (d % 19 === 0) tx.push({ date: day(d), amount_cents: 6500, type: 'expense', category_id: C.study, note: pick(['Textbook', 'Calculator', 'Printing'], d) })
    if (d % 9 === 0) tx.push({ date: day(d), amount_cents: Math.round(2500 + Math.abs(wave(d + 5)) * 6000), type: 'expense', category_id: C.shopping, note: pick(['New shoes', 'Uniqlo', 'Skincare', 'Desk lamp', 'Hoodie'], d) })
    if (d % 23 === 0) tx.push({ date: day(d), amount_cents: 2200, type: 'expense', category_id: C.health, note: 'Pharmacy' })
  }
  await ins('transactions', tx)
  const { data: haveBud } = await supabase.from('budgets').select('category_id').eq('month', month0)
  const budgeted = new Set((haveBud ?? []).map((b: { category_id: string }) => b.category_id))
  await ins('budgets', ([[C.food, 60000], [C.transport, 10000], [C.social, 20000], [C.study, 15000]] as const)
    .filter(([c]) => !budgeted.has(c)).map(([category_id, limit_cents]) => ({ category_id, month: month0, limit_cents })))
}

const CHILD_FIRST = ['course_results', 'assessments', 'notes', 'daily_checkins', 'habit_logs', 'habits', 'budgets', 'transactions', 'recurring_transactions', 'finance_categories',
  'event_overrides', 'study_sessions', 'subtasks', 'tasks', 'deadlines', 'events', 'course_meetings', 'courses', 'semester_breaks', 'semesters']
/** Removes only rows flagged is_demo. Real data is never touched. */
export async function clearDemo(): Promise<void> {
  for (const t of CHILD_FIRST) { const { error } = await supabase.from(t).delete().eq('is_demo', true); if (error) throw error }
}
