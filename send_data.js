// File: send_data.js

// Your Firebase Realtime Database URL
const FIREBASE_URL = 'https://dashboard-s37f-default-rtdb.firebaseio.com/.json';

// Initial GPS coordinates (London)
let lat = 51.5074;
let lng = -0.1278;

console.log("Starting to send random data to Firebase every 2 seconds...");
console.log("Press [CTRL+C] to stop the script.");

// This function runs every 2 seconds
setInterval(async () => {
  // Generate random data within a realistic range
  const energy = (Math.random() * 15 + 12).toFixed(1);
  const efficiency = Math.floor(Math.random() * 16) + 80; // Range: 80-95
  const battery = Math.floor(Math.random() * 101);      // Range: 0-100
  const intensity = Math.floor(Math.random() * 901) + 100; // Range: 100-1000
  const temperature = Math.floor(Math.random() * 26) + 10; // Range: 10-35

  // Slightly randomize GPS coordinates to simulate movement
  lat += (Math.random() - 0.5) / 2500;
  lng += (Math.random() - 0.5) / 2500;

  // Construct the JSON data payload
  const jsonData = {
    energy: parseFloat(energy),
    efficiency,
    battery,
    intensity,
    temperature,
    gps: { 
      lat: parseFloat(lat.toFixed(4)), 
      lng: parseFloat(lng.toFixed(4)) 
    }
  };

  try {
    // Use fetch to send a PUT request to Firebase, replacing the data
    const response = await fetch(FIREBASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("------------------------------------");
    console.log("Data sent successfully:");
    console.log(JSON.stringify(jsonData, null, 2));

  } catch (error) {
    console.error("Failed to send data:", error);
  }

}, 2000); // The interval is 2000 milliseconds (2 seconds)
