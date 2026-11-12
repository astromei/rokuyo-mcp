import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';

test('real stdio MCP handshake, tools, calendar query, search and invalid input', { timeout: 15000 }, async () => {
  const client = new Client({ name: 'astromei-smoke', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('../dist/stdio.js', import.meta.url))], stderr: 'pipe' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(t => t.name).sort(), ['find_rokuyo_dates', 'get_rokuyo', 'get_rokuyo_month']);
    const day = await client.callTool({ name: 'get_rokuyo', arguments: { date: '2026-10-11' } });
    assert.equal(day.isError, undefined);
    assert.equal(day.structuredContent.data.rokuyo, '先負');
    const month = await client.callTool({ name: 'get_rokuyo_month', arguments: { year: 2026, month: 2 } });
    assert.equal(month.structuredContent.data.length, 28);
    const found = await client.callTool({ name: 'find_rokuyo_dates', arguments: { start: '2026-10-31', end: '2026-10-31' } });
    assert.equal(found.structuredContent.data[0].rokuyo, '大安');
    const bad = await client.callTool({ name: 'get_rokuyo', arguments: { date: '2026-02-30' } });
    assert.equal(bad.isError, true);
  } finally { await client.close(); }
});
