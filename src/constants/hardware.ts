import type { HardwareModule } from '../types';

export const hardwareModules: HardwareModule[] = [
    {
        name: 'Arduino Uno R3',
        id: 'mcu',
        status: 'working',
        description: 'Main microcontroller unit. Firmware uploaded via Arduino IDE. Serial communication established at 9600 baud. Handles sensor polling, accident detection logic, and JSON data output.',
        nextAction: 'All modules integrated — system fully operational.',
        icon: 'cpu',
    },
    {
        name: 'MPU6050 Accelerometer/Gyroscope',
        id: 'mpu',
        status: 'working',
        description: '6-axis inertial measurement unit (IMU) with I2C interface. Provides 3-axis acceleration and gyroscope data. Used for motion detection and accident event triggering when total acceleration exceeds 25 m/s².',
        nextAction: 'Sensor calibrated and running — accident detection active.',
        icon: 'activity',
    },
    {
        name: 'NEO-6M GPS Module',
        id: 'gps',
        status: 'working',
        description: 'u-blox NEO-6M GPS receiver with ceramic antenna. Connected via SoftwareSerial on pins 4 (RX) and 3 (TX). Outputs NMEA sentences parsed by TinyGPS++ library for real-time latitude, longitude, speed, and altitude.',
        nextAction: 'GPS fix acquired — tracking operational.',
        icon: 'map-pin',
    },
    {
        name: 'Buzzer Alert System',
        id: 'buzzer',
        status: 'working',
        description: 'Piezo buzzer connected to pin 8. Activates with a 500ms on/off beeping pattern when an accident is detected. Auto-clears after 10 seconds or can be manually cancelled.',
        nextAction: 'Alert system tested — buzzer functional.',
        icon: 'buzzer',
    },
    {
        name: 'Cancel Button',
        id: 'button',
        status: 'working',
        description: 'Push button connected to pin 7 with INPUT_PULLUP. Active LOW — pressing the button cancels an active accident alert and silences the buzzer immediately.',
        nextAction: 'Button tested — cancel mechanism operational.',
        icon: 'button',
    },
];
