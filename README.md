# Restaurant Management & POS System (UP 65 POS)

A comprehensive, full-stack Restaurant Management, Table & Room POS System built with React, Vite, Node.js, Express, and Tailwind CSS.

## 🚀 Features

- **Top POS Navigation Bar**: Sleek horizontal navigation bar with live status indicators (Room orders ON/OFF, KOT Printer selector, Cashier profile).
- **2-Column Settings Hub**: Interactive restaurant settings including Printer Setup, KOT Templates, Ordering Terminals, Invoice Templates, GST Configuration, Dietary Preferences, and In-Room Ordering.
- **Guest Rooms & Dining Floor Management**:
  - Live Room & Table status switcher (`Available`, `Occupied`, `Reserved`, `Cleaning`).
  - Add / Edit / Delete Guest Rooms & Dining Tables.
  - In-Room Order & Table Digital QR Code generation & download.
- **Live KOT (Kitchen Order Display) Terminal**:
  - Station filters (**Main Kitchen**, **Bar & Drinks**, **Tandoor & Grill**).
  - Preparation status workflow (`Start Cooking` ➔ `Mark Order Ready` ➔ `Served & Completed`).
  - Formatted thermal KOT slip printing and Chef preparation notes.
- **Table-Centric Billing & Orders POS**:
  - Real-time running bills per table/room.
  - Instant bill settlement with multiple payment methods (Cash, Card, QR Pay, Online).

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express.js, MySQL2, JWT Auth
- **Styling**: Modern neutral dashboard palette with vibrant orange accents

## 💻 Quick Start

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
