int led_pin = 20;

void setup() {
  // Initialize the LED pin as an output
  pinMode(led_pin, OUTPUT);
}
void loop() {
  // Turn the LED on
  digitalWrite(led_pin, HIGH);
  delay(1000); // Wait for a second

  // Turn the LED off
  digitalWrite(led_pin, LOW);
  delay(1000); // Wait for a second
}
