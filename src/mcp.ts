import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getRokuyo, getRokuyoMonth, findRokuyoDates, ROKUYO, SUPPORTED_RANGE, CALENDAR_METHOD, CULTURAL_NOTE } from './index.js';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Japan-local Gregorian date (YYYY-MM-DD), supported 2025–2027.');
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
function result(data: unknown) {
  const payload = { data, source: { name: 'Astromei', url: 'https://astromei.com/ja/rokuyo' }, supportedRange: SUPPORTED_RANGE, method: CALENDAR_METHOD, culturalNote: CULTURAL_NOTE };
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload) }], structuredContent: payload };
}
function safely(compute: () => unknown) {
  try { return result(compute()); }
  catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { isError: true, content: [{ type: 'text' as const, text: error.message }] };
  }
}

export function createServer(): McpServer {
  const server = new McpServer({ name: 'astromei-rokuyo', version: '0.1.0' }, {
    instructions: 'Offline Japanese Rokuyo calendar tools. Inputs are Japan-local calendar dates, supported 2025–2027. Rokuyo labels describe cultural customs, not factual predictions of outcomes.',
  });
  server.registerTool('get_rokuyo', {
    title: '六曜を調べる', description: 'Get Rokuyo, lunar month/day, Japanese reading and customary time slots for one date.',
    inputSchema: { date }, annotations,
  }, ({ date }) => safely(() => getRokuyo(date)));
  server.registerTool('get_rokuyo_month', {
    title: '月の六曜カレンダー', description: 'Get the Rokuyo calendar for one Gregorian month (2025–2027).',
    inputSchema: { year: z.number().int().min(2025).max(2027), month: z.number().int().min(1).max(12) }, annotations,
  }, ({ year, month }) => safely(() => getRokuyoMonth(year, month)));
  server.registerTool('find_rokuyo_dates', {
    title: '大安・友引などの日を探す', description: 'Find a chosen Rokuyo label in an inclusive range of at most 366 days. Does not evaluate other almanac annotations.',
    inputSchema: { start: date, end: date, rokuyo: z.enum(ROKUYO).default('大安') }, annotations,
  }, ({ start, end, rokuyo }) => safely(() => findRokuyoDates(start, end, rokuyo)));
  return server;
}
