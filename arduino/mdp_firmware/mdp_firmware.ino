/*
 * MDP IoT Firmware — GPS & Accident Detection System
 * Review III — 100% Hardware Integration
 *
 * Reads NEO-6M GPS, MPU6050 Accelerometer/Gyroscope
 * Detects accidents via acceleration threshold
 * Outputs one JSON line per second to Serial (USB) at 9600 baud
 *
 * Libraries required (install via Arduino IDE Library Manager):
 *   - TinyGPS++              (by Mikal Hart)
 *   - Adafruit MPU6050       (by Adafruit)
 *   - Adafruit Unified Sensor (by Adafruit)
 *   - ArduinoJson            (by Benoit Blanchon)
 *
 * Wiring:
 *   NEO-6M GPS    — TX → pin 4, RX → pin 3  (SoftwareSerial)
 *   MPU6050       — SDA → A4, SCL → A5       (I2C)
 *   Buzzer        — pin 8
 *   Cancel Button — pin 7 (INPUT_PULLUP, active LOW)
 */

#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// ── Pin Configuration ──────────────────────────────────────
#define GPS_RX_PIN   4
#define GPS_TX_PIN   3
#define BUZZER_PIN   8
#define BUTTON_PIN   7

// ── Accident Detection ─────────────────────────────────────
#define ACCIDENT_THRESHOLD 25.0   // Total acceleration threshold (m/s²)
#define ALERT_DURATION     10000  // 10 seconds buzzer alert window

// ── Objects ────────────────────────────────────────────────
Adafruit_MPU6050 mpu;
TinyGPSPlus gps;
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);

// ── State ──────────────────────────────────────────────────
bool accidentDetected = false;
unsigned long accidentTime = 0;
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 1000;  // 1 second
bool mpuAvailable = false;

// ── Setup ──────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);
  gpsSerial.begin(9600);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(BUZZER_PIN, LOW);

  Wire.begin();

  // Initialize MPU6050
  if (mpu.begin()) {
    mpuAvailable = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  // Startup message
  Serial.println("{\"status\":\"boot\",\"msg\":\"MDP firmware ready\"}");
}

// ── Main Loop ──────────────────────────────────────────────
void loop() {
  // ── 1. Feed GPS parser (listen for ~200ms) ──
  gpsSerial.listen();
  unsigned long gpsStart = millis();
  while (millis() - gpsStart < 200) {
    while (gpsSerial.available()) {
      gps.encode(gpsSerial.read());
    }
  }

  // ── 2. Read accelerometer ──
  float ax = 0, ay = 0, az = 0;
  float totalAccel = 0;

  if (mpuAvailable) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    ax = a.acceleration.x;
    ay = a.acceleration.y;
    az = a.acceleration.z;
    totalAccel = sqrt(ax * ax + ay * ay + az * az);
  }

  // ── 3. Accident detection ──
  if (totalAccel > ACCIDENT_THRESHOLD && !accidentDetected) {
    accidentDetected = true;
    accidentTime = millis();
  }

  // Handle active accident alert
  if (accidentDetected) {
    // Check cancel button (active LOW with pullup)
    if (digitalRead(BUTTON_PIN) == LOW) {
      accidentDetected = false;
      digitalWrite(BUZZER_PIN, LOW);
    }
    // Auto-clear after alert duration
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

  StaticJsonDocument<256> doc;

  if (gps.location.isValid()) {
    doc["lat"] = serialized(String(gps.location.lat(), 6));
    doc["lng"] = serialized(String(gps.location.lng(), 6));
  } else {
    doc["lat"] = 0;
    doc["lng"] = 0;
  }

  if (gps.speed.isValid()) {
    doc["spd"] = serialized(String(gps.speed.kmph(), 1));
  } else {
    doc["spd"] = 0;
  }

  if (gps.altitude.isValid()) {
    doc["alt"] = serialized(String(gps.altitude.meters(), 1));
  } else {
    doc["alt"] = 0;
  }

  doc["ax"] = serialized(String(ax, 3));
  doc["ay"] = serialized(String(ay, 3));
  doc["az"] = serialized(String(az, 3));
  doc["ta"] = serialized(String(totalAccel, 2));
  doc["ad"] = accidentDetected ? 1 : 0;
  doc["tmp"] = 0;  // Replace with actual temp sensor if available

  serializeJson(doc, Serial);
  Serial.println();  // Newline delimiter — bridge reads line-by-line
}
