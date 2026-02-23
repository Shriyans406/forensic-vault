#include <Arduino.h>
#include <LittleFS.h>
#include <Shrike.h>

// Create objects for the Vault
Shrike fpga;
const int TRIGGER_PIN = 2; 
bool alertSent = false;

void setup() {
  Serial.begin(115200);
  
  // 1. Initialize Vault Storage (LittleFS)
  if (!LittleFS.begin()) {
    Serial.println("VAULT_ERROR:STORAGE_MOUNT_FAILED");
    return;
  }

  // 2. Initialize and Push .bin to FPGA
  fpga.begin();
  Serial.print("VAULT_STATUS:FLASHING_FPGA...");
  if (fpga.flash("/FPGA_bitstream_MCU.bin")) {
    Serial.println("SUCCESS");
  } else {
    Serial.println("FAILED");
  }

  // 3. Your Original Reporter Logic
  pinMode(TRIGGER_PIN, INPUT_PULLDOWN); 
  Serial.println("MCU_READY:LISTENING_FOR_I2C_EVENTS");
}

void loop() {
  int triggerSignal = digitalRead(TRIGGER_PIN);

  if (triggerSignal == HIGH && !alertSent) {
    Serial.println("ALERT:I2C_START_DETECTED");
    alertSent = true; 
  } 
  
  if (triggerSignal == LOW) {
    alertSent = false;
  }

  delay(1); 
}