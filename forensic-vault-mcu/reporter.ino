/* * Forensic Vault - Phase 2: MCU Reporter
 * Board: Vicharak Shrike-Lite (RP2040)
 */

// We use Pin 2 because we mapped the FPGA output to GPIO2
const int TRIGGER_PIN = 2; 
bool alertSent = false;

void setup() {
  // Start USB Serial communication at 115200 baud
  Serial.begin(115200);
  
  // Set the pin to listen for the FPGA's HIGH signal
  // INPUT_PULLDOWN keeps the signal at 0 until the FPGA pushes it up
  pinMode(TRIGGER_PIN, INPUT_PULLDOWN); 
  
  // Wait for Serial to initialize
  while (!Serial); 
  Serial.println("MCU_READY:LISTENING_FOR_I2C_EVENTS");
}

void loop() {
  // Check the status of the 'Bridge' wire
  int triggerSignal = digitalRead(TRIGGER_PIN);

  // If a High signal is detected (The FPGA found an I2C Start condition)
  if (triggerSignal == HIGH && !alertSent) {
    Serial.println("ALERT:I2C_START_DETECTED");
    alertSent = true; // Prevents the system from logging the same event twice
  } 
  
  // Reset the alert state when the signal clears
  if (triggerSignal == LOW) {
    alertSent = false;
  }

  // Small delay for stability
  delay(1); 
}