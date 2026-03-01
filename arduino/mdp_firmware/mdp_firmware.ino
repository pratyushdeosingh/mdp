/*
 * MDP IoT Firmware — GPS & Motion Tracking System
 * Review III — Hardware Integration
 *
 * Reads NEO-6M GPS, ADXL345 Accelerometer, SIM800L GSM
 * Outputs one JSON line per second to Serial (USB) at 9600 baud
 *
 * Libraries required (install via Arduino IDE Library Manager):
 *   - TinyGPS++        (by Mikal Hart)
 *   - Adafruit ADXL345 (by Adafruit)
 *   - Adafruit Unified Sensor (by Adafruit)
 *   - ArduinoJson      (by Benoit Blanchon)
 *
 * Wiring:
 *   NEO-6M GPS   — TX → pin 4, RX → pin 3  (SoftwareSerial)
 *   SIM800L GSM  — TX → pin 7, RX → pin 8  (SoftwareSerial)
 *   ADXL345      — SDA → A4, SCL → A5       (I2C)
 *   Battery      — Voltage divider → A0
 *   SIM800L VCC  — External 3.7–4.2V (NOT from Arduino 5V)
 */

#include <SoftwareSerial.h>
#include <TinyGPS++.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_ADXL345_U.h>
#include <ArduinoJson.h>

// ── Pin Configuration ──────────────────────────────────────
#define GPS_RX_PIN   4
#define GPS_TX_PIN   3
#define GSM_RX_PIN   7
#define GSM_TX_PIN   8
#define BATTERY_PIN  A0

// ── Objects ────────────────────────────────────────────────
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);
SoftwareSerial gsmSerial(GSM_RX_PIN, GSM_TX_PIN);
TinyGPSPlus gps;
Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);

// ── State ──────────────────────────────────────────────────
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 1000;  // 1 second
bool accelAvailable = false;
int lastSignalStrength = 0;

// ── Setup ──────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);           // USB serial to laptop
  gpsSerial.begin(9600);        // NEO-6M default baud
  gsmSerial.begin(9600);        // SIM800L default baud

  Wire.begin();

  // Initialize accelerometer
  if (accel.begin()) {
    accelAvailable = true;
    accel.setRange(ADXL345_RANGE_4_G);
  }

  // Initialize GSM module
  gsmSerial.listen();
  gsmSerial.println("AT");
  delay(1000);

  // Startup message
  Serial.println("{\"status\":\"boot\",\"msg\":\"MDP firmware ready\"}");
}

// ── Query GSM Signal Strength ──────────────────────────────
// Returns 0–31 (raw CSQ value), or 0 on failure
int querySignalStrength() {
  gsmSerial.listen();
  delay(50);

  // Flush any old data
  while (gsmSerial.available()) gsmSerial.read();

  gsmSerial.println("AT+CSQ");
  delay(500);

  String response = "";
  unsigned long timeout = millis() + 1000;
  while (millis() < timeout) {
    while (gsmSerial.available()) {
      char c = (char)gsmSerial.read();
      response += c;
    }
    if (response.indexOf("OK") >= 0) break;
  }

  // Parse "+CSQ: XX,Y"
  int idx = response.indexOf("+CSQ:");
  if (idx >= 0) {
    int commaIdx = response.indexOf(",", idx);
    if (commaIdx > idx) {
      int val = response.substring(idx + 5, commaIdx).toInt();
      if (val == 99) return 0;  // 99 means not detectable
      return val;
    }
  }
  return 0;
}

// ── Read Battery Voltage ───────────────────────────────────
// Assumes a voltage divider (10K/10K) from Vin to A0
// Adjust the map() values based on your actual divider and battery
int readBatteryPercent() {
  int raw = analogRead(BATTERY_PIN);
  // 10-bit ADC: 0–1023
  // With 10K/10K divider: 3.5V battery → ~1.75V → ~358
  //                        4.2V battery → ~2.1V  → ~430
  int percent = map(raw, 358, 430, 0, 100);
  return constrain(percent, 0, 100);
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

  // ── 2. Check if it's time to send ──
  if (millis() - lastSend < SEND_INTERVAL) return;
  lastSend = millis();

  // ── 3. Read accelerometer ──
  float ax = 0, ay = 0, az = 0;
  if (accelAvailable) {
    sensors_event_t event;
    accel.getEvent(&event);
    ax = event.acceleration.x;
    ay = event.acceleration.y;
    az = event.acceleration.z;
  }

  // ── 4. Query GSM signal (every 5 seconds to avoid overhead) ──
  static unsigned long lastGsmQuery = 0;
  if (millis() - lastGsmQuery >= 5000) {
    lastSignalStrength = querySignalStrength();
    lastGsmQuery = millis();
  }
  // Map 0-31 CSQ range to 0-100 percent
  int signalPercent = map(lastSignalStrength, 0, 31, 0, 100);
  signalPercent = constrain(signalPercent, 0, 100);

  // ── 5. Read battery ──
  int batteryPercent = readBatteryPercent();

  // ── 6. Build and send JSON ──
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
  doc["sig"] = signalPercent;
  doc["bat"] = batteryPercent;
  doc["tmp"] = 0;  // Replace with actual temp sensor if available

  serializeJson(doc, Serial);
  Serial.println();  // Newline delimiter — bridge reads line-by-line
}
