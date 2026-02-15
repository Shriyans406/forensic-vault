use axum::{
    routing::{get, post},
    Json, Router,
};
use mongodb::{Client, Collection};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tokio::net::TcpListener; // New for Axum 0.7
use tower_http::cors::CorsLayer;

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
    // 1. Replace the text below with your actual Atlas Connection String!
    // It usually looks like: mongodb+srv://username:password@cluster0.abcde.mongodb.net/...
    let atlas_uri = "mongodb+srv://shriyansssahoo_db_user:Shri-1234@cluster0.x2y1vsc.mongodb.net/?appName=Cluster0";

    let client = Client::with_uri_str(atlas_uri)
        .await
        .expect("Failed to connect to MongoDB Atlas. Check your connection string and IP Whitelist!");
    
    let db = client.database("forensic_vault");
    let collection = db.collection::<ForensicLog>("logs");

    println!("Connected to MongoDB Atlas: 'forensic_vault'");

   // 2. Build our Web Routes
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
        // THIS IS THE FIX: We are telling Rust to allow ALL requests from your Frontend
        .layer(
            CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods(tower_http::cors::Any)
                .allow_headers(tower_http::cors::Any),
        );

    // 3. Start the Server (The Axum 0.7 way)
    let addr = SocketAddr::from(([127, 0, 0, 1], 4000));
    let listener = TcpListener::bind(&addr).await.unwrap();
    
    println!("Vault Backend running at http://{}", addr);
    
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