# TLPDN Dashboard — Setup Guide

## Overview
Three-page dashboard for The Leela Palace New Delhi:
- **MM Report** — Morning Meeting metrics (NPS, surveys, reviews, feedback, LQA, email bounce)
- **L&D Dashboard** — Learning & Development (training sessions, interns, scores, certifications, budget)
- **Glitch & Sentiment** — AI-powered file analysis (upload Excel/CSV for instant sentiment + glitch detection)

---

## Connecting Google Sheets

### MM Report Sheet
1. Open your Google Sheet → File → Share → Publish to web
2. Choose the MM Report tab, format: "Comma-separated values (.csv)"
3. Copy the URL
4. Open `dashboard/index.html` and find:
   ```
   const MM_SHEET_URL = '';
   ```
5. Paste your URL between the quotes

### L&D Dashboard Sheet
1. Repeat the above for your L&D data sheet
2. Paste the URL into:
   ```
   const LD_SHEET_URL = '';
   ```

### Expected Sheet Column Headers

**MM Report Sheet:**
| metric | mtd | ytd |
|--------|-----|-----|
| nps_score | 74 | 70 |
| surveys_total | 192 | 1280 |
| promoters | 150 | 940 |
| passives | 26 | 215 |
| detractors | 16 | 125 |
| email_bounce | 2.1 | 2.5 |

**L&D Dashboard Sheet:**
| section | mtd | ytd |
|---------|-----|-----|
| training_hours | 186 | 1240 |
| sessions_completed | 34 | 210 |
...etc

The dashboard auto-detects new rows/sections — just add them to your sheet and they'll appear.

---

## AI API Setup (Sentiment Analysis)

Two modes:
- **Quick Local Analysis** — No API key needed, instant browser-based analysis
- **AI API Analysis** — Connect to OpenAI or compatible API

For AI mode:
1. Enter your API endpoint (default: OpenAI)
2. Enter your API key
3. Upload an Excel/CSV file
4. Click "Run Analysis"

---

## Auto-Refresh
Dashboard refreshes every 5 minutes. Click **Refresh** anytime for instant update.

## No Sheet Connected?
The dashboard includes realistic sample data. Just open `index.html` in any browser.
