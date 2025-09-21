#include <SPI.h>
#include <MFRC522.h>

#define MOSI_PIN 21
#define MISO_PIN 20
#define SS_PIN 23
#define SCK_PIN 22
#define RST_PIN 18

MFRC522 rfid(SS_PIN, RST_PIN);

void rfidReaderInit()
{
    SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
    rfid.PCD_Init();
    Serial.println("RFID initialized");
}

bool checkRFID(char* uidBuffer, size_t bufferSize)
{
    if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial())
    {
        return false; // No new card or read error
    }

    memset(uidBuffer, 0, bufferSize); // Clear the buffer

    for (byte i = 0; i < rfid.uid.size && (i * 2) < (bufferSize - 1); i++)
    {
        sprintf(uidBuffer + (i * 2), "%02X", rfid.uid.uidByte[i]);
    }

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    return true; // Card read successfully
}
