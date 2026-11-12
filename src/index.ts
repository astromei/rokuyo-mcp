import KoreanLunarCalendar from 'korean-lunar-calendar';
import type { CalendarData } from 'korean-lunar-calendar';

// Upstream publishes ESM JS with a declaration file NodeNext interprets as CJS.
// Its runtime default is a constructor; keep the narrow adapter typed here.
const Calendar = KoreanLunarCalendar as unknown as new () => {
  setSolarDate(year: number, month: number, day: number): boolean;
  getLunarCalendar(): CalendarData;
};

export const ROKUYO = ['先勝', '友引', '先負', '仏滅', '大安', '赤口'] as const;
export type Rokuyo = typeof ROKUYO[number];
export const SUPPORTED_RANGE = { start: '2025-01-01', end: '2027-12-31' } as const;
export const CALENDAR_METHOD = 'KASI UTC+9 lunar-date conversion; matches Astromei’s Japanese calendar convention. Not an official Japanese calendar.';
export const CULTURAL_NOTE = '六曜は伝統的な暦の慣習です。出来事の結果を保証するものではありません。';

const READING: Record<Rokuyo, string> = {
  先勝: 'せんしょう', 友引: 'ともびき', 先負: 'せんぶ', 仏滅: 'ぶつめつ', 大安: 'たいあん', 赤口: 'しゃっこう',
};
const ROMAJI: Record<Rokuyo, string> = {
  先勝: 'sensho', 友引: 'tomobiki', 先負: 'senbu', 仏滅: 'butsumetsu', 大安: 'taian', 赤口: 'shakko',
};
const DESCRIPTION: Record<Rokuyo, string> = {
  先勝: '午前を吉、午後を凶とする慣習。急ぎの用事は午前中に。',
  友引: '朝夕を吉、正午を凶とする慣習。葬儀を避ける地域もあります。',
  先負: '午前を凶、午後を吉とする慣習。落ち着いて進める日。',
  仏滅: '終日を凶とする伝統的な区分。地域や個人により受け止め方は異なります。',
  大安: '終日を吉とする慣習。結婚式や入籍の日取りによく選ばれます。',
  赤口: '正午前後（11時〜13時）のみ吉とする慣習。',
};
type Luck = '吉' | '凶';
const SLOTS: Record<Rokuyo, readonly [Luck, Luck, Luck]> = {
  先勝: ['吉', '凶', '凶'], 友引: ['吉', '凶', '吉'], 先負: ['凶', '凶', '吉'],
  仏滅: ['凶', '凶', '凶'], 大安: ['吉', '吉', '吉'], 赤口: ['凶', '吉', '凶'],
};

export interface RokuyoDay {
  date: string;
  timezone: 'Asia/Tokyo';
  lunarDate: { year: number; month: number; day: number; leap: boolean };
  rokuyo: Rokuyo;
  reading: string;
  romaji: string;
  description: string;
  timeSlots: { morning: Luck; noon: Luck; afternoon: Luck };
}

function parseDate(date: string): { year: number; month: number; day: number; ms: number } {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new RangeError('Use a Japan-local date in YYYY-MM-DD format.');
  }
  const [year, month, day] = date.split('-').map(Number);
  const ms = Date.UTC(year, month - 1, day);
  const d = new Date(ms);
  if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month || d.getUTCDate() !== day) {
    throw new RangeError(`Invalid Gregorian date: ${date}`);
  }
  if (date < SUPPORTED_RANGE.start || date > SUPPORTED_RANGE.end) {
    throw new RangeError(`Supported dates: ${SUPPORTED_RANGE.start} through ${SUPPORTED_RANGE.end}.`);
  }
  return { year, month, day, ms };
}

/** Date-only input is interpreted in Japan; no clock, network or API key is used. */
export function getRokuyo(date: string): RokuyoDay {
  const { year, month, day } = parseDate(date);
  const calendar = new Calendar();
  if (!calendar.setSolarDate(year, month, day)) throw new RangeError('Lunar conversion failed.');
  const lunar = calendar.getLunarCalendar();
  const rokuyo = ROKUYO[(lunar.month + lunar.day - 2) % 6];
  const [morning, noon, afternoon] = SLOTS[rokuyo];
  return {
    date, timezone: 'Asia/Tokyo',
    lunarDate: { year: lunar.year, month: lunar.month, day: lunar.day, leap: !!lunar.intercalation },
    rokuyo, reading: READING[rokuyo], romaji: ROMAJI[rokuyo], description: DESCRIPTION[rokuyo],
    timeSlots: { morning, noon, afternoon },
  };
}

export function getRokuyoMonth(year: number, month: number): RokuyoDay[] {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('year and month must be integers; month must be 1–12.');
  }
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  parseDate(start);
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length }, (_, i) => getRokuyo(`${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`));
}

/** Inclusive range, capped to one year to keep MCP responses and work bounded. */
export function findRokuyoDates(start: string, end: string, rokuyo: Rokuyo = '大安'): RokuyoDay[] {
  const from = parseDate(start).ms;
  const to = parseDate(end).ms;
  if (!ROKUYO.includes(rokuyo)) throw new RangeError('Choose one of the six Rokuyo labels.');
  if (to < from || to - from > 365 * 86400_000) throw new RangeError('Use an ordered range of at most 366 days.');
  const matches: RokuyoDay[] = [];
  for (let ms = from; ms <= to; ms += 86400_000) {
    const result = getRokuyo(new Date(ms).toISOString().slice(0, 10));
    if (result.rokuyo === rokuyo) matches.push(result);
  }
  return matches;
}
