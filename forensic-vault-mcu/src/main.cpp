#include <Arduino.h>
#include <LittleFS.h>
#include <ShrikeFlash.h> 

// Create the FPGA controller object
ShrikeFlash fpga; 

const int TRIGGER_PIN = 2; 
bool alertSent = false;

void setup() {
  // Start Serial at the standard baud rate
  Serial.begin(115200);
  
  // CRITICAL: This waits up to 5 seconds for you to open the Serial Monitor.
  // If you don't open the monitor, it will proceed anyway to try and flash.
  while (!Serial && millis() < 5000); 
  
  Serial.println("\n--- FORENSIC VAULT STARTUP ---");

  // 1. Initialize Vault Storage (LittleFS)
  // If this fails, Job 1 (Filesystem Upload) was likely skipped.
  if (!LittleFS.begin()) {
    Serial.println("[-] ERROR: Storage mount failed!");
    Serial.println("[-] ACTION: Click 'Upload Filesystem Image' in PlatformIO.");
    return;
  }
  Serial.println("[+] Storage mounted successfully.");

  // 2. Initialize and Push .bin to FPGA
  fpga.begin();
  Serial.print("[*] VAULT_STATUS: Flashing Forensic Logic...");
  
  // This looks for the specific file you uploaded in the 'data' folder
  if (fpga.flash("/FPGA_bitstream_MCU.bin")) {
    Serial.println(" SUCCESS!");
    Serial.println("[+] LED should stop its old blinking pattern now.");
  } else {
    Serial.println(" FAILED!");
    Serial.println("[-] REASON: Could not find '/FPGA_bitstream_MCU.bin'");
    Serial.println("[-] ACTION: Check filename in your 'data' folder and re-upload.");
  }

  // 3. Reporter Logic setup
  pinMode(TRIGGER_PIN, INPUT_PULLDOWN); 
  Serial.println("[+] MCU_READY: Listening for I2C Events on GPIO 2.");
}

void loop() {
  // Listen for the signal from the FPGA
  int triggerSignal = digitalRead(TRIGGER_PIN);

  if (triggerSignal == HIGH && !alertSent) {
    Serial.println("ALERT: I2C_START_DETECTED - LOGGING TO VAULT");
    alertSent = true; 
  } 
  
  if (triggerSignal == LOW) {
    alertSent = false;
  }

  delay(1); 
}