# Captain's Log — Roadmap

Repo: casswaters/modern-era-calendar. Repo-only planning file. It is excluded from GitHub Pages and never ships to the live site.
Deploy = push to main; `.github/workflows/pages.yml` publishes main to gh-pages without this file. Do not push main to gh-pages by hand.
Since v38 Captain's Log no longer carries a copy of Aretoria: its Aretoria card links to the standalone site (casswaters/aretoria, which keeps its own ROADMAP.md). Aretoria items live there.

**Last updated:** 2026-10-23, about 9:25 AM MT (v56: private Drive sync turned on)

## House rules
- Aretoria: one ivory/gold/cosmic palette, no realm color-coding; rough art drafts approved by Cassidy before publishing; Irishnu is Cassidy (he/him), in armor.
- Aretoria is linked, not embedded: no Aretoria code, data or art in this repo (old #aretoria / ?realm= / /aretoria/ links redirect to the standalone site).
- No hard-coded personal values in served files: name, initials, enterprise names and birthday come from Profile (localStorage, neutral defaults).
- Captain's Log prompts follow Cassidy's daily note template.
- Centiday is "the rest day".

## Now
- Live SW captains-log-v56 matches main.
- Private Drive sync is on (v56). Waiting on Cassidy's first Sync now on his iPhone (Drive sync, Sync now, sign in, Continue past the unverified app notice, allow). Testing mode means Google asks him to sign in again about every 7 days.
- Next after sync is live: history search ("what did I do on this day") and wake and bed trends, reading from the synced file.
- Paste a note (v54): fill a chosen day from a pasted daily note, preview first, save on tap; a bridge until the full Apple Notes backlog can be read.
- Weather: US places use the NWS station observation when fresh, else the NWS hourly forecast (rain or storms at 50% or more), plus rain chance and active alerts (v52); old cached readings and modules can no longer linger after an update (v53).

## Next
- (empty; see Ideas)

## Later
- Choose your calendar (Cassidy, Oct 23, 2026): when Captain's Log opens to others, each person picks their main calendar (Gregorian, MEC, others) and the rest show as translations; MEC stays Cassidy's default.
- Own hardware (Cassidy, Oct 23, 2026): long run, keep entries on hardware Cassidy owns (MacBook or home server) so they are truly private; build the Drive sync so it can move there without a restart.
- Private hosting for others (Cassidy, Oct 23, 2026): releasing Captain's Log to others means hosting each person's data privately and separately (server space); keep data per person and portable so this path stays open.
- 3D animated companion (cross-ref: Aretoria ROADMAP, Later): the visitor's reflection guide (Irishnu for Cassidy) as a 3D animated character who hangs around the user's Captain's Log in various moods and character phases. Ties to Aretoria's reflection-guide feature (custom fantasy name + costume).
- Calendar: extend the Jewish holiday and Umm al-Qura Eid tables past 2037.

## Ideas
- Search history ("what did I do on this day") and trends over the synced entries (Cassidy, Oct 23, 2026). Foundation for the backlog import.
- Captain's Log by photo or voice (Cassidy, Oct 23, 2026): take a picture or speak a note and it saves into the right day automatically, like a Star Trek captain's log. Builds on the Drive sync.
- Recurring thoughts log (Cassidy, Oct 18, 2026): a small spot to jot a thought that fades and returns over years or decades, each return dated, so patterns show over time. Inspired by Jung's shadow and individuation ideas (optional reflection prompts: reflect, face your shadow, notice dreams, look for patterns, connect, become your true self), sitting beside S.C.O.R.E.
- Full port of Cassidy's daily Apple Notes template into Captain's Log (Cassidy, Oct 18, 2026): he's excited to resume this soon, inspired by Benny's budget app.
- Wake/bed tracker trends over a week or month.
- Link a Captain's Log entry to the Aretoria virtue reflected on that day (both sites share the casswaters.github.io origin, so the shared name and realm reflections are already visible to both).

## Open decisions (waiting on Cassidy)
- None open right now.

## Shipped (newest first, times MT)
- 2026-10-23 09:25: v56 (SW captains-log-v56): Drive sync turned on. sync-config.js holds the Google OAuth web client ID (project Captains Log, origin https://casswaters.github.io, scope drive.appdata, consent screen in Testing with Cassidy as test user). The Drive sync button and panel now show in the log.
- 2026-10-23 09:10: v55 (SW captains-log-v55): private Drive sync, built but off. sync.js keeps one plain JSON file (captains-log.json: per day the last edit time and fields, null for a cleared day) in the Drive appDataFolder, a hidden folder only this app can reach in the user's own Drive; scope drive.appdata only, Google Identity Services token flow in a popup, token in memory only, no server. Merge keeps the newest edit per day. Each save now records its edit time (mec-log-edits); with a valid token a save syncs a few seconds later, otherwise it waits for Sync now; offline is safe and resumes when back online. Panel: Sync now, Download backup (same plain JSON, portable to own hardware later), Turn off. With an empty DRIVE_CLIENT_ID (sync-config.js) no button, panel, Google script or Drive call exists. Tests use a mocked Drive API and invented samples.
- 2026-10-23 07:20: v54 (SW captains-log-v54): Paste a note. A "Paste a note" button in the log takes a pasted plain-text daily note for the shown day, sorts it by section heading into the existing fields (Daily Tracker times to Wake and Sleep, Career, Communication, Social, Care, Drank, Ate, Dreams, Listened, Purchases, Workout, Health), and puts anything without its own field (gratitude answers, supplements, loose lines) into Notes so nothing is lost. A preview lists every field first; nothing is saved until Save. Filled fields are never replaced: old text stays and new text is added below, said so in the preview; Wake and Sleep keep a time already set. Fully in this browser, no network. Tests use an invented sample only (paste.js). Also: on phone width the weather strip wraps so Use my location no longer covers the weather line.
- 2026-10-22 16:12: v53 (SW captains-log-v53): update fix. The phone kept showing Clear while NWS called for 95% storms and a Flood Watch: the v52 weather logic was right, but the module import weather.js?v=cl42 had not changed since v42, so iOS could keep an older weather.js, and a reading saved by the older version within 15 min was repainted as is. All module imports now carry the current version (cl53), the SW precache bypasses the HTTP cache, and readings are stamped so any reading from an older version is refetched. Tests added.
- 2026-10-22 16:08: v52 (SW captains-log-v52): NWS hourly rain and storm override, rain chance, active alerts, fresher station fallback.
- 2026-10-13 08:45: v51 (SW captains-log-v51): weather fix. Open-Meteo model said clear in St. George while KSGU reported light rain; US places now lay the latest NWS station observation over the model, any current precipitation counts as rain, refresh every 15 min and on return, SW never touches weather APIs, golden hour ends at 6 degrees and never shows under rain or overcast. Assets cl51.
- 2026-10-12 06:17: v50 (SW captains-log-v50): Columbus Day (2nd Monday of October) on the calendar; asset bump to cl50; version-tolerant tests. Live matches main.
- 2026-10-08 09:45: v49: one place for the day's areas. Career, Life Journal · Notes · Communication · Social · Care, and Inputs & Outputs are no longer separate dropdowns: each Daily Tracker row (Career, Life Journal / Notes, Communication, Social, Care, Inputs & Outputs) opens its entry fields in place. Main list is Gratitude exercise, Grounding exercise, Default to, Daily Tracker. Life Journal and Notes stay one row (8 rows). Same field ids and storage, so saved entries show as before; Copy text order and headings unchanged (byte-identical for the same entry); auto and hand ticks, N of 8 and Clear day unchanged. Open rows are remembered on this device.
- 2026-10-08 08:40: v48: ornate Aretoria card in Aretoria's style: double gold rule frame with filigree corner flourishes, a small gold crest above the arch, a second gold ring and soft ivory halo around the arch, engraved gold title with a fine rule and star, gentle inner glow, marble veining kept. One ivory, gold and cosmic palette (the arch's blue and pink tints became ivory and gold). CSS and inline SVG masks only; equal-height row unchanged.
- 2026-10-08 08:20: v47: one set of daily metrics. The Daily Tracker dropdown is the only place they show: the other sections (Career, Life Journal · Notes · Communication · Social · Care, Inputs & Outputs) no longer carry their own filled-field counts (1/3, 1/8, 1/10), and the tracker's "N of 8" appears once, on its heading (the extra "N of 8 for this day" line inside is gone). Wake/sleep, auto and hand ticks, jump to section and saved data unchanged.
- 2026-10-08 06:50: v46: the Daily Tracker is the day's overview: Wake and Sleep (time fields with Profile targets) plus Career (shows the Profile holding company and main business), Life Journal / Notes, Communication, Social, Care, and Inputs & Outputs. A row ticks itself when that part of the log has entries for the day (the daily checklist counts toward Inputs & Outputs, so there is still one checklist), can be ticked by hand (saved per day), and a tap opens that section and scrolls to it. Progress reads "N of 8" on the section and in Copy text, which lists each row with a box.
- 2026-10-08 06:50: v46: header beliefs and gratitude cues editable in Profile ("Header beliefs and gratitude cues"; Cassidy's original text is the default; first line is the cue, more lines are notes; an emptied field shows nothing; "Restore original text" puts them back). Copy text follows the edits.
- 2026-10-08 06:16: v45: header and Profile. Cassidy's name sits above the date as an ownership title ("Cassidy's Captain's Log"; names ending in s take 's), larger and crisp, with a calmer log header (one meta line) and a shorter topbar subtitle. Profile names are used exactly as typed (nothing is built from initials, so "CW Enterprises" stays whole): Holding company (CW Enterprises) and Main business (Anam), shown in Career as holding company > main business; neutral fallbacks "Holding company" / "Main business", never "side venture". The Initials field is retired from Profile (its saved value is kept).
- 2026-10-08 06:16: v45: desktop equal-height row. With every section closed the log is exactly as tall as the calendar column, and Aretoria matches both; open sections grow the log up to the screen height and scroll inside. Phones keep natural stacked heights.
- 2026-10-07 17:05: v44: the no-location earth vista is time-neutral. One fixed, softly and evenly lit Earth from orbit (slow rotation kept, still under reduced motion); it never reads the clock or time zone, so no time-of-day label, sun, moon, terminator or city lights. Caption is just "Earth vista". Real time of day returns once a device or home location is set. Test proves the scene and SVG are identical across clocks and time zones.
- 2026-10-07 16:56: v43: Profile Home location field no longer truncates the city on desktop (the Use my location button wraps below in narrow columns).
- 2026-10-07 16:54: v42: no built-in weather place. Profile gains an optional Home location (typed city, looked up with Open-Meteo place search, or "Use my location"). With no location set or shared: a calm earth vista (Earth from orbit at the current time of day: daylight, golden hour or twilight over the limb, night with city lights), no weather numbers, and a "Set a location for local weather" link that opens Profile. Old cached default readings are dropped. Every em dash and tilde in served copy replaced (About text, Renaissance Days list, market notes, scene caption, permission message; empty placeholders are a middle dot); a test scans all served copy.
- 2026-10-07 16:23: v41: no em dashes or tildes in Captain's Log text. Copy text puts each cue and note on its own line under the question; the header uses " · " before the date; field labels use parentheses (e.g. "Social (Family)", "Check in (Schedule · Emails · Deals)"); the empty 1 to 10 option shows "·". Test guards it.
- 2026-10-07 16:20: v40: S.C.O.R.E. under "What am I grateful for?" is typed out (Sincerity, Consistency, Originality, Reflection, Expression) with one plain line: "A way to anchor in gratitude instead of breezing through it." Still a default template cue; also included in Copy text.
- 2026-10-07 16:12 — v39: Profile also holds wake/bed targets and a daily checklist (up to 6 lines; first three keep the old supplement ids so saved ticks stay); neutral defaults "Wake ☀️" / "Bed 💤" and Morning/Midday/Evening supplements; no personal supplement list or times in code.
- 2026-10-07 16:00 — v38: Aretoria no longer embedded (card links to casswaters.github.io/aretoria, same tab; old in-app Aretoria links redirect there; code, data, art and tests removed). Captain's Log Profile: name (shared with Aretoria), initials, enterprise names and birthday in this browser only, with neutral defaults ("Main work" / "Side venture"); no hard-coded personal values.
- 2026-10-07 15:26 — v36: Aretoria lore pass (Eirena removed, six great temples share the 81 virtues 14/14/14/13/13/13).
- 2026-10-07 14:58 — v35: Aretoria iOS hub painting fix after the arrival pull-back; Irishnu lore pass.
- 2026-10-07 13:23 — v34: Aretoria Axial arrival intro; Irishnu card bottom-right.
- 2026-10-07 10:26 — v33: Aretoria Irishnu cards on the plaza by the rune portal.
- 2026-10-07 08:53 — v32: Aretoria blue swirl in the Axial rune portal.
- 2026-10-07 08:42 — v31: Aretoria Axial rune portal with the Creed orb at its heart.
- 2026-10-07 08:28 — v30: Aretoria Axial hub repaint v3, phone sky extension.
- 2026-10-07 08:07 — v29: Aretoria Wisdom realm drifting pages tiny, faint and slow.
- 2026-10-07 08:03 — v28–v28.2: Aretoria Irishnu card stills at true scale on the bridge.
- 2026-10-07 07:50 — v27: Aretoria Irishnu stills only (hub video removed).
- 2026-10-07 07:36 — v26: Aretoria phone titles never overlap; stage card centered.
- 2026-10-07 07:34 — v25: Aretoria Irishnu is Cassidy (he/him), new portrait and avatar.
- 2026-10-07 07:18 — v24: Aretoria guardian voices rewritten; virtues are the advisors.
- 2026-10-07 07:12 — v23: Aretoria shrine sky seams blended; hub gate rows fit short phones.
- 2026-10-07 07:04 — v22: Aretoria 44px phone tap targets.
- 2026-10-07 06:53 — v21: Aretoria full-screen views reach the bottom on iOS Safari.
- 2026-10-07 06:52 — v20: Aretoria phone hub hides the big Irishnu portrait during dialogue.
- 2026-10-06 21:19 — v19: Aretoria creed sign-off centered on mobile.
- 2026-10-06 18:55 — v18: Aretoria Tolerance Hall portrait.
- 2026-10-06 18:39 — v15–v17: Aretoria Quietudeness Hall portrait.
- 2026-10-06 17:55 — v14: Aretoria Hall of Virtues cards uniform.
- 2026-10-06 17:45 — v13: Aretoria hub gates on a symmetric arc; phone gate grid.
- 2026-10-06 17:29 — v12: Aretoria repaint on the shared ivory/gold palette.
- 2026-10-06 16:57 — v9–v11: Aretoria creed centered; welcome subtitle; gold thread dropped.
- 2026-10-06 16:51 — v7–v8: Aretoria shrine fills 16:9 desktop; Irishnu cleared off Justice.
- 2026-10-06 16:44 — v6: journal favicon (replaces the calendar mark).
- 2026-10-06 16:17 — v3–v5: Aretoria smaller mobile cards, Shadow centered, shrine framing.
- 2026-10-06 11:54 — v2: Aretoria responsive mobile portrait art.
- 2026-10-06 11:46 — v1: site renamed Captain's Log; calendar and Aretoria remain features; link to standalone Aretoria.
- 2026-10-06 11:04 — mec-v27: Aretoria painted floating-island hub backdrop.
- 2026-10-06 10:48 — mec-v26: Aretoria painted guardian portraits, Irishnu portrait, realm backdrops.
- 2026-10-06 08:15 — mec-v25: Aretoria readable narration pacing; Irishnu rewritten with dry wit.
- 2026-10-05 19:26 — mec-v24: Aretoria portraits for all 81 virtue advisors.
- 2026-10-05 19:21 — mec-v23: Aretoria v1 portal (Axial hub, 7 realms, guardians, Hall, Creed).
- 2026-10-05 18:26 — mec-v22: sunrise/sunset times in the scene caption.
- 2026-10-05 14:52 — Captain's Log: static cues, wake/bed tracker, Life Journal merged into Notes.
- 2026-10-05 12:56 — mec-v20: ambient weather scene driven by the local sky.
- 2026-10-05 12:30 — mec-v18: three-column desktop (Calendar · Captain's Log · Aretoria); prompts match the daily note template.
- 2026-10-05 11:31 — mec-v16: Aretoria Almanac redesign, local sky weather strip.
- 2026-10-05 10:26 — mec-v14: Centiday is the rest day; holiday origins labeled; more Jewish holidays and Umm al-Qura Eids (2024–2037).
- 2026-10-05 09:51 — Holiday markers beyond the US set, with open/closed market notes.
