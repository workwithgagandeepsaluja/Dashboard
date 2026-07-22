# L&D Training Analytics Dashboard

An interactive analytics dashboard for Learning & Development departments. Track training KPIs, visualize trends, filter data, and connect to live Google Sheets.

## Features

- **6 KPI cards** with trend indicators (enrollments, completion rate, avg score, hours, overdue, active courses)
- **5 interactive charts** — line, bar, donut, area, and histogram with hover tooltips and smooth animations
- **Sortable & searchable data table** with pagination
- **Live filters** — date range, department, category, status — all views update in real-time
- **Dark mode** toggle with persistence
- **Fully responsive** — works on mobile, tablet, and desktop
- **Google Sheets integration** — connect a spreadsheet for live data, with auto-refresh
- **CSV upload** — import data from any spreadsheet app
- **Smart column mapping** — recognizes 50+ header variations automatically

---

## 📊 Sample Spreadsheet

**Download the sample data file:** [`public/sample-data.csv`](public/sample-data.csv)

This CSV file contains **50 realistic training records** covering:
- 8 departments (Engineering, Sales, Marketing, HR, Finance, Operations, Product, Customer Support)
- 8 training categories (Compliance, Technical Skills, Leadership, Soft Skills, Onboarding, Safety, Product Training, DEI)
- All 4 statuses (Completed, In Progress, Not Started, Overdue)
- Various date ranges, scores, and mandatory flags

### How to use it:

1. **Download** the file from the link above (or from the dashboard's "Download Sample" button)
2. **Open it** in your preferred spreadsheet app:
   - **Google Sheets:** File → Import → Upload → select the CSV
   - **Excel:** Just double-click the file, or File → Open
   - **Apple Numbers:** File → Open → select the CSV
   - **LibreOffice Calc:** File → Open → select the CSV
3. **Study the format** — replace the sample data with your real training records
4. **Connect to the dashboard** — either paste the Google Sheet URL or export as CSV and upload

---

## Option 1: Use Locally (Just Double-Click)

### Quick Start

1. **Build the project:**
   ```bash
   npm install
   npm run build
   ```

2. **Open the file:**
   Navigate to `dist/index.html` and double-click it. That's it — the entire dashboard is a single self-contained HTML file.

3. **Use it:**
   - The dashboard starts with 250 sample records
   - Click **"Data Source"** to expand the panel
   - Click **"Download Sample (50 rows)"** to get a spreadsheet template
   - Paste a Google Sheet URL or upload a CSV file
   - Click **"Save as HTML"** in the header to save a copy for later

### Save & Share

The `dist/index.html` file:
- Contains everything (HTML + CSS + JS) in one file
- Can be emailed, shared on Slack, or stored on a USB drive
- Works offline (except Google Sheets connectivity)
- No server required

---

## Option 2: Deploy to GitHub Pages

### Automatic Deployment (Recommended)

1. **Push this repo to GitHub**

2. **Enable GitHub Pages:**
   - Go to your repo → **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**

3. **Push to `main` (or `master`) branch.**
   The included GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
   - Install dependencies
   - Build the project
   - Deploy to GitHub Pages automatically

4. **Your dashboard is live at:**
   ```
   https://<username>.github.io/<repo-name>/
   ```

The sample data CSV will also be available at:
```
https://<username>.github.io/<repo-name>/sample-data.csv
```

### Manual Deployment

If you prefer to deploy manually:

```bash
npm install
npm run build
```

Then push the `dist/` folder to a `gh-pages` branch:

```bash
npm install -g gh-pages
gh-pages -d dist
```

---

## Google Sheets Integration

### How to Connect

1. Create a Google Sheet with these column headers (Row 1):
   ```
   Employee Name | Department | Course Name | Category | Status | Enrollment Date | Completion Date | Score | Time Spent (Hours) | Mandatory
   ```

2. Add your training data below the headers.

3. **Share the sheet:** Click **Share** → set to **"Anyone with the link"** → **Viewer**.

4. Copy the URL and paste it into the **Data Source** panel.

5. The dashboard fetches data using CORS proxy fallbacks (it tries multiple proxy services automatically). The working proxy is remembered for next time.

### Auto-Refresh

When connected to a Google Sheet:
- Toggle **Auto-refresh** on/off
- Choose interval: 30s, 1min, 2min, 5min, or 10min
- Click **Refresh now** for an instant update

### Template

In the **Data Source** panel:
- **Download Sample (50 rows)** — full 50-record realistic training dataset
- **Blank Template** — headers only, ready for you to fill in
- **Copy 5-Row Template** — quick copy-paste of a small example

### Flexible Column Headers

The system recognizes 50+ header variations. You don't need exact matches:

| Your Header | Recognized As |
|---|---|
| `Employee`, `Name`, `Learner`, `Participant` | Employee Name |
| `Dept`, `Team`, `Division` | Department |
| `Course`, `Training`, `Program`, `Module` | Course Name |
| `Type`, `Course Type`, `Training Category` | Category |
| `Completion Status`, `Progress` | Status |
| `Start Date`, `Enrolled On`, `Registration Date` | Enrollment Date |
| `Completed On`, `Finish Date`, `Date Completed` | Completion Date |
| `Grade`, `Marks`, `Score (%)` | Score |
| `Duration`, `Hours`, `Training Hours` | Time Spent |
| `Required`, `Compulsory` | Mandatory |

### Accepted Formats

| Field | Accepted Values |
|---|---|
| Status | `Completed`, `In Progress`, `Not Started`, `Overdue` (also: `Pending`, `Ongoing`, `Expired`, etc.) |
| Dates | `YYYY-MM-DD`, `MM/DD/YYYY`, `DD-MM-YYYY` |
| Scores | `85`, `85%`, `92.5` |
| Mandatory | `Yes/No`, `True/False`, `1/0`, `Y/N` |

---

## Troubleshooting

### Google Sheets not loading

1. **Make sure the sheet is public:** Share → "Anyone with the link" → Viewer
2. **Check the URL:** It should be a full Google Sheets URL (not a short link)
3. **Try the CSV upload instead:** In Google Sheets → File → Download → Comma Separated Values (.csv), then use the Upload CSV option

### CORS errors (local file://)

When opening `dist/index.html` directly, the dashboard uses CORS proxy services to fetch Google Sheets. If one proxy is down, it automatically tries the next one. If all proxies fail:
- Use the **Upload CSV** option instead
- Or serve the file locally: `npx serve dist` then open `http://localhost:3000`

### Charts not showing

- Make sure you have data loaded (check the "Data Source" panel)
- If using a Google Sheet, verify it has at least a header row and one data row
- Try switching to Sample Data to test

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** with single-file plugin
- **Tailwind CSS v4**
- **Recharts** for charts
- **Lucide React** for icons
- **date-fns** for date utilities

## License

MIT
