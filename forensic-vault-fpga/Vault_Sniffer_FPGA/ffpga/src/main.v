module main (
    input pin_sda,      // Data Line
    input pin_scl,      // Clock Line
    output trigger_out, // Signal to RP2040
    output trigger_oe  // Output Enable (The Fix)
);

    // Keep the output 'gate' open so the signal can actually leave the chip
    assign trigger_oe = 1'b1; 

    // I2C Start Condition Logic:
    // If SCL is HIGH and SDA drops from HIGH to LOW, it's a 'Start'
    assign trigger_out = (pin_scl == 1'b1 && pin_sda == 1'b0) ? 1'b1 : 1'b0;

endmodule