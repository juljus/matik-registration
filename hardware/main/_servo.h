#include <ESP32Servo.h>

int servo_pin = 19;
Servo myservo;

unsigned long lastTime;
bool servoState = 0;
// bool firstBoot = 1;

void servoInit()
{
    myservo.attach(servo_pin); // Attach the servo to the pin
    myservo.write(90); // Set initial position to neutral for continuous servo
    Serial.println("Servo initialized");
}

void spinServo()
{
    // if (firstBoot) {
    //     firstBoot = 0;
        // myservo.attach(servo_pin); // Attach the servo to the pin
        // myservo.write(90); // Set initial position to neutral for continuous servo
        // Serial.println("Servo initialized");
    // }

    if (millis() - lastTime > 1000) {
        lastTime = millis();
        Serial.print("dir change: ");

        servoState = !servoState; // Toggle servo state
        if (servoState) {
            myservo.write(180); // Full speed forward for continuous servo
            Serial.println("forward");
        } else {
            myservo.write(0); // Full speed backward for continuous servo
            Serial.println("backward");
        }
    }
}
