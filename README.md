# Matik Key Registration System

## Overview
A system for managing the rental and return of a single physical key using RFID chips. The goal is to always know who is in possession of the key, with a simple web interface and an RFID-enabled ESP device at the key table. Multiple users (students/admins) each have their own RFID card, but there is only one key being tracked.

## Architecture
- **Frontend:** Nuxt web app (`/nuxt`) for registration, status, and admin tasks
- **Backend:** Nuxt server routes handle API and database logic
- **Database:** Local database on developer machine (for development)
- **Hardware:** ESP microcontroller with RFID reader at the key table

## Key Features
- Register new RFID chips via web interface
- View current key holder and key status
- ESP device for reading RFID chips when key is taken/returned
- Google authentication with roles (student, admin)
- Each student/admin has their own RFID card

## Tech Stack
- Nuxt (Vue 3, TypeScript)
- Nuxt server routes for backend logic
- Local database (development)
- ESP microcontroller (e.g., ESP8266/ESP32) with RFID reader

## Data Model
- Each key event stores: Timestamp, RFID

## Communication
- ESP communicates with backend via HTTP API

## Setup
- Frontend: See `/nuxt/README.md` for setup instructions
- Backend: Handled via Nuxt server routes
- Database: Local, setup instructions to be added
- Hardware: ESP code and wiring instructions to be added

## Future Improvements
- Notifications (sms, etc.) when key is taken/submitted or overdue
- Analytics and usage history
- More advanced admin features
- Overdue key handling
