# v1 acceptance checklist

`[x]` = verified by the builder (tests/build). `[ ]` = **needs you** on the real system.

## Function
- [ ] Sign in with your account; any other route when signed out goes to /login; there is no sign-up route.
- [ ] Create, edit, delete and Undo: semester, course, deadline, task, event.
- [x] Class times use the right weekday/time, skip breaks/odd-even weeks, and keep local time across Sydney DST (unit tests).
- [ ] Dashboard shows real data; "Remove demo data" leaves real data untouched.
- [x] Timer is computed from timestamps and excludes pauses (unit tests). [ ] Switch tab for 5 min: drift under 2 s. [ ] Close and reopen: the running session is still there.
- [ ] Study Room mixes 3+ sources; sleep timer stops on time; presets save/reload; nothing plays on page load.
- [x] EN/VI keys match (test). [ ] Switching language changes the whole UI; changing theme does not flash.
- [ ] Export JSON downloads with every table; `scripts/restore.ts` loads it into a blank project.

## Data and security
- [ ] Data survives reload, closing the browser, and sign-out/sign-in.
- [ ] A deadline created on the laptop appears on the phone when you open the app.
- [ ] `npx tsx scripts/rls-test.ts` — all PASS (anonymous client gets 0 rows, sign-up rejected).

## Devices and performance
- [ ] Layout is right at 360, 390, 768, 1280, 1440 px.
- [ ] PWA installs on iPhone/Android and opens.
- [ ] Quick Add task in ≤ 3 actions; Dashboard under 2 s on 4G.
- [x] Colour tokens meet AA contrast (test). [ ] Whole app usable by keyboard.

Not built in v1 (by design): ICS import (it was only a proposal), push notifications, offline writes, phase-2 modules.

# Phase 2 (run `supabase/migrations/0003_phase2.sql` first)
- [x] Grade maths (hand-checked cases, hurdle, out-of-reach, weights != 100): unit tests. [ ] Check the scale (HD 85 / D 75 / Cr 65 / P 50) against your handbook; [ ] cumulative GPA matches your transcript.
- [x] Analytics maths (per week/weekday, on-time rate, tasks per week, mood vs study) unit-tested. [ ] Six charts match your own data; empty states look right; mood chart appears after 14 days of check-ins.
- [x] Check-in streak and 7-day edit window unit-tested. [ ] Check-in takes under 30 s; water glass and sleep save; streak across midnight in Sydney.
- [x] Markdown never runs HTML/`javascript:` links (tests). [ ] Notes autosave; go offline, type, come back: text is kept; two devices: conflict banner.
- [x] Money in whole cents; recurring items (salary) catch up after a long absence (tests). [ ] Monthly totals match your list; [ ] CSV export opens in a spreadsheet.
- [ ] RLS: a second test account cannot read any phase-2 table. [ ] Migration 0003 on a copy of your real data, then export and restore.
- [ ] Focus mode: start a timer, the nav shrinks to a slim icon bar and snow falls; Reduce effects turns it off.
