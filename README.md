# 🌾 Kisan Setu — Smart Farmer Procurement System

> A digital platform designed to simplify agricultural procurement by connecting farmers with procurement centres through slot booking, token-based queue management, procurement tracking, payment updates, and real-time centre analytics.

---

## 🎯 Smart India Hackathon 2026

**Problem Statement:** SIH26032  
**Project:** Kisan Setu — Smart Farmer Procurement System

### 💡 Problem

Farmers often face:

- Long waiting times at procurement centres
- Lack of information about available slots
- Uncertainty about their position in the queue
- Difficulty tracking procurement status
- Lack of clear payment status

### 💡 Our Solution

**Kisan Setu** provides a single digital platform where farmers can:

1. Register and log in
2. Add their crop details
3. View procurement centres
4. Book an available time slot
5. Receive a unique token
6. Track their queue position
7. View procurement status
8. Track payment status

Procurement-centre staff can manage the live queue, process procurement, record payments, and view centre analytics.

---

## ✨ Key Features

### 👨‍🌾 Farmer Module

- 🔐 Farmer Registration & Login
- 🌾 Crop Management
- 🏢 Procurement Centre Selection
- 📅 Slot Booking
- 🎟️ Automatic Token Generation
- 📊 Live Queue Position
- ⏳ Estimated Waiting Time
- 📦 Procurement Status
- 💰 Payment Status
- 📱 Mobile-Friendly Interface

### 🏢 Procurement Centre Module

- 📋 Live Farmer Queue
- 🎟️ Token Management
- 👨‍🌾 Farmer Details
- 📦 Procurement Processing
- 💵 Automatic Amount Calculation
- 💳 Payment Recording
- 📊 Real-Time Centre Analytics
- 📈 Farmers Served
- ⚖️ Quantity Procured
- 💰 Total Amount Paid

---

## 🔄 System Workflow

```text
Farmer Registration
        ↓
     Login
        ↓
   Add Crop
        ↓
Select Procurement Centre
        ↓
    Book Slot
        ↓
  Generate Token
        ↓
   Join Queue
        ↓
 Live Queue Tracking
        ↓
 Staff Calls Farmer
        ↓
 Procurement Process
        ↓
 Payment Processing
        ↓
 Farmer Views Final Status
 KisanSetu/
│
├── backend/
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── book-slot.html
│   ├── queue.html
│   ├── status.html
│   ├── staff.html
│   └── staff-dashboard.html
│
├── .gitignore
└── README.md