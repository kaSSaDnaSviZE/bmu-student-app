export type AssistantIntent =
  | { type: 'refused' }
  | { type: 'schedule'; scope: 'next' | 'today' | 'tomorrow' | 'week' }
  | { type: 'deadlines' }
  | { type: 'attendance'; courseQuery?: string }
  | { type: 'grades' }
  | { type: 'calendar'; examsOnly: boolean }
  | { type: 'location'; query: string }
  | { type: 'courses' }
  | { type: 'help' };

const REFUSAL =
  /(drop\s+table|delete\s+from|insert\s+into|update\s+\w+\s+set|select\s+\*|union\s+select|all\s+students|every\s+student|other\s+students?|password|ignore\s+(all\s+)?(previous|prior)\s+instructions|system\s+prompt)/i;

export function detectIntent(message: string): AssistantIntent {
  const text = message.trim();
  const q = text.toLowerCase();
  if (!text || REFUSAL.test(text)) return { type: 'refused' };

  if (/next class|next lesson|what('?s| is) next/.test(q)) {
    return { type: 'schedule', scope: 'next' };
  }
  if (/tomorrow/.test(q)) return { type: 'schedule', scope: 'tomorrow' };
  if (/this week|week schedule|classes this week/.test(q) && !/deadline|assignment|due/.test(q)) {
    return { type: 'schedule', scope: 'week' };
  }
  if (/today|schedule|my classes|what class/.test(q) && !/deadline|assignment|due|attendance|grade/.test(q)) {
    return { type: 'schedule', scope: 'today' };
  }
  if (/deadline|assignment|due|homework/.test(q)) return { type: 'deadlines' };
  if (/attendance|absent|presence/.test(q)) {
    return { type: 'attendance', courseQuery: extractCourse(q) };
  }
  if (/grade|score|gpa|mark/.test(q)) return { type: 'grades' };
  if (/exam/.test(q)) return { type: 'calendar', examsOnly: true };
  if (/where|room|building|library|cafeteria|gym|dorm|campus|map/.test(q)) {
    return { type: 'location', query: text };
  }
  if (/calendar|holiday|semester|registration/.test(q)) {
    return { type: 'calendar', examsOnly: false };
  }
  if (/course|subject/.test(q)) return { type: 'courses' };
  return { type: 'help' };
}

function extractCourse(q: string): string | undefined {
  const named = q.match(/\b(programming|mathematics|math|physics|english|algorithms|databases|database|history)\b/i);
  return named?.[1];
}

export const ASSISTANT_HELP =
  'I can help with your own timetable, deadlines, grades, attendance, exams, and campus rooms. ' +
  'Try: "When is my next class?", "What classes do I have tomorrow?", "What deadlines do I have this week?", ' +
  '"What is my Physics attendance?", "Where is Room 304?", or "What exams do I have?"';
