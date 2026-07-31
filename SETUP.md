# TLPDN L&D Dashboard — Setup Guide

Your dashboard is now driven entirely by Google Sheets. Everything lives in a single
file, `index.html` — no build step, no server. Open it directly or host it anywhere
(Google Sites, Netlify, SharePoint, an internal web server).

---

## 1. Connect your spreadsheet (2 minutes)

### Fastest route — share link

1. In Google Sheets: **Share → General access → Anyone with the link → Viewer**.
2. Copy the URL from the address bar.
3. Open the dashboard, click the **⚙** button in the top bar.
4. Mode = **Sheet link** → paste the URL.
5. *(Recommended)* type your tab names in the **Tab names** box, comma separated —
   e.g. `KPIs, Training Sessions, Interns, Guest Reviews`.
6. **Save & connect.**

The setting is remembered in the browser. To bake the link into the file permanently,
edit this block near the top of the `<script>` in `index.html`:

```js
var DEFAULT_CONFIG = {
  mode      : 'gviz',
  sheetId   : 'PASTE_YOUR_SHEET_URL_OR_ID_HERE',
  tabs      : [],          // e.g. ['KPIs','Training Sessions','Interns']
  refreshMs : 300000
};
```

### Other connection modes

| Mode | When to use it | Auto-discovers new tabs? |
|---|---|---|
| **Sheet link** | Simplest. Sheet shared as "anyone with the link". | Yes, if you list tab names (otherwise it probes common names) |
| **API key** | You want new tabs found with zero maintenance. | **Yes, fully automatic** |
| **Apps Script** | Sheet must stay **private**. Deploy `apps-script.gs`. | **Yes, fully automatic** |
| **Demo data** | Explore the layout with sample numbers. | n/a |

> For guaranteed auto-discovery of future tabs, use **API key** or **Apps Script**.
> The plain sheet link cannot list tabs, so name them in the settings box.

---

## 2. How to structure your sheet

The dashboard reads **column headers**, not fixed positions — reorder or rename
columns freely. Each tab becomes its own section and its own nav tab.

### MTD / YTD sections (KPI cards + charts)

Any tab with a **label column** plus **MTD** and/or **YTD** columns renders as KPI cards:

| Date | Metric | MTD | YTD | Unit | Target |
|---|---|---|---|---|---|
| 2026-07-28 | Training Hours | 186 | 1240 | hrs | 220 |
| 2026-07-28 | Certification Rate | 87 | 84 | % | 90 |
| 2026-07-28 | Budget Utilised | 450000 | 3200000 | ₹ | 500000 |

- `Unit` and `Target` are optional. A `Target` adds a progress bar.
- Each metric automatically shows a **▲ / ▼ change vs the previous reported date**.

### Detail sections (searchable, sortable tables)

Any other tab becomes a table — for example:

| Date | Session | Trainer | Department | Status | Attendees | Score |
|---|---|---|---|---|---|---|

- Columns named `Status` colour themselves (green / amber / red).
- Columns named `Rating` / `NPS` / `Score` with values ≤ 5 render as stars.
- Every table gets search, click-to-sort headers and CSV export.

### Column names it recognises

| Purpose | Accepted headers |
|---|---|
| Reporting date | `Date`, `Day`, `Report Date`, `As of Date`, `Period`, `Timestamp` |
| Label | `Metric`, `KPI`, `Indicator`, `Particulars`, `Name`, `Category`, `Item` |
| Month to date | `MTD`, `Month to Date`, `This Month`, `Current Month` |
| Year to date | `YTD`, `Year to Date`, `This Year`, `Annual` |
| Unit | `Unit`, `UOM`, `Symbol` |
| Target | `Target`, `Goal`, `Budget`, `Benchmark`, `Plan` |

`Start Date`, `End Date`, `DOB`, `Due Date` etc. are treated as **attributes**, not the
reporting date — so an intern list stays visible on every day.

### Date formats accepted

`2026-07-28` · `28/07/2026` · `28-07-2026` · `28 Jul 2026` · `Jul 28, 2026` ·
real Google Sheets date cells. Ambiguous values like `07/04/2026` are read as
**day/month** (Indian convention).

---

## 3. Adding a new section later

Just add a new tab to the spreadsheet with a header row.

- **API key / Apps Script mode** — it appears on the next refresh, no code change.
- **Sheet link mode** — add the tab name in ⚙ → Tab names.

A new nav tab, cards/table, charts and date handling are generated automatically.

---

## 4. Viewing any specific day

- Use the **date picker** in the top bar, or the **date chips** under the page title
  (the last 14 reported dates).
- If a date has **no data**, the dashboard shows a clear red error card naming the
  date, the range that *does* exist, and one-click buttons to jump to the nearest or
  latest available entry. Sections missing data are called out individually.

---

## 5. Features included

- Frosted-glass UI with an animated aurora background, dark **and** light themes.
- Smooth entrance animations on every card, row and chart (respects
  `prefers-reduced-motion` for accessibility).
- MTD vs YTD comparison chart + multi-metric trend line across reported dates.
- Automatic logarithmic axis when values span very different magnitudes
  (e.g. hours vs rupees).
- Search, sort and CSV export on every table.
- Auto-refresh (default 5 min, configurable, pauses when the tab is hidden).
- Fully responsive: 6-across on desktop, 2-across on phones, tables scroll horizontally.
- Offline Glitch & Sentiment analyser for uploaded Excel/CSV files.
- Print-friendly stylesheet.

---

## 6. Troubleshooting

| Message | Fix |
|---|---|
| `HTTP 404 — sheet not found` | The Sheet ID is wrong. Re-copy the full URL. |
| `HTTP 403 — sheet is not shared publicly` | Set Share → Anyone with the link → Viewer. |
| `Unexpected response — is the sheet shared publicly?` | Google returned a sign-in page. Same fix as above, or use Apps Script mode. |
| `Failed to fetch` | No network, or the page is blocked by a corporate proxy/CSP. |
| A tab is missing | Sheet-link mode can't list tabs — add its name in ⚙, or switch to API key / Apps Script mode. |
| Numbers show as `—` | The cell is empty or text. Remove stray characters; `₹`, `,` and `%` are handled automatically. |

---

## Files

- **`index.html`** — the complete dashboard (open this).
- **`apps-script.gs`** — optional Google Apps Script endpoint for private sheets.
- **`SETUP.md`** — this guide.




# How to Format Your Google Spreadsheet

Everything comes from **one spreadsheet**. Each **tab** becomes one **section** on the dashboard.

Start with **`TLPDN-Dashboard-Template.xlsx`** — it already contains your 26 July numbers,
your 18 reviews and your 17 interns, correctly formatted.

**To use it:** Google Drive → New → File upload → pick the file → right-click it →
Open with → Google Sheets → File → Save as Google Sheets. Then Share → Anyone with the
link → Viewer, copy the URL, and paste it into the dashboard's ⚙ settings.

---

## The 6 rules that prevent every common problem

1. **Row 1 is the header row.** Never delete, rename or move it.
2. **Never merge cells.** Merged cells break the alignment between headers and data.
3. **No blank rows inside the data.** Add new rows at the bottom.
4. **One date format everywhere.** `2026-07-26` is safest. `26/07/2026` also works and is read as day/month.
5. **Numbers must be plain numbers.** Type `186`, not `186 hrs`. Put `hrs` in the **Unit** column.
   (`₹`, `,` and `%` are handled automatically, so `₹4,50,000` and `29%` are fine.)
6. **Header spelling matters, not column order.** Reorder or insert columns freely.

---

## Tab 1 — `KPIs` (your morning-meeting numbers)

This drives all the big number cards and both charts. **One row per metric per day.**

| Date | Metric | MTD | YTD | Unit | Target |
|---|---|---|---|---|---|
| 2026-07-26 | NPS Score | 74 | 70 | | 80 |
| 2026-07-26 | Promoters | 150 | 940 | | 160 |
| 2026-07-26 | Passives | 26 | 215 | | |
| 2026-07-26 | Detractors | 16 | 125 | | |
| 2026-07-26 | Review Rating | 4.6 | 4.5 | | 5 |
| 2026-07-26 | Surveys Completed | 192 | 1280 | | 200 |
| 2026-07-26 | Conversion Rate | 28 | 26 | % | 35 |
| 2026-07-26 | Email Bounce Rate | 2.1 | 2.3 | % | 2 |

- **Unit** and **Target** are optional. A Target adds a progress bar under the card.
- Each card automatically shows **▲ / ▼ change vs the previous date** in the sheet.
- Promoters / Passives / Detractors are three separate rows — that's intentional, so each
  gets its own card and its own MTD/YTD pair.

**Every morning:** select the last 8 rows → copy → paste underneath → change the date and
the numbers. That's the whole daily routine.

---

## Tab 2 — `Reviews` (the grouped morning-meeting list)

This tab produces your exact report format automatically. **One row per platform + star-rating group.**

| Date | Platform | Rating | Count | Guest Name | Staff Mentioned | Comment |
|---|---|---|---|---|---|---|
| 2026-07-26 | Booking.com | 5 | 1 | Khushnuma | JAIADITYA | Bad: I was given a smoking room… |
| 2026-07-26 | Booking.com | 5 | 2 | | | |
| 2026-07-26 | Google | 4 | 1 | Denis Wollner | | Nevertheless, there is an issue… |
| 2026-07-26 | Google | 5 | 4 | | | |
| 2026-07-26 | TripAdvisor | 5 | 1 | Nomad24551188953 | SABYASACHI, RIK, GOURAV | |
| 2026-07-26 | TripAdvisor | 5 | 4 | GoPlaces50171032616, Zemar G, GAGA_TRI | SHOBHIT | |

### How this maps to your report

Your line `BOOKING.COM - 5 STAR (1)` with a guest name becomes one row with `Count = 1`.
Your line `BOOKING.COM - 5 STAR (2)` with no details becomes one row with `Count = 2`
and the name/comment cells left empty.

- **Count** = how many reviews that line represents. **The dashboard adds these up** —
  your 26 July rows total **18 reviews**, matching your report exactly.
- **Guest Name** — put several names in one cell separated by commas if they share a line.
- **Staff Mentioned** — the associates named in the review (shown in gold).
- **Comment** — paste the full review text. Long text is fine; leave blank if there isn't one.
- **Platform** — spelling is flexible (`Booking.com`, `booking`, `BOOKING.COM` all work).
  Recognised: Google, Booking.com, TripAdvisor, MakeMyTrip, Expedia, Agoda, Goibibo,
  HolidayIQ, Yatra. Anything else still works, just in grey.

The dashboard shows a **count + average rating card per platform**, then the grouped detail.
The **"⧉ Copy for meeting"** button copies the whole thing as plain text in your exact
format — ready to paste into WhatsApp or email.

**Every review is clickable.** Long comments are trimmed to three lines in the list; click
(or press Enter on) any review to open a popup with the full untruncated text, the platform,
star rating, an automatic **Promoter / Passive / Detractor** label, the guest name, each
staff member named as its own chip, and a **⧉ Copy review** button for that single review.

---

## Tab 3 — `Interns` (clickable people cards)

Any tab with a **person-name column** plus a **Status column** becomes a people section:
interns are automatically **sorted into categories** and every name opens a detail popup.

| Name | Department | Current Rotation | College | Start Date | End Date | Mentor | Attendance % | Bank Details | Pending Documents | Appreciation Certificate | Contact | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SASWAT CHOUHAN | ALL DEPT | FO | AMITY UNIVERSITY NOIDA | 2026-05-18 | 2026-09-30 | P. Kumar | 94 | HDFC ****4821 / HDFC0001234 | None | Yes - Guest Delight Award | saswat@example.com | Active |
| TANYA GHOSH | SPA | Spa & Wellness | IHM PUSA | 2026-03-01 | 2026-06-30 | M. Das | 97 | HDFC ****2244 | None | Yes - Wellness Star | tanya@example.com | Completed |
| VIKAS MEHRA | F&B SERVICE | F & B Service | AIHM | 2026-04-01 | 2026-06-15 | A. Mehta | 41 | BOB ****4455 | Exit form pending | No | vikas@example.com | Left |

### The three automatic categories

The **Status** cell decides which group an intern lands in:

| Group shown | Status words that land there |
|---|---|
| **Active / In Training** | `Active`, `Ongoing`, `In Training`, `Current`, `In Progress`, `Joined` |
| **Cleared / Completed** | `Cleared`, `Completed`, `Finished`, `Done`, `Passed`, `Graduated`, `Certified`, `End` |
| **Left / Discontinued** | `Left`, `Resigned`, `Discontinued`, `Dropped`, `Terminated`, `Absconded`, `Quit`, `Failed` |

Anything unrecognised goes into an **Other** group, so nobody is ever hidden.
Just change the Status cell and the intern moves group on the next refresh.

### Clicking a name

Every name is a button. Clicking (or pressing Enter) opens a popup with:

- **Current department** and **current rotation**
- **Start date → End date**, formatted for readability
- **Attendance %** as a colour-coded bar (green ≥ 90, amber ≥ 75, red below)
- **Bank details — masked by default**, with a **Show/Hide** button so account numbers
  aren't exposed over someone's shoulder or on a shared screen
- **Pending documents** — green "All documents submitted" when the cell says
  `None`/`Nil`/`NA`, otherwise a red chip listing what's missing
- **Appreciation certificate**, mentor, contact, status
- **⧉ Copy details** to copy the whole profile as text

**Any extra column you add to the tab also appears in the popup automatically** — no code
change needed. Columns are matched by meaning, so `DOJ`, `Date of Joining` and `Start Date`
all work, as do `Attendance`, `Attendance %`, `A/C No.`, `Bank`, `IFSC`, `Docs Pending`.

Leave a cell blank and the popup shows a soft "Not recorded" rather than a gap.

## Tab 4 — `Apprentices`

Same clickable-people layout as Interns, with apprenticeship-specific fields. Because the
dashboard detects **any** tab that has a person-name column plus a Status column, this tab
works automatically — nothing to configure.

| Apprentice Name | Department | Trade | Batch | Registration No | Scheme | Start Date | End Date | Mentor | Attendance % | Stipend | Bank Details | Pending Documents | Appreciation Certificate | Contact | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ROHAN DIXIT | F&B SERVICE | Food & Beverage Service | 2026-A | NAPS/2026/004821 | NAPS | 2026-04-01 | 2027-03-31 | A. Mehta | 93 | 15000 | HDFC ****6612 | None | Yes - Service Star | rohan@example.com | Active |
| FARHAN QURESHI | BAKERY | Bakery & Confectionery | 2025-A | NAPS/2025/002204 | NAPS | 2025-07-01 | 2026-06-30 | Chef Neha | 98 | 14500 | HDFC ****4471 | None | Yes - Best Apprentice | farhan@example.com | Completed |
| HARSHIT JAIN | CULINARY | Commis Chef | 2025-B | NAPS/2025/003311 | NAPS | 2025-10-01 | 2026-09-30 | Chef Arjun | 47 | 15000 | BOB ****5563 | Exit form pending | No | harshit@example.com | Left |

Apprentices are sorted into the **same three categories** as interns (Active / Cleared /
Left) using the Status cell, and each name opens the same detail popup.

### Extra fields the popup labels for apprentices

| Field | Accepted headers |
|---|---|
| Trade / Discipline | `Trade`, `Discipline`, `Craft`, `Specialisation`, `Stream` |
| Batch | `Batch`, `Batch No`, `Cohort`, `Year` |
| Registration No. | `Registration No`, `Reg No`, `NAPS ID`, `NATS ID`, `Apprentice ID`, `Contract No` |
| Scheme | `Scheme`, `NAPS`, `NATS`, `Type`, `Apprenticeship Type` |
| Stipend | `Stipend`, `Monthly Stipend`, `Allowance` — shown as **₹15,000** |

Everything else (dates, attendance bar, masked bank details, pending documents,
appreciation, mentor, contact) behaves exactly as on the Interns tab.

---

## Tab 5 — `Surveys` (clickable rows)

Guest satisfaction surveys have a lot of columns, so the table stays compact and
**every row opens a popup** with the full record.

| Date | Guest Name | Room No | Cleanliness | Service | F&B | Comfort | Overall | Best Staff | Department | Feedback |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-07-26 | Priya Mehra | 412 | 9 | 10 | 9 | 9 | 9 | Rahul (Concierge) | Front Office | Outstanding personalised service… |

In the popup, score columns (`Cleanliness`, `Service`, `F&B`, `Comfort`, `Overall`,
`Quality`, `Ambience`, `Value`, `Hygiene`, `Breakfast`, `Wifi`…) render as **colour-coded
bars** — green ≥ 80%, amber ≥ 60%, red below. The scale is detected from the value itself,
so marks out of 5, 10 or 100 all work without configuration.

Long feedback is shown in full in a quote block, and **⧉ Copy details** copies the whole
survey as text.

**This applies to every table section**, not just Surveys — Training Sessions rows are
clickable too. Identifier columns (`Room No`, `Table No`, `ID`, `Attendees`, `Count`)
are shown as plain numbers, never as rating bars.

---

## Tab 6 — `Training Sessions`

| Date | Session | Trainer | Department | Status | Attendees | Score |
|---|---|---|---|---|---|---|
| 2026-07-26 | F&B Service Excellence | A. Mehta | F&B | Completed | 14 | 94 |

`Status` auto-colours: Completed/Active green · In Progress/Scheduled amber · Cancelled red.

---

## Adding a new section later

Add a new tab with a header row — a new nav tab and section appear on their own.

- Give it `Date` + `Metric` + `MTD` + `YTD` → it renders as **KPI cards**.
- Give it `Platform` + `Rating` → it renders as a **grouped review list**.
- Give it `Name` + `Status` → it renders as **clickable people cards** grouped by status.
- Anything else → a **searchable, sortable table** with CSV export.

### Making sure a tab actually shows up

Common tab names are now **auto-discovered** even in "Sheet link" mode — including
`Interns`, `Apprentices`, `Trainees`, `Surveys`, `Reviews`, `Training Sessions`, `KPIs`
and variations like `Apprentice Data`.

If you use a non-standard name, type it into ⚙ → **Tab names**, or press
**"Use standard tabs"** to fill in the whole standard list in one click.

The settings panel shows **"Currently loaded (n): …"** listing every section it found, plus
a "Not found" line for any tab name it couldn't reach — so a missing tab is never silent.

For guaranteed discovery of *any* tab name, switch to **API key** or **Apps Script** mode.

---

## Column names the dashboard understands

| Meaning | Accepted headers |
|---|---|
| Report date | `Date`, `Day`, `Report Date`, `As of Date`, `Period` |
| Label | `Metric`, `KPI`, `Indicator`, `Particulars`, `Name`, `Category` |
| Month to date | `MTD`, `Month to Date`, `This Month` |
| Year to date | `YTD`, `Year to Date`, `This Year`, `Annual` |
| Unit / Target | `Unit`, `UOM` / `Target`, `Goal`, `Budget`, `Benchmark` |
| Review platform | `Platform`, `Source`, `Website`, `Site`, `Channel`, `OTA` |
| Star rating | `Rating`, `Stars`, `Star` |
| Guest | `Guest Name`, `Guest`, `Reviewer`, `Customer` |
| Staff praised | `Staff Mentioned`, `Staff`, `Associate`, `Employee`, `Name` |
| Review text | `Comment`, `Review`, `Feedback`, `Remarks`, `Details` |
| Group size | `Count`, `Qty`, `Number`, `No` |
| Person name | `Name`, `Intern Name`, `Trainee Name`, `Full Name`, `Candidate` |
| Status / category | `Status`, `State`, `Stage`, `Training Status` |
| Attendance | `Attendance`, `Attendance %`, `Present %` |
| Bank | `Bank Details`, `Account No`, `A/C`, `IFSC`, `UPI` |
| Pending docs | `Pending Documents`, `Docs Pending`, `Missing Documents` |
| Appreciation | `Appreciation Certificate`, `Award`, `Commendation`, `Recognition` |

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| A card shows `—` | That metric has no row for the selected date, or the cell is text. Check spelling of the Metric name — it must match across days. |
| Review total is wrong | Check the **Count** column. Blank counts as 1. |
| A whole tab is missing | Sheet-link mode: add the tab name in ⚙. Or switch to API-key mode. |
| Dates look wrong by month/day | Use `yyyy-mm-dd`. Ambiguous values like `07/04/2026` are read as **4 July** (day/month). |
| Red "No data for…" card | That date genuinely isn't in the sheet yet. Click the button in the card to jump to the latest date that is. |
| Interns disappear on some dates | Don't rename `Start Date` to `Date` — that would make it a reporting date. |
| Interns show as a plain table, not cards | The tab needs both a `Name`-type column **and** a `Status` column. |
| An intern is in the wrong group | Check the Status spelling against the table above; unrecognised words go to "Other". |
| Bank details look like ••••1234 | That's intentional. Click **Show** in the popup to reveal them. |
