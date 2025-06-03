#include <WiFi.h>

void wifiConnectionInit()
{
    // Connect to WiFi
    Serial.print("wifi ssid: ");
    Serial.println(WIFI_SSID);
    Serial.print("wifi password: ");
    Serial.println(WIFI_PASSWORD);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println("\nWiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
}