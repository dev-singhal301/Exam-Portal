# Secure Proctored Assessment Platform

## 💡 Overview
The Secure Proctored Assessment Platform is a robust, live examination environment built for educational institutions and technical recruiters. Designed to handle high-stakes assessments (like 3-hour coding competitions or case studies), the platform enforces strict anti-cheat proctoring while delivering a seamless, glitch-free experience for candidates.

> "A bulletproof testing environment that balances strict security with intelligent candidate assistance."

Beyond standard question delivery, the platform features a highly configurable admin architecture. Admins can create dynamic language or subject tracks, bulk-import questions via CSV, and enable a tightly controlled, rate-limited AI Assistant powered by Google Gemini to help students with structural guidance during complex case studies. 

## ✨ Features
- 🔐 **Secure Authentication** — Persistent sessions with silent token auto-refresh via Supabase Auth to ensure candidates are never logged out mid-exam.
- ⏱️ **Bulletproof Server-Anchored Timer** — Countdown logic tied to a database-stored real-world `end_time` timestamp, completely immune to PC sleep exploits, page refreshes, and network drops.
- 🛡️ **Anti-Cheat Proctoring** — Strict 3-strike fullscreen enforcement. Exiting fullscreen or switching tabs logs a violation. Reaching 3 strikes results in automatic disqualification.
- 🧠 **Configurable AI Assistant** — Integrated Google Gemini (`gemini-3.8-flash`) provides structural hints. Admins can dynamically configure the maximum allowed queries per student and the AI response word limit directly from the dashboard.
- 🔀 **Dynamic Category Tracks** — Admins can enable custom selection screens (e.g., "Select your Tech Stack: React, Java, Python") with customizable titles and instructions that lock candidates into a specific question track.
- 📁 **CSV Bulk Import** — Quickly construct exams by downloading a template and uploading hundreds of questions (Single Choice, Multiple Choice, True/False, Descriptive) in seconds.
- ⚡ **Real-Time Terminations** — Powered by Supabase Realtime WebSockets, admins can instantly terminate a candidate's live session, immediately locking their screen and submitting their current progress.
- 📊 **Flexible Scoring Engine** — Support for custom positive marks and negative mark penalties for incorrect answers.
- 🛠️ **Admin Dashboard** — Create, edit, and publish exams, toggle result visibility, and view live candidate submissions and leaderboards.

## 👩‍💻 Tech Stack
**Backend (BaaS)**
- Supabase PostgreSQL (Database)
- Supabase Auth (Authentication & Session Management)
- Supabase Realtime (WebSocket subscriptions for live terminations)
- AI Integration: Google Gemini API (`gemini-3.8-flash`)

**Frontend**
- React
- React Router DOM (Navigation)
- Tailwind CSS (Styling)
- Lucide React (Icons)
- Build Tool: Vite

## 📦 Getting Started
To get a local copy of this project up and running, follow these steps.

### 🚀 Prerequisites
- Node.js and npm
- A free [Supabase](https://supabase.com/) account and project
- A free [Google AI Studio](https://aistudio.google.com/) API key for Gemini

### 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tech697info-stack/proctored-exam-portal.git
   cd proctored-exam-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup (Supabase SQL Editor):**
   Run the following SQL commands in your Supabase dashboard to ensure your tables have the latest configuration columns:
   ```sql
   -- Submissions Table Updates
   ALTER TABLE submissions ADD COLUMN IF NOT EXISTS end_time timestamptz;
   
   -- Exams Table Updates (Admin Configurations)
   ALTER TABLE exams 
   ADD COLUMN IF NOT EXISTS category_selection_title text DEFAULT 'Select Your Track',
   ADD COLUMN IF NOT EXISTS category_selection_message text DEFAULT 'Please select the track you wish to be tested on. You cannot change this later.',
   ADD COLUMN IF NOT EXISTS ai_word_limit integer DEFAULT 200,
   ADD COLUMN IF NOT EXISTS ai_attempts_limit integer DEFAULT 2;
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view the app in your browser.

## 🤖 AI Assistant Setup (Optional)
The platform features an optional AI guide to assist students during complex descriptive questions.
1. Generate an API key from Google AI Studio.
2. Add it to your `.env` file as `VITE_GEMINI_API_KEY`.
3. When creating an exam in the Admin dashboard, check the **"Enable AI Assistant"** box to reveal configurations for the word limit and maximum queries per student.

## 📸 Preview
*(Add your screenshots here)*
- **Candidate Exam Screen (Fullscreen Lock)**
- **Admin Exam Creation & CSV Import**
- **AI Assistant Chat Drawer**
- **Dynamic Category Selection**

## 🤝 Contributing
We welcome contributions to this project. Please follow these steps to contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature-name`).
5. Open a pull request.

## 🐛 Issues
If you encounter any issues while using or setting up the project, please check the Issues section to see if it has already been reported. If not, feel free to open a new issue detailing the problem.

When reporting an issue, please include:
- A clear and descriptive title.
- A detailed description of the problem.
- Steps to reproduce the issue.
- Any relevant console errors or screenshots.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
