# Deal Radar · Weekend Cruises

Live site: https://vinunairs.github.io/deal-radar/

A family weekend-cruise deal tracker: popular ships (Royal Caribbean Oasis/Icon class first, plus MSC, Disney, Carnival and Norwegian) on 2–4 night Bahamas sailings from Port Canaveral, Miami and Fort Lauderdale, for the next 8 weekends.

## How it works
- `index.html` + `assets/` are a static page. Everything on it is drawn from **`data/cruises.json`**.
- A daily Claude scheduled task (about 8:52 am ET) checks fares, updates `data/cruises.json` and commits it. Nothing else in the repo changes day to day.
- Per-person prices are for 2 to a cabin from public fare sites. "All 4" totals are one room for 3 adults (13+) + 1 child, quoted on the cruise line's own site.
- Nothing is ever booked or held.

## Data file (`data/cruises.json`)
`updated`, `scope`, `summary[3]`, `notes[]`, `notesDate`, `schoolOff{date: label}`, `sailings[]` (id, line, ship, port, dep "Fri Oct 30", ret "Mon Nov 2", n, calls, int, bal, deal, school, schoolGood, src, srcName, rank, note, drop, close, fam{int,bal,date,link}), `history{dates[], rows{id: [[int,bal]|null,...]}}`, `reported[]`, `famHistory[]`.
