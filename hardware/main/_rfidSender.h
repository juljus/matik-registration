#include <HTTPClient.h>
#include <ArduinoJson.h>

unsigned long lastRFIDTime = 0;
const unsigned long RFID_COOLDOWN = 1000; // 1 seconds between reads

// Key state tracking
bool keyIsTaken = false;
bool keyStateInitialized = false;

// Function declarations
bool checkKeyStatus();
bool sendRFIDEvent(const char* rfidUID, const char* eventType);
void processRFIDCard(const char* rfidUID);

void rfidSenderInit()
{
    if (!checkKeyStatus())
    {
        Serial.println("Failed to initialize key status. Exiting...");
        return;
    }
    keyStateInitialized = true;
    
    Serial.println("RFID Sender initialized");
}

bool checkKeyStatus() 
{
    HTTPClient http;
    char url[150];
    snprintf(url, sizeof(url), "http://%s:%s%s", SERVER_ADRESS, SERVER_PORT, API_STATUS_ENDPOINT);
    
    Serial.print("Checking key status at: ");
    Serial.println(url);
    
    http.begin(url);
    // DEBUG: log the device headers we will send
    Serial.print("DEBUG header X-Device-ID: ");
    Serial.println(DEVICE_ID);
    Serial.print("DEBUG header X-API-Key: ");
    Serial.println(DEVICE_API_KEY);
    http.addHeader("X-Device-ID", DEVICE_ID);
    http.addHeader("X-API-Key", DEVICE_API_KEY);
    
    int httpResponseCode = http.GET();
    
    if (httpResponseCode == 200) {
        String response = http.getString();
        Serial.print("Key status response: ");
        Serial.println(response);
        
        // Parse JSON response
        DynamicJsonDocument doc(1024);
        deserializeJson(doc, response);
        
        keyIsTaken = doc["keyTaken"].as<bool>();
        
        Serial.print("Key is currently: ");
        Serial.println(keyIsTaken ? "TAKEN" : "AVAILABLE");
        
        http.end();
        return true;
    } else {
        Serial.print("Failed to check key status. HTTP code: ");
        Serial.println(httpResponseCode);
        http.end();
        return false;
    }
}

bool sendRFIDEvent(const char* rfidUID, const char* eventType) 
{
    HTTPClient http;
    char url[150];
    snprintf(url, sizeof(url), "http://%s:%s%s", SERVER_ADRESS, SERVER_PORT, API_SUBMIT_ENDPOINT);
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-ID", DEVICE_ID);
    http.addHeader("X-API-Key", DEVICE_API_KEY);
    
    // Create JSON payload
    char payload[200];
    snprintf(payload, sizeof(payload), 
        "{\"rfid\":\"%s\",\"eventType\":\"%s\"}", 
        rfidUID, eventType);

    Serial.print("Sending to: ");
    Serial.println(url);
    Serial.print("Payload: ");
    Serial.println(payload);

    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print("HTTP Response Code: ");
        Serial.println(httpResponseCode);
        Serial.print("Response: ");
        Serial.println(response);
        
        http.end();
        return (httpResponseCode == 200);
    } else {
        Serial.print("HTTP Request failed: ");
        Serial.println(httpResponseCode);
        http.end();
        return false;
    }
}

void processRFIDCard(const char* rfidUID) 
{
    // Prevent rapid repeated reads of the same card
    if (millis() - lastRFIDTime < RFID_COOLDOWN) {
        return;
    }
    lastRFIDTime = millis();

    Serial.print("Processing RFID: ");
    Serial.println(rfidUID);
    
    // If we haven't initialized the key state yet, check it first
    if (!keyStateInitialized) {
        Serial.println("Key state not initialized, checking status...");
        if (!checkKeyStatus()) {
            Serial.println("Failed to initialize key state");
            return;
        }
    }
    
    // Determine event type based on current key state
    const char* eventType;
    if (keyIsTaken) {
        eventType = "return";
        Serial.println("Key is taken, this will be a RETURN event");
    } else {
        eventType = "take";
        Serial.println("Key is available, this will be a TAKE event");
    }
    
    bool success = sendRFIDEvent(rfidUID, eventType);
    
    if (success) {
        // Update local state after successful API call
        keyIsTaken = !keyIsTaken;
        Serial.println("RFID event sent successfully!");
        Serial.print("Key is now: ");
        Serial.println(keyIsTaken ? "TAKEN" : "AVAILABLE");
    } else {
        Serial.println("Failed to send RFID event");
        // Refresh key state on failure to stay in sync
        checkKeyStatus();
    }
}
