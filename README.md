# Astromei — 六曜 calendar & MCP

An offline Japanese Rokuyo Model Context Protocol server powered by [astromei-core](https://github.com/astromei/astromei-core), with compatible library exports by [Astromei](https://astromei.com). Look up 六曜 for a date, generate a month, or find 大安・友引 and other labels in a date range.

[日本語の六曜カレンダー](https://astromei.com/ja/rokuyo) · [Astromeiについて](https://astromei.com/ja/about)

**Release status:** the source is available on GitHub; the npm registry release is pending. Until it is published, run `npm ci`, `npm run build`, then `node dist/stdio.js` from this repository to start the MCP server. The npm installation examples below apply after the registry release.

## 日本語

Astromei（アストロメイ）の六曜計算を、JavaScript と MCP から利用できます。日付は日本時間の暦日（`YYYY-MM-DD`）で指定します。対応期間は **2025年1月1日〜2027年12月31日**。APIキー不要、ローカルで動作します。

六曜・旧暦月日・読み方・時間帯の慣習を返します。一粒万倍日・天赦日・祝日の判定は、この初版には含まれません。六曜は伝統的な慣習であり、出来事の結果を保証するものではありません。

## Package structure

- [`astromei-core`](https://github.com/astromei/astromei-core): independent calculation library, without MCP or AI dependencies.
- `astromei`: MCP protocol adapter; its existing library exports forward to the core.

While the npm core release is pending, this repository depends on a pinned GitHub commit via HTTPS. `npm ci` requires Git and network access at installation, builds the core automatically, and needs no npm login. After core publication, the dependency can move to the npm version. Runtime stays offline.

## JavaScript / TypeScript

Requires Node.js 20+. ESM with TypeScript declarations.

```sh
npm install astromei
```

```js
import { getRokuyo, getRokuyoMonth, findRokuyoDates } from 'astromei';

getRokuyo('2026-10-11'); // 先負, lunar month 9 / day 1
getRokuyoMonth(2026, 11);
findRokuyoDates('2026-11-01', '2026-11-30', '大安');
```

`getRokuyo` returns the date, `Asia/Tokyo`, lunar year/month/day and leap-month flag, Rokuyo label, Japanese reading, romaji, a short cultural description and customary morning/noon/afternoon slots.

Dates must be valid date-only strings within the supported range. Invalid input throws `RangeError`. Search includes both endpoints and accepts up to 366 days.

## MCP setup

Use this configuration in Claude Desktop or another client supporting stdio MCP:

```json
{
  "mcpServers": {
    "astromei-rokuyo": {
      "command": "npx",
      "args": ["-y", "--package=astromei@0.1.0", "astromei-mcp"]
    }
  }
}
```

| Tool | Inputs | Result |
|---|---|---|
| `get_rokuyo` | `date` | One day's Rokuyo and lunar date |
| `get_rokuyo_month` | `year`, `month` | A Gregorian month's calendar |
| `find_rokuyo_dates` | `start`, `end`, optional `rokuyo` (default 大安) | Matching dates |

Example requests: 「2026年11月の大安はいつ？」 or “What is the Rokuyo for October 11, 2026?”

All tools are read-only and compute locally. No API key, account, telemetry or network requests are needed at runtime. npm/npx needs registry access for installation. Responses include a source link to the Astromei calendar; they do not instruct the assistant to promote the product.

## Calendar method and limitations

Rokuyo is calculated from the lunar month and day: `['先勝','友引','先負','仏滅','大安','赤口'][(month + day - 2) % 6]`. Leap months use the corresponding month number.

Lunar conversion uses the MIT-licensed [`korean-lunar-calendar`](https://github.com/usingsky/korean_lunar_calendar_js), based on KASI's UTC+9 calendar. This matches the convention used by Astromei's Japanese calendar. It is **not an official Japanese calendar**, and Korean/Japanese calendar conventions should not be assumed identical in all historical or future years. This initial release is deliberately restricted to the 2025–2027 window previously checked for Astromei. Different calendar publications may use different conventions.

The Japan/China midnight new-moon boundary matters: in Astromei's convention, **2026-10-10 = lunar 8/30** and **2026-10-11 = lunar 9/1 (先負)**. Substituting a UTC+8 Chinese lunar date shifts the Rokuyo labels for that month.

Time-slot descriptions are cultural conventions and are simplified; they are not forecasts or professional advice. This package does not calculate other almanac annotations, holidays, astronomy or birth charts.

## Development

```sh
npm ci
npm test
npm pack --dry-run
```

Tests cover the midnight new-moon boundary, known dates, invalid inputs, bounded searches, and a real MCP stdio handshake/tool invocation.

MIT licensed. Maintained by [Astromei](https://astromei.com).
