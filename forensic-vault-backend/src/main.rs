use axum::{
    routing::{get, post},
    Json, Router,
};
use mongodb::{Client, Collection, bson::doc};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use std::time::Duration;
use std::io::{BufRead, BufReader};
use chrono::Utc;
use serialport;

// This is the "Shape" of our data
#[derive(Serialize, Deserialize, Debug, Clone)]
struct ForensicLog {
    timestamp: String,
    protocol: String, 
    payload: String,  
}

#[tokio::main]
async fn main() {
    // --- MONGODB ATLAS SETUP ---
    let atlas_uri = "mongodb+srv://shriyansssahoo_db_user:Shri-1234@cluster0.x2y1vsc.mongodb.net/?appName=Cluster0";

    let client = Client::with_uri_str(atlas_uri)
        .await
        .expect("Failed to connect to MongoDB Atlas!");
    
    let db = client.database("forensic_vault");
    let collection = db.collection::<ForensicLog>("logs");

    println!("Connected to MongoDB Atlas: 'forensic_vault'");

    // --- PHASE 3: SPAWN SERIAL BRIDGE WORKER ---
    // This runs in the background so the web server stays active
    // --- PHASE 3: THE BACKGROUND SERIAL BRIDGE ---
    let serial_col = collection.clone();
    tokio::spawn(async move {
        println!("Serial Bridge: Initializing Port-Agnostic Watcher...");
        
        loop {
            // 1. Scan for all available COM ports automatically
            let ports = serialport::available_ports().unwrap_or_default();
            
            for p in ports {
                // 2. Attempt to open the port at 115200 baud (matching your MCU code)
                if let Ok(port) = serialport::new(&p.port_name, 115_200)
                    .timeout(Duration::from_millis(500))
                    .open() 
                {
                    let mut reader = BufReader::new(port);
                    let mut line = String::new();

                    println!("Bridge Linked: {} [Watching for I2C Events]", p.port_name);

                    loop {
                        line.clear();
                        // 3. Read data from the RP2040
                        if reader.read_line(&mut line).is_ok() {
                            let msg = line.trim();

                            // 4. Trigger logic when the FPGA sends a signal to the MCU
                            if msg == "ALERT:I2C_START_DETECTED" {
                                println!("[!] CRITICAL: I2C Start Detected by FPGA Sniffer!");
                                
                                let forensic_entry = ForensicLog {
                                    timestamp: Utc::now().to_rfc3339(),
                                    protocol: "I2C".to_string(),
                                    payload: "Unauthorized I2C Start Condition Detected".to_string(),
                                };
                                
                                // 5. Push directly to MongoDB Atlas
                                if let Err(e) = serial_col.insert_one(forensic_entry, None).await {
                                    eprintln!("Database Error: {:?}", e);
                                } else {
                                    println!("[+] Logged to Cloud: Forensic entry created.");
                                }

                                // 6. Debounce: Wait 200ms to prevent duplicate logs from one event
                                tokio::time::sleep(Duration::from_millis(200)).await;
                            }
                        } else {
                            // Break inner loop if hardware is disconnected
                            println!("Connection lost on {}. Re-scanning...", p.port_name);
                            break; 
                        }
                    }
                }
            }
            // Wait 2 seconds before re-scanning to save CPU
            tokio::time::sleep(Duration::from_secs(2)).await; 
        }
    });

    // --- WEB SERVER SETUP ---
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/logs", get({
            let col = collection.clone();
            move || get_logs(col)
        }))
        .route("/simulate", post({
            let col = collection.clone();
            move |body| add_mock_log(col, body)
        }))
        .layer(
            CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods(tower_http::cors::Any)
                .allow_headers(tower_http::cors::Any),
        );

    let addr = SocketAddr::from(([127, 0, 0, 1], 4000));
    let listener = TcpListener::bind(&addr).await.unwrap();
    
    println!("Vault Backend & Bridge running at http://{}", addr);
    
    axum::serve(listener, app)
        .await
        .unwrap();
}

// --- HANDLER FUNCTIONS ---

async fn health_check() -> &'static str {
    "Vault Backend is ONLINE"
}

// Update this handler to sort by timestamp descending
async fn get_logs(col: Collection<ForensicLog>) -> Json<Vec<ForensicLog>> {
    use mongodb::options::FindOptions;
    
    // Sort by timestamp descending so newest is always first
    let filter = doc! {};
    let find_options = FindOptions::builder().sort(doc! { "timestamp": -1 }).build();
    
    let mut cursor = col.find(filter, find_options).await.expect("Failed to fetch logs");
    let mut results = Vec::new();
    
    while cursor.advance().await.expect("Error advancing cursor") {
        results.push(cursor.deserialize_current().expect("Error deserializing log"));
    }
    Json(results)
}

async fn add_mock_log(col: Collection<ForensicLog>, Json(payload): Json<ForensicLog>) -> &'static str {
    col.insert_one(payload, None).await.expect("Failed to insert log");
    "Log Saved to Vault!"
}