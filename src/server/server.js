const express = require('express');
const compression = require('compression');
const app = express();
const PORT = 3000;
const admin = require('./firebase');
const msgpack = require('msgpack5')();
const db = admin.database();
const ref = db.ref('sensor_info');
const WebSocket = require('ws'); // Import WebSocket
app.use(express.json());
app.use(compression());

const wss = new WebSocket.Server({port: 3003});

let pumpEnabled = false;
// Shared data that updates every second
let sharedSensorData = null;
const clients = new Set();
let espClient = null;
let sensorDataHistory = [];
function safeFloor(value) {
  return typeof value === 'number' ? Math.floor(value) : null;
}
wss.on('connection', ws => {
  console.log('Client connected to WebSocket');

  // Add the new client to the clients set
  clients.add(ws);

  // Send pumpEnabled state once on connection
  ws.send(JSON.stringify({type: 'PUMP_STATUS', value: pumpEnabled}));
  if (sharedSensorData) {
    ws.send(
      JSON.stringify({
        ...sharedSensorData,
        timestamp: Date.now(),
      }),
    );
  }
  // Handle client messages
  ws.on('message', message => {
    try {
      const parsed = JSON.parse(message);

      if (parsed.type === 'TOGGLE_PUMP') {
        pumpEnabled = parsed.value;
        console.log(`Pump turned ${pumpEnabled ? 'ON' : 'OFF'}`);
        // Send pump status to the ESP when it changes
        if (espClient && espClient.readyState === WebSocket.OPEN) {
          espClient.send(
            JSON.stringify({type: 'PUMP_STATUS', value: pumpEnabled}),
          );
        }
      }
      // Handle Motion Detector toggle
      if (parsed.type === 'TOGGLE_MOTION_DETECTOR') {
        const motionDetectorEnabled = parsed.value;
        console.log(
          `Motion Detector turned ${motionDetectorEnabled ? 'ON' : 'OFF'}`,
        );

        // Send motion detector status to the ESP when it changes
        if (espClient && espClient.readyState === WebSocket.OPEN) {
          espClient.send(
            JSON.stringify({
              type: 'MOTION_DETECTOR_STATUS',
              value: motionDetectorEnabled,
            }),
          );
        }
      }
      // Handle SENSOR_INFO updates from ESP
      if (parsed.type === 'SENSOR_INFO') {
        // If this is the ESP, save the WebSocket
        if (!espClient) {
          espClient = ws;
          console.log('ESP client connected');
        }

        const flooredSensorData = {
          ...parsed.value,
          temperature: safeFloor(parsed.value?.temperature),
          humidity: safeFloor(parsed.value?.humidity),
          soil_moisture: parsed.value?.soil_moisture === true ? 50 : 0,
          gas_value: safeFloor(parsed.value?.gas_value),
        };

        sharedSensorData = flooredSensorData; // Save the floored data
        // Add to the history array
        sensorDataHistory.push({
          ...parsed.value,
          timestamp: Date.now(),
        });

        console.log(`Current array size: ${sensorDataHistory.length}`);

        // If the array reaches one month's worth of data (30 days worth of data in seconds), trim the history
        const oneMonthInSeconds = 2592000; // 30 days * 24 hours * 3600 seconds
        const latestWeekInSeconds = 604800; // 1 week * 24 hours * 3600 seconds

        // If the history array exceeds the one month (30 days) of data
        if (sensorDataHistory.length >= oneMonthInSeconds) {
          // Remove the first 3 weeks of data and keep only the latest week's worth
          sensorDataHistory = sensorDataHistory.slice(
            sensorDataHistory.length - latestWeekInSeconds,
          );
          console.log(
            'Trimmed the history. Keeping only the latest week of data.',
          );
        }
        // If the array reaches 3600 entries, log it
        if (sensorDataHistory.length === 3600) {
          console.log('Graph is ready with 3600 entries');
        }

        // Now, send the new sensor data to all connected clients
        const dataToSend = {
          ...flooredSensorData,
          timestamp: Date.now(),
        };

        // Prepare and send the data to all connected clients
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(dataToSend));
          }
        });
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws); // Remove client from set
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});
app.post('/signup', async (req, res) => {
  const {username, email, password} = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required.',
    });
  }

  try {
    console.log('Received signup request:', {username, email});

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    console.log('Firebase user created:', userRecord.uid);

    // Add user info to Firebase Realtime Database
    const userRef = db.ref(`users/${userRecord.uid}`);
    await userRef.set({
      username,
      email,
    });

    // Create a custom token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    return res.status(200).json({
      success: true,
      message: 'Signup successful!',
      token: customToken, // <-- send this to app
      uid: userRecord.uid,
    });
  } catch (error) {
    console.error('Firebase signup error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Signup failed.',
    });
  }
});
app.post('/verify-token', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid or missing token');
    return res
      .status(401)
      .json({valid: false, message: 'Missing or invalid token'});
  }

  const idToken = authHeader.split('Bearer ')[1];
  const {uid} = req.body;

  if (!uid) {
    return res.status(400).json({valid: false, message: 'UID is required'});
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (decodedToken.uid === uid) {
      // Fetch all user data from Firebase Realtime Database
      const userRef = admin.database().ref(`users/${uid}`);
      const snapshot = await userRef.once('value');

      if (!snapshot.exists()) {
        return res.status(404).json({valid: false, message: 'User not found'});
      }

      const userData = snapshot.val(); // Get all user data from Realtime Database

      const response = {
        valid: true,
        user: userData, // Send all user data back
      };

      console.log('Sending response:', response); // <-- log the response
      return res.status(200).json(response);
    } else {
      return res.status(403).json({valid: false, message: 'UID mismatch'});
    }
  } catch (err) {
    console.error('Error verifying token:', err);
    return res.status(401).json({valid: false, message: 'Invalid token'});
  }
});

app.get('/simulate-data', (req, res) => {
  const {sensor} = req.query;
  console.log('Received request for sensor:', sensor);

  const validTypes = ['temperature', 'humidity', 'gas_value', 'soil_moisture'];
  if (!validTypes.includes(sensor)) {
    return res.send({error: 'Invalid sensor type requested'});
  }

  // Filter only the selected sensor's data
  const filteredData = Array.from(sensorDataHistory.values()).map(entry => ({
    timestamp: entry.timestamp,
    value: entry[sensor],
  }));

  const response = {values: filteredData};
  const binaryData = msgpack.encode(response);
  res.send(binaryData);
});

// Downsampling function to reduce data from 3600 to around 200 data points

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
