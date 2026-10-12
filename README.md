# 🎀 The Birthday Games

A personalised, mobile-friendly birthday experience built as a series of
unlockable puzzles. Puzzle 1 is live now; the structure is ready for you
to add more puzzles later.

## How it works

- `index.html` — landing page listing all puzzles. Only Puzzle 1 is
  clickable right now; later puzzles show as locked until the one before
  them is solved.
- `puzzle1.html` — shows a live countdown timer with **no label** saying
  what it's counting down to. She has to figure it out and type the exact
  date & time into the answer box (format `DD/MM/YYYY HH:MM`, 24-hour).
  Getting it right unlocks a button to the outfit list.
- `reward1.html` — the outfit list. It checks (via `localStorage`) that
  puzzle 1 was actually solved on that device/browser; if not, it bounces
  back to the landing page, so the link can't be shared to skip ahead.

Progress is stored in the browser's `localStorage`, so once she solves a
puzzle on her phone, it stays unlocked there even if she closes the tab
and comes back later.

## Setup before sharing the link

### 1. Set the real countdown target
Open `js/puzzle1.js` and edit this line near the top:

```js
const TARGET_DATETIME = "2026-07-15T18:30:00"; // YYYY-MM-DDTHH:MM:00
```

Set it to whatever the countdown should actually be counting down to
(e.g. flight departure time, trip start, the big reveal moment — whatever
fits your surprise). This date is also what her typed answer is checked
against, so it drives both the puzzle and the correct answer.

### 2. Edit the outfit list
`reward1.html` currently links out to a Google Doc for the outfit list
instead of an inline list. The button's `href` is near the top of the
`<div class="card">` section — update it there if the Doc link ever
changes.

**Important:** the current link uses Google's `/edit` URL, which lets
anyone who opens it make changes to the document. For a read-only
experience, open the Doc, click **Share → General access → Anyone with
the link → Viewer**, then use the `/edit`-style link as-is (Google
respects the Viewer permission regardless of `/edit` vs `/view` in the
URL) or swap `/edit?usp=sharing` for `/view` in the link for extra
clarity. Also double-check access is NOT restricted to specific people,
or she'll hit a sign-in/permission wall on her phone.

### 3. (Optional) Tweak hints/wording
- `puzzle1.html` — change the subtitle/hint text if you want to give her
  a nudge, or remove hints to make it harder.
- `index.html` via `js/landing.js` — edit the `PUZZLES` array to rename
  puzzle titles, etc.

## Adding more puzzles later

The project is scaffolded so adding Puzzle 2, 3, etc. is quick:

1. In `js/landing.js`, update the `PUZZLES` array entry for `puzzle2`
   (or `puzzle3`) to point to a real `href`, e.g. `"puzzle2.html"`.
2. Duplicate `puzzle1.html` → `puzzle2.html` and `js/puzzle1.js` →
   `js/puzzle2.js`, updating the puzzle logic/content and making sure it
   calls `markSolved("puzzle2")` when solved.
3. Duplicate `reward1.html` → `reward2.html` and `js/reward1.js` →
   `js/reward2.js`, updating `guardReward("puzzle2", ...)` accordingly.
4. The landing page will automatically unlock Puzzle 2's tile once
   Puzzle 1 is marked solved — no extra wiring needed.

## Testing locally before sharing

**Important:** don't test by double-clicking the HTML files directly
(opening them as `file://...` in your browser). Browsers isolate storage
per local file in that mode, so `localStorage` progress saved on one
page (e.g. `puzzle1.html`) may not be visible on another (e.g.
`reward1.html`) — this can make the outfit-list link look broken or
puzzle 1 seem "stuck" even after a refresh.

Instead, serve the folder with a simple local server so all pages share
one real origin, just like they will once hosted:

```powershell
cd "birthday 2026"
python -m http.server 8080 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8080/index.html` in your browser.

> Note: on some Windows/Python setups, running `python -m http.server 8080`
> without `--bind 127.0.0.1` can cause the browser to show
> `ERR_ADDRESS_INVALID` when visiting `localhost`. Using
> `--bind 127.0.0.1` and the matching `http://127.0.0.1:8080` URL avoids
> this.

### Resetting progress while testing
Since solved puzzles are remembered in `localStorage`, visit any page
with `?reset=1` on the end of the URL to clear all saved progress, e.g.:

```
http://localhost:8080/index.html?reset=1
```

There's also a **"🔄 Reset progress (testing only)"** link at the bottom
of the landing page for convenience — delete that link from `index.html`
before sending the final link to her, since you don't want her
accidentally resetting her own progress.

## Hosting it online (free) so you can share a link

### Option A — Netlify Drop (fastest, no account strictly needed)
1. Go to https://app.netlify.com/drop in your browser.
2. Drag the entire `birthday 2026` folder onto the page.
3. Netlify gives you an instant live URL (e.g.
   `https://random-name-1234.netlify.app`) — copy and share that link.
4. (Optional) Create a free Netlify account to keep the site permanently
   and rename the URL to something custom.

### Option B — GitHub Pages
1. Create a new GitHub repository and push all these files to it.
2. In the repo settings, go to **Pages** and set the source to the
   `main` branch, root folder.
3. GitHub gives you a URL like
   `https://yourusername.github.io/your-repo-name/`.
4. Share that link — she just taps it on her phone to open the site.

Either option works great on mobile — the whole site is responsive and
designed to be opened directly from a shared link/text message.

## File structure

```
birthday 2026/
├── index.html        Landing page ("The Birthday Games")
├── puzzle1.html       Countdown puzzle
├── reward1.html         Outfit list (unlocked after puzzle1)
├── css/
│   └── style.css        Shared romantic/pink theme
├── js/
│   ├── progress.js       localStorage-based progress tracker
│   ├── hearts.js           Floating hearts background animation
│   ├── landing.js            Renders puzzle tiles + lock/unlock logic
│   ├── puzzle1.js             Countdown + answer checking logic
│   └── reward1.js              Access guard for the outfit list page
└── README.md
```
