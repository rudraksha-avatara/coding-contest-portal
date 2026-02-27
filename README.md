# Coding Contest Registration Portal

**By Team TechX**  
**Developed by:** Jaydatt Khodave & Simran Bagga  

✅ **Live Demo:** https://coding-contest-portal.pages.dev/

---

## Overview

Coding Contest Registration Portal is a lightweight web app for managing a coding contest workflow:

- Contest landing page with deadline timer
- Participant registration (Individual / Team)
- Problem statements page (P1–P6)
- Code submission (URL-based) with deadline gating
- Confirmation page for submitted entries
- “Find Registration ID” recovery
- “Find Submission ID” recovery
- Admin dashboard (assignment mode / basic UI lock)

This project is built to be **fast, responsive, and simple**, using Firebase Realtime Database for storage.

---

## Technologies Used

- **HTML**
- **CSS**
- **JavaScript**
- **TailwindCSS**
- **Firebase Realtime Database**
- **APIs**
- **JSON**

---

## Demo URL

- **Live:** https://coding-contest-portal.pages.dev/

---

## Project Structure

```text
/
├─ assets/
│  ├─ css/
│  │  ├─ app.css
│  │  └─ 404.css
│  └─ js/
│     ├─ firebase-config.js
│     ├─ app-common.js
│     ├─ index.js
│     ├─ register.js
│     ├─ submit.js
│     ├─ confirmation.js
│     ├─ problems.js
│     ├─ admin.js
│     ├─ find-id.js
│     └─ find-submission-id.js
│
├─ index.html
├─ register.html
├─ problems.html
├─ submit.html
├─ confirmation.html
├─ find-id.html
├─ find-submission-id.html
├─ admin.html
├─ 404.html
├─ sitemap.xml
└─ favicon.ico
````

---

## Pages & Features

### 1) Home (`index.html`)

* Contest description and rules
* Deadline timer (countdown)
* Quick navigation links

### 2) Register (`register.html`)

* Individual / Team registration
* Team mode shows extra member fields
* Saves registration data to Firebase
* Generates **Registration ID**

### 3) Problems (`problems.html`)

* Displays problem statements P1–P6
* Easy Problem ID reference for submission

### 4) Submit (`submit.html`)

* Submit solution via URL (GitHub/Drive/Gist/etc.)
* Deadline-based auto-disable submission
* Notes required (min 7 characters)
* Generates **Submission ID**
* Duplicate submission prevention per **RegID + ProblemID** (if enabled in your submit.js)

### 5) Confirmation (`confirmation.html`)

* Displays submission details using `?sid=SUBMISSION_ID`
* Copy Submission ID button

### 6) Find Registration ID (`find-id.html`)

* Recover registration using Email + Phone
* Shows stored registration details

### 7) Find Submission ID (`find-submission-id.html`)

* Recover submissions using RegID + Email + Phone
* Optional filter by Problem ID
* Open each found submission in confirmation page

### 8) Admin Dashboard (`admin.html`)

* View latest registrations and submissions
* Basic login overlay (frontend-only lock)
* Search + refresh supported (if enabled in admin.js)

---

## Firebase Setup

This project uses **Firebase Realtime Database** (v8 SDK CDN).

### 1) Create Firebase Project

* Go to Firebase Console
* Create a new project
* Enable **Realtime Database**

### 2) Add Web App

* Create a Web App in Firebase
* Copy Firebase config

### 3) Configure `assets/js/firebase-config.js`

Update this file with your Firebase project credentials:

```js
// assets/js/firebase-config.js (example)
var firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
```

---

## Database Structure (Recommended)

```json
{
  "registrations": {
    "REG_ID_1": {
      "id": "REG_ID_1",
      "name": "",
      "email": "",
      "phone": "",
      "college": "",
      "type": "individual|team",
      "teamName": "",
      "members": [],
      "note": "",
      "createdAt": ""
    }
  },
  "submissions": {
    "SUBMISSION_ID_1": {
      "submissionId": "SUBMISSION_ID_1",
      "regId": "REG_ID_1",
      "problemId": "P1",
      "lang": "js",
      "note": "",
      "codeUrl": "",
      "createdAt": "",
      "mode": "url"
    }
  },
  "submissionIndex": {
    "REG_ID_1_P1": "SUBMISSION_ID_1"
  }
}
```

---

## Firebase Rules (Assignment Mode)

⚠️ These rules are for **assignment/demo only**.
For production, secure with Firebase Auth + strict rules.

Example (basic read/write):

```json
{
  "rules": {
    "registrations": { ".read": true, ".write": true },
    "submissions": { ".read": true, ".write": true },
    "submissionIndex": { ".read": true, ".write": true }
  }
}
```

---

## Running Locally

Because Firebase uses client-side SDK, you should run with a local server (not file://).

### Option 1: VS Code Live Server

* Install Live Server extension
* Right-click `index.html` → “Open with Live Server”

### Option 2: Python HTTP Server

```bash
python -m http.server 5500
```

Open:

```
http://localhost:5500
```

---

## Deployment

This project is deployed on **Cloudflare Pages**:

✅ Live: [https://coding-contest-portal.pages.dev/](https://coding-contest-portal.pages.dev/)

To deploy:

* Push code to a repo
* Connect repo to Cloudflare Pages
* Build command: *(none)*
* Output directory: `/`

---

## Notes / Limitations

* Admin dashboard lock is **frontend-only** (not secure).
* For real security:

  * Use Firebase Authentication
  * Add role-based access rules
* “Find ID” pages scan records in demo mode (production should use indexed queries + OTP verification).

---

## Credits

**By Team TechX**
**Developed by:** Jaydatt Khodave & Simran Bagga
