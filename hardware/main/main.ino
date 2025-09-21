#include <_secrets.h>
#include <_servo.h>
#include <_rfidReader.h>
#include <_rfidSender.h>
#include <_wifiConnection.h>

void setup() {
    // init the serial communication
    Serial.begin(115200);
    Serial.println("Setup started");

    // header init
    wifiConnectionInit();
    // servoInit(); // Disabled for now... when we make a cooler box we can uncomment
    rfidReaderInit();
    rfidSenderInit();

    Serial.println("Setup completed");
}

void loop() {

    // RFID
    char rfidUID[17];
    if (checkRFID(rfidUID, sizeof(rfidUID))) {
        Serial.print("RFID UID: ");
        Serial.println(rfidUID);

        Serial.println("Processing RFID card...");
        processRFIDCard(rfidUID);
    }
}
