#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './mcp.js';

try {
  await createServer().connect(new StdioServerTransport());
} catch {
  console.error('Astromei MCP failed to start. Requires Node.js 20 or later.');
  process.exitCode = 1;
}
