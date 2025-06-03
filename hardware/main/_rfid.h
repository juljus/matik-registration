#include <SPI.h>
#include <MFRC522.h>

#define MOSI_PIN 23
#define MISO_PIN 21
#define SS_PIN 5
#define SCK_PIN 18
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);
bool rfidInitialized = false;

void checkRFID() {
    if (!rfidInitialized) {
        SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
        rfid.PCD_Init();
        rfidInitialized = true;
        Serial.println("RFID initialized");
    }

    if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
        Serial.println("No new card present or read error");
    }
    else {
        Serial.print("Card UID: ");
        for (byte i = 0; i < rfid.uid.size; i++) {
            Serial.print(rfid.uid.uidByte[i], HEX);
            Serial.print(" ");
        }
        Serial.println();
        rfid.PICC_HaltA();
        rfid.PCD_StopCrypto1();
        Serial.println("Card read successfully");
    }
}
