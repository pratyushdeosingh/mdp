# MDP - Motor Dynamics Platform

A real-time IoT vehicle telemetry dashboard for GPS tracking, motion monitoring, and accident detection. Built with React + TypeScript for the frontend and a Node.js bridge server that connects to an Arduino over USB serial.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Running](#setup--running)
  - [1. Main Dashboard (React)](#1-main-dashboard-react)
  - [2. Bridge Server (Node.js)](#2-bridge-server-nodejs)
  - [3. Arduino Firmware](#3-arduino-firmware)
- [Hardware Wiring](#hardware-wiring)
- [Usage](#usage)
  - [Simulation Mode](#simulation-mode)
  - [Hardware Mode](#hardware-mode)
- [Dashboard Pages](#dashboard-pages)
- [Arduino Data Format](#arduino-data-format)
- [Architecture](#architecture)

---

## Overview

MDP streams live sensor data from an Arduino Uno (GPS + accelerometer) to a web dashboard via a WebSocket bridge. It supports two modes:

- **Simulation Mode** — no hardware needed, generates fake GPS/sensor data for testing
- **Hardware Mode** — connects to a real Arduino over USB serial and streams live data

---

## Features

- Real-time GPS tracking with interactive map and trail history
- Accelerometer data visualization (X, Y, Z axes)
- Accident detection with buzzer alert (threshold: 25 m/s²)
- Historical analytics charts (last 60 seconds of data)
- Serial monitor with color-coded log messages
- Hardware status panel showing module integration info
- Dark / Light theme toggle
- PDF report generation
- Simulation mode for development without hardware

---

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite (dev server + build)
- Tailwind CSS 4
- React Router 7
- Recharts (data visualization)
- Leaflet / React-Leaflet (interactive map)
- jsPDF (report generation)

**Bridge Server**
- Node.js + Express
- `ws` (WebSocket)
- `serialport` (USB serial communication)

**Firmware**
- Arduino Uno R3
- TinyGPS++ (GPS parsing)
- ArduinoJson (JSON serialization)
- Wire.h (I2C for MPU6050)

---

## Project Structure

```
mdp/
├── arduino/
│   └── mdp_firmware/
│       └── mdp_firmware.ino    # Arduino sketch
├── server/
│   ├── server.js               # Bridge server (serial <-> WebSocket)
│   └── package.json
├── src/
│   ├── components/             # Reusable UI components
│   ├── context/
│   │   └── AppContext.tsx      # Global state
│   ├── hooks/
│   │   └── useSerialConnection.ts
│   ├── pages/                  # Dashboard pages
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── utils/
│       ├── simulator.ts        # Simulation data generator
│       └── reportGenerator.ts
├── package.json
└── vite.config.ts
```

---

## Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or later — https://nodejs.org
- **npm** (comes with Node.js)
- **Arduino IDE** (only needed for flashing firmware) — https://www.arduino.cc/en/software

The bridge server uses `serialport` which requires a working Python environment and build tools on some systems. If `npm install` fails in the `server/` folder, install the required build tools for your OS.

---

## Setup & Running

### 1. Main Dashboard (React)

```bash
# From the root of the project
npm install
npm run dev
```

Opens at **http://localhost:5173**

### 2. Bridge Server (Node.js)

> Only needed when using real Arduino hardware. Skip this for simulation mode.

```bash
cd server
npm install
node server.js
```

Runs at **http://localhost:3001**

Keep this terminal open while using the dashboard in hardware mode.

### 3. Arduino Firmware

1. Open `arduino/mdp_firmware/mdp_firmware.ino` in the Arduino IDE
2. Install required libraries via Library Manager:
   - `TinyGPS++`
   - `ArduinoJson`
3. Select **Arduino Uno** as the board
4. Select the correct COM port
5. Click **Upload**
6. Set Serial Monitor baud rate to `9600` to verify output

---

## Hardware Wiring

| Component | Arduino Pin |
|-----------|-------------|
| NEO-6M GPS TX | Pin 4 (Software Serial RX) |
| NEO-6M GPS RX | Pin 3 (Software Serial TX) |
| MPU6050 SDA | A4 (I2C) |
| MPU6050 SCL | A5 (I2C) |
| Buzzer (+) | Pin 8 |
| Cancel Button | Pin 7 |

> MPU6050 I2C address: `0x68`
> GPS baud rate: `9600`
> Power MPU6050 and NEO-6M from Arduino 3.3V or 5V depending on module variant.

---

## Usage

### Simulation Mode

No hardware or bridge server required.

1. Start the dashboard: `npm run dev`
2. Open http://localhost:5173
3. On the landing page, select **Simulation Mode** (or it defaults to simulation)
4. Click **Start Streaming** on the dashboard

The simulator generates random GPS coordinates around Chennai, India with realistic accelerometer noise and occasional accident events.

### Hardware Mode

Requires the Arduino to be flashed and the bridge server running.

1. Flash the Arduino firmware (see above)
2. Connect Arduino to your PC via USB
3. Start the bridge server: `cd server && node server.js`
4. Start the dashboard: `npm run dev` (from the project root)
5. Open http://localhost:5173
6. Select **Hardware Mode**
7. Click **Refresh Ports** to detect available COM ports
8. Select your Arduino's COM port and click **Connect**
9. Live data will start streaming automatically

---

## Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Live metrics — GPS coordinates, speed, altitude, accelerometer XYZ, battery, temperature, accident alert |
| **Live Map** | Interactive Leaflet map with real-time position marker and trail history |
| **Analytics** | Historical charts for the last 60 seconds of accelerometer, speed, and altitude data |
| **Serial Monitor** | Terminal-style log viewer with color-coded info / warning / error / success messages |
| **Hardware Status** | Details of all connected hardware modules and integration status |
| **Documentation** | Project documentation and reference |

---

## Arduino Data Format

The firmware sends one JSON line per second at 9600 baud:

```json
{
  "lat": 13.123456,
  "lng": 80.456789,
  "spd": 45.2,
  "alt": 50.5,
  "ax": 0.12,
  "ay": -0.45,
  "az": 9.81,
  "ta": 9.83,
  "ad": 0,
  "tmp": 0
}
```

| Key | Meaning | Unit |
|-----|---------|------|
| `lat` | Latitude | degrees |
| `lng` | Longitude | degrees |
| `spd` | Speed | km/h |
| `alt` | Altitude | meters |
| `ax` | Accel X | m/s² |
| `ay` | Accel Y | m/s² |
| `az` | Accel Z | m/s² |
| `ta` | Total acceleration magnitude | m/s² |
| `ad` | Accident detected | 0 or 1 |
| `tmp` | Temperature (reserved) | — |

On boot, the Arduino also sends:
```json
{"status": "boot", "msg": "MDP firmware ready"}
```

---

## Architecture

```
Hardware Mode:

  Arduino Uno (USB Serial, 9600 baud)
        |
        | JSON lines
        v
  Bridge Server (localhost:3001)
    - REST: GET /api/ports
    - REST: POST /api/connect
    - REST: POST /api/disconnect
    - WS:   ws://localhost:3001/ws
        |
        | WebSocket frames
        v
  React Dashboard (localhost:5173)

Simulation Mode:

  simulator.ts (in-memory data generator)
        |
        v
  AppContext (React state)
        |
        v
  React Dashboard (localhost:5173)
```
