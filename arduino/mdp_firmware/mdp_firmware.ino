/*
 * MDP IoT Firmware — GPS & Accident Detection System
 * Review III — 100% Hardware Integration (Raw I2C MPU6050)
 *
 * Reads NEO-6M GPS, MPU6050 Accelerometer/Gyroscope
 * Detects accidents via acceleration threshold
 * Outputs one JSON line per second to Serial (USB) at 9600 baud
 *
 * Wiring:
 * NEO-6M GPS    — GPS TX → Arduino RX (pin 4), GPS RX → Arduino TX (pin 3)
 * MPU6050       — SDA → A4, SCL → A5
 * Buzzer        — pin 8
 *
 * Safety Features:
 * - Watchdog timer (2s) prevents lockups if I2C hangs
 * - Buffer overflow protection with larger dtostrf buffer
 */

#include <Wire.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <avr/wdt.h>  // Watchdog timer

// ── Pin & Hardware Configuration ───────────────────────────
#define GPS_RX_PIN   4
#define GPS_TX_PIN   3
#define BUZZER_PIN   8
#define CANCEL_BTN_PIN 7
const int MPU_ADDR = 0x68;

// ── Accident Detection ─────────────────────────────────────
#define ACCIDENT_THRESHOLD 25.0   // Total acceleration threshold (m/s²)
#define ALERT_DURATION     10000  // 10 seconds buzzer alert window

// ── Objects ────────────────────────────────────────────────
TinyGPSPlus gps;
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);

// ── State ──────────────────────────────────────────────────
bool accidentDetected = false;
unsigned long accidentTime = 0;
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 1000;  // 1 second
bool mpuAvailable = false;

// Button debounce state
unsigned long lastButtonPress = 0;
const unsigned long DEBOUNCE_MS = 200;

// ── Setup ──────────────────────────────────────────────────
void setup() {
  // Disable watchdog during setup (may be on from previous reset)
  wdt_disable();
  
  Serial.begin(9600);
  gpsSerial.begin(9600);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  pinMode(CANCEL_BTN_PIN, INPUT_PULLUP);

  Wire.begin();

  // Initialize MPU6050 directly via I2C
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);  // PWR_MGMT_1 register
  Wire.write(0);     // Set to 0 to wake up
  byte error = Wire.endTransmission(true);

  if (error == 0) {
    mpuAvailable = true;
  } else {
    mpuAvailable = false;
  }

  // Startup message
  Serial.println(F("{\"status\":\"boot\",\"msg\":\"MDP firmware ready\",\"wdt\":\"enabled\"}"));
  
  // Enable watchdog timer (2 second timeout)
  // If loop() hangs (e.g., I2C lockup), Arduino will auto-reset
  wdt_enable(WDTO_2S);
}

// ── Main Loop ──────────────────────────────────────────────
void loop() {
  // Reset watchdog timer at start of each loop iteration
  // If loop hangs, watchdog will reset the Arduino after 2 seconds
  wdt_reset();
  
  // ── 1. Feed GPS parser (listen for ~200ms) ──
  gpsSerial.listen();
  unsigned long gpsStart = millis();
  while (millis() - gpsStart < 200) {
    while (gpsSerial.available()) {
      gps.encode(gpsSerial.read());
    }
  }

  // ── 2. Read accelerometer (Raw I2C) ──
  float ax = 0, ay = 0, az = 0;
  float totalAccel = 0;

  if (mpuAvailable) {
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x3B);  // Start at ACCEL_XOUT_H
    byte err = Wire.endTransmission(false);
    if (err != 0) {
      // I2C bus may be stuck — attempt recovery
      Wire.begin();
      return; // skip this cycle
    }

    Wire.requestFrom((uint8_t)MPU_ADDR, (uint8_t)6, (uint8_t)true);
    if (Wire.available() < 6) return; // incomplete read

    // Read bytes into temporaries to avoid undefined evaluation order
    uint8_t axH = Wire.read(), axL = Wire.read();
    uint8_t ayH = Wire.read(), ayL = Wire.read();
    uint8_t azH = Wire.read(), azL = Wire.read();

    int16_t raw_AcX = (int16_t)(axH << 8 | axL);
    int16_t raw_AcY = (int16_t)(ayH << 8 | ayL);
    int16_t raw_AcZ = (int16_t)(azH << 8 | azL);

    // Convert to m/s^2 (Assuming default +/- 2g scale)
    ax = (raw_AcX / 16384.0) * 9.81;
    ay = (raw_AcY / 16384.0) * 9.81;
    az = (raw_AcZ / 16384.0) * 9.81;

    totalAccel = sqrt(ax * ax + ay * ay + az * az);
  }

  // ── 3. Accident detection ──
  if (totalAccel > ACCIDENT_THRESHOLD && !accidentDetected) {
    accidentDetected = true;
    accidentTime = millis();
  }

  // Handle active accident alert
  if (accidentDetected) {
    if (digitalRead(CANCEL_BTN_PIN) == LOW && (millis() - lastButtonPress > DEBOUNCE_MS)) {
      // Manual cancel button pressed (debounced)
      lastButtonPress = millis();
      accidentDetected = false;
      digitalWrite(BUZZER_PIN, LOW);
    }
    // Auto-clear after alert duration (10 seconds)
    else if (millis() - accidentTime > ALERT_DURATION) {
      accidentDetected = false;
      digitalWrite(BUZZER_PIN, LOW);
    }
    else {
      // Buzzer beeping pattern (500ms on/off)
      digitalWrite(BUZZER_PIN, (millis() / 500) % 2 == 0 ? HIGH : LOW);
    }
  }

  // ── 4. Send JSON every SEND_INTERVAL ──
  if (millis() - lastSend < SEND_INTERVAL) return;
  lastSend = millis();

  StaticJsonDocument<300> doc;
  // Increased buffer size to 24 chars for safety with large values
  // Prevents buffer overflow with negative coordinates or large altitude/speed
  char buf[24];

  // GPS valid flag — explicit boolean so server doesn't rely on lat/lng==0 check
  bool gpsValid = gps.location.isValid();
  doc["gv"] = gpsValid ? 1 : 0;

  if (gpsValid) {
    dtostrf(gps.location.lat(), 1, 6, buf);
    doc["lat"] = serialized(buf);
    dtostrf(gps.location.lng(), 1, 6, buf);
    doc["lng"] = serialized(buf);
  } else {
    doc["lat"] = 0.0;
    doc["lng"] = 0.0;
  }

  if (gps.speed.isValid()) {
    dtostrf(gps.speed.kmph(), 1, 1, buf);
    doc["spd"] = serialized(buf);
  } else {
    doc["spd"] = 0.0;
  }

  if (gps.altitude.isValid()) {
    dtostrf(gps.altitude.meters(), 1, 1, buf);
    doc["alt"] = serialized(buf);
  } else {
    doc["alt"] = 0.0;
  }

  dtostrf(ax, 1, 3, buf);
  doc["ax"] = serialized(buf);
  dtostrf(ay, 1, 3, buf);
  doc["ay"] = serialized(buf);
  dtostrf(az, 1, 3, buf);
  doc["az"] = serialized(buf);
  dtostrf(totalAccel, 1, 2, buf);
  doc["ta"] = serialized(buf);
  doc["ad"] = accidentDetected ? 1 : 0;
  doc["tmp"] = 0;       // Placeholder — no temp sensor in current hardware
  doc["bat"] = 100;     // Placeholder — no battery sensor; report full
  doc["mpu"] = mpuAvailable ? 1 : 0;  // MPU6050 status for dashboard
  doc["ms"] = millis();               // Arduino uptime for timing/gap detection

  serializeJson(doc, Serial);
  Serial.println();  // Newline delimiter
}