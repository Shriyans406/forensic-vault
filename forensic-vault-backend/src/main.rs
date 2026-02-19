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
    let serial_col = collection.clone();
    tokio::spawn(async move {
        println!("Serial Bridge: Monitoring ports...");
        loop {
            // Get all available ports (Port-Agnostic)
            let ports = serialport::available_ports().unwrap_or_default();
            
            for p in ports {
                // Attempt to open the port at 115200 baud (MCU speed)
                if let Ok(port) = serialport::new(&p.port_name, 115_200)
                    .timeout(Duration::from_millis(500))
                    .open() 
                {
                    let mut reader = BufReader::new(port);
                    let mut line = String::new();

                    println!("Serial Bridge: Linked to {}. Watching for I2C events...", p.port_name);

                    loop {
                        line.clear();
                        if reader.read_line(&mut line).is_ok() {
                            let msg = line.trim();

                            // Detect the specific alert from your RP2040
                            if msg == "ALERT:I2C_START_DETECTED" {
                                println!("[!] HARDWARE ALERT: I2C Start Detected by FPGA!");
                                
                                let new_log = ForensicLog {
                                    timestamp: Utc::now().to_rfc3339(),
                                    protocol: "I2C".to_string(),
                                    payload: "Start Condition Detected (Sniffer Phase 1)".to_string(),
                                };
                                
                                let _ = serial_col.insert_one(new_log, None).await;
                                println!("[+] Forensic Log pushed to MongoDB Atlas.");
                            }
                        } else {
                            break; // Connection lost, re-scan ports
                        }
                    }
                }
            }
            tokio::time::sleep(Duration::from_secs(2)).await; // Save CPU while scanning
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

async fn get_logs(col: Collection<ForensicLog>) -> Json<Vec<ForensicLog>> {
    let mut cursor = col.find(None, None).await.expect("Failed to fetch logs");
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