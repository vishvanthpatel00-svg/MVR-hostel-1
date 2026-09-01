# MVR Deluxe Boys Hostel — website

A real, working site: a gate page that splits into a **Visitor Portal** and a
**Student Portal**, plus an **Admin (warden) dashboard**. No build tools —
just open `index.html` in a browser, or host the folder anywhere static
(GitHub Pages, Netlify, Vercel).

## Files

```
index.html              Landing page — Visitor Portal / Student Portal
visitor.html             Photo album, facilities, room-sharing plans, FAQ
login.html                Student + Warden/Admin sign-in (tabbed)
student-dashboard.html    Profile, presence (in/away), reports, notices
admin.html                 Warden dashboard: students, headcount, reports, notices
css/style.css               All styling
js/data.js                   Demo "database" — students, presence, reports, notices
js/auth.js                   Login logic
js/dashboard.js              Student portal logic
js/admin.js                   Admin portal logic
js/main.js                    Shared bits: photo lightbox, ticker, FAQ accordion
```

## Try it right now

Open `index.html` in a browser. Everything works immediately because the
"database" lives in the browser's **localStorage** — there's nothing to
install.

**Logins**

The site now ships with the real 84-student roster from your room register
instead of demo students. For any student whose mobile number was recorded
in the register, their **username is that 10-digit mobile number** and
their password is `hostel@123`. For students whose mobile wasn't recorded
(about 66 of them), a placeholder username was generated from their name —
open the admin Students tab, look for the "Needs mobile / login" tag on
their row, and use Edit to add their real mobile number (which becomes
their username) once you have it.

| Portal | Username | Password |
|---|---|---|
| Warden / Admin | `admin` | `admin@123` |

**To see the full loop live:** open the site in two browser tabs. Sign in as
a student in one tab and press "Going out" (enter days away + return date),
then sign in as admin in the other tab (same browser) — the headcount
updates instantly. Switch back to the student tab, press "I'm back", and the
headcount updates again.

## 1. Swap in your real photos

Right now `visitor.html` uses placeholder photos (from picsum.photos) so the
gallery looks alive immediately. Each photo appears **twice** in the file —
once as the small thumbnail (`src=`) and once as the full-size image the
lightbox opens (`href=`) — both pointing at the same `picsum.photos/seed/...`
address. To replace one:

1. Upload your real photo somewhere (a folder next to this README works
   well — e.g. create an `images/` folder and put `mess-1.jpg` in it).
2. In `visitor.html`, find the matching line, e.g.:
   ```html
   <a href="https://picsum.photos/seed/mvr-mess1/700/700" ...>
     <img src="https://picsum.photos/seed/mvr-mess1/400/400" ...>
   ```
3. Replace **both** the `href` and the `src` with your photo's path:
   ```html
   <a href="images/mess-1.jpg" ...>
     <img src="images/mess-1.jpg" ...>
   ```
4. Repeat for each of the 12 photos (entrance, 4/5/8-sharing rooms, mess,
   kitchen, garden, washing area, study hall, lounge, attached bath, games
   room). The `data-caption="…"` text is what shows under the photo in the
   lightbox — edit that too if you want.

## 2. Fill in real contact details

Search each file for these placeholders and replace them:
- `+919000000000` — phone number, appears in `visitor.html` (call link,
  WhatsApp float button) and the footer.
- `admissions@mvrdeluxe.example` — email, in `visitor.html`.
- The address line in the footer of `visitor.html` ("Address and map link
  to be added here").

## 3. Add, edit or remove students

Do this from the **Admin portal** now — sign in as warden, go to the
Students tab:
- **+ Add student** opens a blank form.
- **Edit** on any row opens the same form pre-filled, including their
  course, guardian contact, blood group, roll number and Aadhaar — all of
  which are blank on the real roster because the paper register didn't
  record them. Fill these in as you collect them.
- **Remove** deletes a student who's left the hostel (asks you to confirm
  first).

All three write straight to `js/data.js`'s storage — no file editing
needed, and no `localStorage.clear()` needed either. (If you ever *do*
want to hand-edit the seed data directly, it's still the `SEED_STUDENTS`
array at the top of `js/data.js` — but anything typed there only applies
to a browser that has never opened the site before; the admin portal is
the way to change data for people already using it.)

A student with an ⚠ note on their row in the Students tab means something
on the original register photo was unclear (a smudge, a rotated page, a
possible duplicate) — worth a quick check against the paper register.

## 4. Important — read before using this with real students

This is a fully working front-end demo. Two things about it are fine for a
demo and **not fine for real student data**:

- **Data lives in one browser, on one device.** localStorage doesn't sync
  across phones/computers, so a warden checking from a different device
  won't see the same presence data. It's genuinely useful for trying the
  site out or presenting it, but not for daily hostel operations with many
  students.
- **Passwords are stored in plain text in `js/data.js`**, visible to
  anyone who views the page source. That's acceptable for a demo login,
  not for real people's accounts.
- **Aadhaar numbers work the same way** — stored in plain text in
  `js/data.js`. The site never *displays* the full number anywhere (every
  screen only shows the last 4 digits, via `maskAadhaar()`), but the full
  number still sits in the page's source code, so anyone who opens dev
  tools can read it. Treat this the same as the passwords: fine to see the
  masking work in a demo, not something to put real students' real Aadhaar
  numbers into until there's a real backend behind it.

**The fix for both** is a small real backend — the same approach already
used on the Sri Medha site (Supabase + GitHub Pages): a free Supabase
project gives you a real Postgres database and real authentication, and
GitHub Pages hosts the static files for free. The swap only touches
`js/data.js` (the functions like `getStudents`, `markAway`,
`markPresent` would call the Supabase REST API instead of
localStorage) — none of the HTML or the rest of the JS needs to change.
Happy to build that wiring next if you want to move this from demo to
production.

## 5. Deploying

Simplest path, matching how srimedhaedu.in is hosted:
1. Push this folder to a GitHub repo.
2. In the repo settings, enable **GitHub Pages** for the `main` branch.
3. Point your domain (if you have one) at the GitHub Pages URL.

## What's in the "advanced" column

- A simple presence system ("Going out" / "I'm back") that gives the
  kitchen a live headcount — no approval workflow, since it's just for
  cooking quantities, not permissions.
- Reports/complaints with a status pipeline (Submitted → Reviewing →
  Resolved) and warden remarks.
- A **notice board** the admin posts to, which shows on the visitor
  portal's scrolling ticker and every student's Notices tab.
- Admin **search & filter** on the student list, plus **CSV export** for
  students, and the daily headcount.
- A photo **lightbox** with keyboard navigation (arrows, escape).
