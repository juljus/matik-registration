#include <_servo.h>
#include <_rfid.h>

int led_pin = 20;

void setup() {
    // init the serial communication
    Serial.begin(115200);
    Serial.println("Setup started");

    // Initialize the LED pin as an output
    pinMode(led_pin, OUTPUT);

    Serial.println("Setup completed");
}

void loop() {
    Serial.println("Loop started");

    // RFID
    checkRFID();

    // SERVO
    spinServo();
}
