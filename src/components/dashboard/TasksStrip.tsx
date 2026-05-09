/**
 * src/components/dashboard/TasksStrip.tsx
 *
 * Phase 17 placeholder — shows 4 hardcoded mock task rows.
 * Phase 17.5 will replace this with real data from a `tasks` table
 * + CRUD flow + integration with WhatsApp/email/call sources.
 *
 * Design from Mockup v2 (Session 20). Status circle + title + context +
 * due-date badge + source icon, all Hebrew RTL.
 *
 * Phase 17 — /dashboard build, Path Y (Session 21, 08/05/2026)
 */

import Link from 'next/link';

interface MockTask {
  id:        string;
  title:     string;
  context:   string;
  dueLabel:  string;
  urgency:   'overdue' | 'today' | 'tomorrow' | 'future';
  source:    'whatsapp' | 'phone' | 'email' | 'calendar';
}

// Hardcoded mock data — Phase 17.5 will replace with Supabase query
const MOCK_TASKS: MockTask[] = [
  {
    id:       't1',
    title:    'להגיב להודעת WhatsApp של גל',
    context:  'Gal גל · ליד · נשלח אתמול 16:30',
    dueLabel: 'באיחור',
    urgency:  'overdue',
    source:   'whatsapp',
  },
  {
    id:       't2',
    title:    'להתקשר לסיגל לוי על אישור הצעה',
    context:  'סיגל לוי · הצעת מחיר נשלחה',
    dueLabel: 'היום',
    urgency:  'today',
    source:   'phone',
  },
  {
    id:       't3',
    title:    'לשלוח חשבונית לדוד כהן',
    context:  'דוד כהן · אושר · סכום $1,400',
    dueLabel: 'מחר',
    urgency:  'tomorrow',
    source:   'email',
  },
  {
    id:       't4',
    title:    'פגישה אצל רוני · כיור עגול 60 ס״מ',
    context:  'רוני סיני · הצעת מחיר נשלחה · רמת גן',
    dueLabel: '12.5',
    urgency:  'future',
    source:   'calendar',
  },
];

function urgencyColors(urgency: MockTask['urgency']) {
  if (urgency === 'overdue')  return { ring: 'border-red-600',    badge: 'bg-red-50 text-red-800 border-red-200' };
  if (urgency === 'today')    return { ring: 'border-amber-600',  badge: 'bg-amber-50 text-amber-800 border-amber-200' };
  if (urgency === 'tomorrow') return { ring: 'border-blue-500',   badge: 'bg-blue-50 text-blue-800 border-blue-200' };
  return                              { ring: 'border-gray-300',  badge: 'bg-gray-50 text-gray-700 border-gray-200' };
}

function sourceEmoji(src: MockTask['source']) {
  if (src === 'whatsapp') return '💬';
  if (src === 'phone')    return '📞';
  if (src === 'email')    return '📧';
  return                         '📅';
}

export default function TasksStrip() {
  return (
    <div className="mb-6" dir="rtl">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm font-medium text-gray-600">
          📋 משימות פתוחות <span className="text-gray-400 font-normal">({MOCK_TASKS.length})</span>
        </div>
        <span className="text-xs text-gray-400">מסודר לפי דחיפות</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {MOCK_TASKS.map((task, idx) => {
          const colors = urgencyColors(task.urgency);
          return (
            <div
              key={task.id}
              className={
                'grid items-center gap-3 px-4 py-3 ' +
                (idx > 0 ? 'border-t border-gray-100 ' : '')
              }
              style={{ gridTemplateColumns: '24px 1fr 80px 24px' }}
            >
              <div className={'w-4 h-4 rounded-full border-2 ' + colors.ring} aria-hidden="true"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{task.context}</div>
              </div>
              <span className={'text-xs px-3 py-1 rounded-full text-center font-medium border ' + colors.badge}>
                {task.dueLabel}
              </span>
              <span className="text-base text-gray-500" aria-hidden="true">{sourceEmoji(task.source)}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs text-gray-400 italic">
          לחיצה על משימה תפתח בעתיד מיני-CRM (יומן · פגישות · נסיעות · zoom)
        </span>
        <Link href="/tasks" className="text-xs text-blue-600 no-underline hover:underline">
          כל המשימות ←
        </Link>
      </div>
    </div>
  );
}
