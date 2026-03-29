/*
 * MDP IoT Firmware — GPS & Accident Detection System
 * Review IV — Production Safety Fixes
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
 * - Watchdog timer (4s) prevents lockups if I2C hangs
 * - Buffer overflow protection with larger dtostrf buffer
 * - Gravity calibration removes static bias from acceleration
 * - Exponential moving average filters noise/vibration
 * - MPU failure detection alerts user after consecutive errors
 * - Non-blocking GPS parsing prevents missed impacts
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
// ACCIDENT_THRESHOLD: 25 m/s² (≈2.5g) after gravity removal
// Typical impacts: braking 8 m/s², pothole 15-20 m/s², collision >30 m/s²
#define ACCIDENT_THRESHOLD 25.0   // Total acceleration threshold (m/s²)
#define ALERT_DURATION     10000  // 10 seconds buzzer alert window

// ── Noise Filtering ────────────────────────────────────────
// Exponential moving average smoothing factor (0-1, lower = more smoothing)
#define FILTER_ALPHA       0.3

// ── MPU Failure Detection ──────────────────────────────────
#define I2C_FAILURE_THRESHOLD 10  // Consecutive failures before marking MPU dead
#define MPU_SCALE_FACTOR   16384.0  // LSB/g for ±2g scale (from MPU6050 datasheet)
#define GRAVITY_MS2        9.81

// ── GPS Parsing Limits ─────────────────────────────────────
#define GPS_PARSE_TIMEOUT_MS  50   // Max time for GPS parsing per loop
#define GPS_CHAR_LIMIT        64   // Max chars to read per loop

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
bool buttonWasPressed = false;  // Track button hold state

// ── Gravity Calibration State ──────────────────────────────
// Stores the baseline gravity vector measured at startup
float gravityX = 0, gravityY = 0, gravityZ = 0;
bool gravityCalibrated = false;

// ── Noise Filter State ─────────────────────────────────────
// Filtered acceleration value (exponential moving average)
float filteredAccel = 0;

// ── MPU Failure Tracking ───────────────────────────────────
int i2cFailureCount = 0;

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
    
    // Explicitly configure accelerometer scale to ±2g for consistency
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x1C);  // ACCEL_CONFIG register
    Wire.write(0x00);  // ±2g scale (bits 3-4 = 00)
    Wire.endTransmission(true);
    
    // Calibrate gravity offset (helmet must be stationary during boot)
    calibrateGravity();
  } else {
    mpuAvailable = false;
  }

  // Startup message
  Serial.println(F("{\"status\":\"boot\",\"msg\":\"MDP firmware ready (v4 safety)\",\"wdt\":\"enabled\",\"cal\":\"gravity\"}"));
  
  // Enable watchdog timer (4 second timeout for longer operations)
  // If loop() hangs (e.g., I2C lockup), Arduino will auto-reset
  wdt_enable(WDTO_4S);
}

// ── Gravity Calibration ────────────────────────────────────
// Called once during setup() to capture baseline gravity vector
// IMPORTANT: Helmet must be stationary during boot for accurate calibration
void calibrateGravity() {
  if (!mpuAvailable) return;
  
  gravityX = 0;
  gravityY = 0;
  gravityZ = 0;
  
  const int samples = 50;  // Average 50 readings for stability
  int validSamples = 0;
  
  for (int i = 0; i < samples; i++) {
    wdt_reset();  // Keep watchdog happy during calibration
    
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x3B);
    if (Wire.endTransmission(false) != 0) {
      delay(10);
      continue;
    }
    
    Wire.requestFrom((uint8_t)MPU_ADDR, (uint8_t)6, (uint8_t)true);
    if (Wire.available() < 6) {
      delay(10);
      continue;
    }
    
    uint8_t axH = Wire.read(), axL = Wire.read();
    uint8_t ayH = Wire.read(), ayL = Wire.read();
    uint8_t azH = Wire.read(), azL = Wire.read();
    
    int16_t raw_AcX = (int16_t)(axH << 8 | axL);
    int16_t raw_AcY = (int16_t)(ayH << 8 | ayL);
    int16_t raw_AcZ = (int16_t)(azH << 8 | azL);
    
    gravityX += (raw_AcX / MPU_SCALE_FACTOR) * GRAVITY_MS2;
    gravityY += (raw_AcY / MPU_SCALE_FACTOR) * GRAVITY_MS2;
    gravityZ += (raw_AcZ / MPU_SCALE_FACTOR) * GRAVITY_MS2;
    validSamples++;
    
    delay(10);  // 10ms between samples
  }
  
  if (validSamples > 0) {
    gravityX /= validSamples;
    gravityY /= validSamples;
    gravityZ /= validSamples;
    gravityCalibrated = true;
  }
}

// ── Main Loop ──────────────────────────────────────────────
void loop() {
  // Reset watchdog timer at start of each loop iteration
  // If loop hangs, watchdog will reset the Arduino after 4 seconds
  wdt_reset();
  
  // ── 1. Read accelerometer FIRST (highest priority for safety) ──
  float ax = 0, ay = 0, az = 0;
  float totalAccel = 0;

  if (mpuAvailable) {
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x3B);  // Start at ACCEL_XOUT_H
    byte err = Wire.endTransmission(false);
    if (err != 0) {
      // I2C failure — track consecutive errors
      i2cFailureCount++;
      if (i2cFailureCount >= I2C_FAILURE_THRESHOLD) {
        // MPU has failed — alert user and mark unavailable
        mpuAvailable = false;
        digitalWrite(BUZZER_PIN, HIGH);  // Continuous alert for hardware fault
        Serial.println(F("{\"err\":\"mpu_timeout\",\"msg\":\"MPU6050 not responding\"}"));
      }
      Wire.begin();  // Attempt I2C recovery
      // Don't skip loop — continue with GPS and send status
    } else {
      // Successful I2C communication
      i2cFailureCount = 0;  // Reset failure counter
      
      Wire.requestFrom((uint8_t)MPU_ADDR, (uint8_t)6, (uint8_t)true);
      if (Wire.available() >= 6) {
        // Read bytes into temporaries to avoid undefined evaluation order
        uint8_t axH = Wire.read(), axL = Wire.read();
        uint8_t ayH = Wire.read(), ayL = Wire.read();
        uint8_t azH = Wire.read(), azL = Wire.read();

        int16_t raw_AcX = (int16_t)(axH << 8 | axL);
        int16_t raw_AcY = (int16_t)(ayH << 8 | ayL);
        int16_t raw_AcZ = (int16_t)(azH << 8 | azL);

        // Convert to m/s² using defined scale factor
        ax = (raw_AcX / MPU_SCALE_FACTOR) * GRAVITY_MS2;
        ay = (raw_AcY / MPU_SCALE_FACTOR) * GRAVITY_MS2;
        az = (raw_AcZ / MPU_SCALE_FACTOR) * GRAVITY_MS2;

        // CRITICAL FIX: Remove gravity bias for true impact measurement
        // Without this, stationary helmet reads ~9.81 m/s², leaving only 15 m/s² headroom
        float adjustedX = ax - gravityX;
        float adjustedY = ay - gravityY;
        float adjustedZ = az - gravityZ;
        
        // Calculate total acceleration (magnitude of gravity-adjusted vector)
        float rawTotalAccel = sqrt(adjustedX * adjustedX + adjustedY * adjustedY + adjustedZ * adjustedZ);
        
        // CRITICAL FIX: Apply exponential moving average filter to reduce noise
        // This prevents false positives from road vibration/potholes
        filteredAccel = (FILTER_ALPHA * rawTotalAccel) + ((1.0 - FILTER_ALPHA) * filteredAccel);
        totalAccel = filteredAccel;
      }
    }
  }

  // ── 2. Accident detection (uses filtered acceleration) ──
  if (totalAccel > ACCIDENT_THRESHOLD && !accidentDetected && mpuAvailable) {
    accidentDetected = true;
    accidentTime = millis();
  }

  // Handle active accident alert
  if (accidentDetected) {
    // FIXED: Proper button debounce with hold detection
    if (digitalRead(CANCEL_BTN_PIN) == LOW) {
      if (!buttonWasPressed && (millis() - lastButtonPress > DEBOUNCE_MS)) {
        // Rising edge of button press (debounced)
        lastButtonPress = millis();
        accidentDetected = false;
        digitalWrite(BUZZER_PIN, LOW);
        buttonWasPressed = true;  // Prevent re-trigger while held
      }
    } else {
      buttonWasPressed = false;  // Button released
    }
    
    // Auto-clear after alert duration (10 seconds)
    if (accidentDetected && millis() - accidentTime > ALERT_DURATION) {
      accidentDetected = false;
      digitalWrite(BUZZER_PIN, LOW);
    }
    else if (accidentDetected) {
      // Buzzer beeping pattern (500ms on/off)
      digitalWrite(BUZZER_PIN, (millis() / 500) % 2 == 0 ? HIGH : LOW);
    }
  }

  // ── 3. Feed GPS parser (NON-BLOCKING with limits) ──
  // CRITICAL FIX: Limit GPS parsing time and chars to avoid missing impacts
  gpsSerial.listen();
  unsigned long gpsStart = millis();
  int gpsCharsRead = 0;
  
  while ((millis() - gpsStart < GPS_PARSE_TIMEOUT_MS) && (gpsCharsRead < GPS_CHAR_LIMIT)) {
    if (gpsSerial.available()) {
      gps.encode(gpsSerial.read());
      gpsCharsRead++;
    }
  }
  wdt_reset();  // Reset watchdog after GPS parsing

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