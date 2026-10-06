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
  /(drop\s+table|delete\s+from|insert\s+into|update\s+\w+\s+set|select\s+\*|union\s+select|all\s+students|every\s+student|other\s+students?|password|ignore\s+(all\s+)?(previous|prior)\s+instructions|system\s+prompt|prompt\s+injection|bütün\s+tələbələr|butun\s+telebeler|все\s+студенты)/i;

export function detectIntent(message: string): AssistantIntent {
  const text = message.trim();
  const q = text.toLowerCase();
  if (!text || REFUSAL.test(text) || REFUSAL.test(q)) return { type: 'refused' };

  if (/next class|next lesson|what('?s| is) next/.test(q)) {
    return { type: 'schedule', scope: 'next' };
  }
  if (isTomorrow(q)) return { type: 'schedule', scope: 'tomorrow' };
  if (/this week|week schedule|classes this week/.test(q) && !/deadline|assignment|due|дедлайн/.test(q)) {
    return { type: 'schedule', scope: 'week' };
  }
  if (/deadline|assignment|due|homework|дедлайн|tapşırıq|tapshiriq/.test(q)) return { type: 'deadlines' };
  if (/attendance|absent|presence|davamiyy|iştirak|istirak|посещаем/.test(q)) {
    return { type: 'attendance', courseQuery: extractCourse(q) };
  }
  if (/today|schedule|my classes|what class|dərs|ders|расписан|занят/.test(q) && !/deadline|assignment|due|attendance|grade/.test(q)) {
    return { type: 'schedule', scope: 'today' };
  }
  if (/grade|score|gpa|mark|qiymət|qiymet|оценк/.test(q)) return { type: 'grades' };
  if (/exam|imtahan|экзамен/.test(q)) return { type: 'calendar', examsOnly: true };
  if (/where|room|building|library|cafeteria|gym|dorm|campus|map|harada|где/.test(q)) {
    return { type: 'location', query: text };
  }
  if (/calendar|holiday|semester|registration|təqvim|taqvim|календар/.test(q)) {
    return { type: 'calendar', examsOnly: false };
  }
  if (/course|subject|fənn|fenn|предмет/.test(q)) return { type: 'courses' };
  return { type: 'help' };
}

function isTomorrow(q: string): boolean {
  if (/\btomorrow\b/.test(q)) return true;
  if (/(^|\s)sabah($|\s|[?.!,])/.test(q) && !/(^|\s)bu sabah($|\s)/.test(q)) return true;
  return /завтра/.test(q) && !/завтрак/.test(q);
}

function extractCourse(q: string): string | undefined {
  const named = q.match(/\b(programming|mathematics|math|physics|english|algorithms|databases|database|history)\b/i);
  if (named?.[1]) return named[1].toLowerCase();
  if (/fizik|физик/.test(q)) return 'physics';
  if (/riyaziyyat|математик/.test(q)) return 'math';
  if (/proqramlaş|proqramlas|программир/.test(q)) return 'programming';
  if (/ingilis|английск/.test(q)) return 'english';
  return undefined;
}

export const ASSISTANT_HELP =
  'I can help with your own timetable, deadlines, grades, attendance, exams, and campus rooms. ' +
  'Try: "When is my next class?", "What classes do I have tomorrow?", "What deadlines do I have this week?", ' +
  '"What is my Physics attendance?", "Where is Room 304?", or "What exams do I have?"';
