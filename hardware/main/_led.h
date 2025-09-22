// LED helper for Matik registration hardware
// Controls a single LED on GPIO 5 to indicate whether the key is present (ON when key is taken).

#ifndef _LED_H
#define _LED_H

const int LED_PIN = 5;

inline void initLed() {
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW); // default off
}

inline void setLed(bool on) {
    digitalWrite(LED_PIN, on ? HIGH : LOW);
}

#endif // _LED_H
