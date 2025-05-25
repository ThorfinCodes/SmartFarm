const express = require('express');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 3000;

const admin = require('./firebase');
const msgpack = require('msgpack5')();
const db = admin.database();
/* if (sensorData.pir_status) {
    console.log('movement detected');
    alertsToSend.push('Motion detected (PIR active)');
  }

  if (sensorData.temperature < 10) {
    alertsToSend.push('Temperature too low (< 10°C)');
  } else if (sensorData.temperature > 35) {
    alertsToSend.push('Temperature too high (> 35°C)');
  }

  if (sensorData.humidity < 40) {
    alertsToSend.push('Humidity too low (< 40%)');
  } else if (sensorData.humidity > 85) {
    alertsToSend.push('Humidity too high (> 85%)');
  }

  if (sensorData.soil_moisture === 0) {
    alertsToSend.push('Soil is dry! Please water the plant.');
  }

  if (sensorData.gas_value > GAS_THRESHOLD) {
    alertsToSend.push('Gas level too high (> 300)');
  }*/

const WebSocket = require('ws'); // Import WebSocket
app.use(express.json());
app.use(compression());

const clientRegistry = {};
let pumpEnabled = false;
// Shared data that updates every second
const TEMPERATURE_THRESHOLD = 15;
const DRY_THRESHOLD = 500;
const WATER_THRESHOLD = 500;
const GAS_THRESHOLD = 400;
const sensorDataHistory = {};

async function initializeClientRegistry() {
  const usersRef = admin.database().ref('users');
  const usersSnap = await usersRef.once('value');
  const users = usersSnap.val();

  if (!users) return;

  for (const uid in users) {
    const user = users[uid];
    const esps = [];

    if (user.zones) {
      for (const zoneId in user.zones) {
        const zone = user.zones[zoneId];
        if (zone.subzones) {
          for (const subzoneId in zone.subzones) {
            const subzone = zone.subzones[subzoneId];
            if (subzone.espId) {
              esps.push(subzone.espId);
            }
          }
        }
      }
    }

    clientRegistry[uid] = {
      socket: null, // Will be set when the user connects
      esps,
    };
  }

  console.log('Client registry initialized:', clientRegistry);
}
async function startServer() {
  // First, initialize the client registry
  await initializeClientRegistry();

  // Start HTTP server for Express
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Attach websocket server to same HTTP server on port 3000
  const wss = new WebSocket.Server({server});
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  wss.on('connection', ws => {
    console.log('Client connected to WebSocket');

    // Handle client messages
    ws.on('message', message => {
      try {
        const parsed = JSON.parse(message);

        if (parsed.type === 'REGISTER') {
          const uid = parsed.uid;
          if (uid) {
            if (clientRegistry[uid]) {
              clientRegistry[uid].socket = ws;
              console.log(`Registered socket for UID: ${uid}`);
            } else {
              console.warn(`UID ${uid} not found in registry.`);
            }
          } else {
            console.warn('REGISTER message missing uid');
          }
        }
        if (parsed.type === 'TOGGLE_FAN') {
          const {uid, espId, value} = parsed;
          if (!uid || !espId) {
            console.warn('FAN_STATUS missing uid or espId');
            return;
          }
          const fanEnabled = value;
          console.log(`Fan turned ${fanEnabled ? 'ON' : 'OFF'}`);

          const espSocket = clientRegistry[uid]?.esps?.[espId]?.socket;
          if (espSocket && espSocket.readyState === WebSocket.OPEN) {
            espSocket.send(
              JSON.stringify({
                type: 'FAN_STATUS',
                value: fanEnabled,
              }),
            );
            console.log(`Sent FAN_STATUS to ESP ID ${espId} for UID ${uid}`);
          } else {
            console.warn(
              `ESP socket not found or closed for UID ${uid} ESP ID ${espId}`,
            );
          }
        }
        if (parsed.type === 'TOGGLE_PUMP') {
          const {uid, espId, value} = parsed;
          if (!uid || !espId) {
            console.warn('TOGGLE_PUMP missing uid or espId');
            return;
          }
          pumpEnabled = value;
          console.log(`Pump turned ${pumpEnabled ? 'ON' : 'OFF'}`);

          const espSocket = clientRegistry[uid]?.esps?.[espId]?.socket;
          if (espSocket && espSocket.readyState === WebSocket.OPEN) {
            espSocket.send(
              JSON.stringify({type: 'PUMP_STATUS', value: pumpEnabled}),
            );
            console.log(`Sent PUMP_STATUS to ESP ID ${espId} for UID ${uid}`);
          } else {
            console.warn(
              `ESP socket not found or closed for UID ${uid} ESP ID ${espId}`,
            );
          }
        }

        if (parsed.type === 'TOGGLE_MOTION_DETECTOR') {
          const {uid, espId, value} = parsed;
          if (!uid || !espId) {
            console.warn('TOGGLE_MOTION_DETECTOR missing uid or espId');
            return;
          }
          const motionDetectorEnabled = value;
          console.log(
            `Motion Detector turned ${motionDetectorEnabled ? 'ON' : 'OFF'}`,
          );

          const espSocket = clientRegistry[uid]?.esps?.[espId]?.socket;
          if (espSocket && espSocket.readyState === WebSocket.OPEN) {
            espSocket.send(
              JSON.stringify({
                type: 'MOTION_DETECTOR_STATUS',
                value: motionDetectorEnabled,
              }),
            );
            console.log(
              `Sent MOTION_DETECTOR_STATUS to ESP ID ${espId} for UID ${uid}`,
            );
          } else {
            console.warn(
              `ESP socket not found or closed for UID ${uid} ESP ID ${espId}`,
            );
          }
        }
        if (parsed.type === 'MOTION_DETECTED') {
          const {esp_id, value} = parsed;
          let ownerUid = null;

          for (const uid in clientRegistry) {
            if (clientRegistry[uid].esps.includes(esp_id)) {
              ownerUid = uid;
              break;
            }
          }

          if (ownerUid) {
            console.log(
              `Motion detected from ESP ID ${esp_id} (UID: ${ownerUid}): ${value}`,
            );

            // Only alert if motionDetected is true
            if (value) {
              const ownerSocket = clientRegistry[ownerUid]?.socket;
              if (ownerSocket && ownerSocket.readyState === WebSocket.OPEN) {
                const alertMessage = {
                  type: 'ALERT',
                  alerts: [`Motion detected from device ${esp_id}`],
                };

                ownerSocket.send(JSON.stringify(alertMessage));
                console.log(`🚨 Sent motion alert to UID ${ownerUid}`);
              } else {
                console.warn(`Socket for UID ${ownerUid} is not open`);
              }
            }
          } else {
            console.warn(
              `ESP ID ${esp_id} not found in registry for motion alert`,
            );
          }
        }
        if (parsed.type === 'SET_AC_MODE') {
          const {uid, espId, mode} = parsed;
          if (!uid || !espId || typeof mode === 'undefined') {
            console.warn('SET_AC_MODE missing uid, espId, or mode');
            return;
          }

          const espSocket = clientRegistry[uid]?.esps?.[espId]?.socket;
          if (espSocket && espSocket.readyState === WebSocket.OPEN) {
            // Convert mode to boolean for ESP: auto = true, manual = false
            const isAuto = mode === 'auto';

            espSocket.send(
              JSON.stringify({
                type: 'SET_FAN_MODE',
                mode: isAuto,
              }),
            );

            console.log(
              `Sent SET_FAN_MODE (${
                isAuto ? 'AUTO' : 'MANUAL'
              }) to ESP ID ${espId} for UID ${uid}`,
            );
          } else {
            console.warn(
              `ESP socket not found or closed for UID ${uid} ESP ID ${espId}`,
            );
          }
        }
        // Handle SENSOR_INFO updates from ESP
        if (parsed.type === 'SENSOR_INFO') {
          console.log('message parsed:', parsed);

          const senderEspId = parsed.esp_id;
          let ownerUid = null;
          for (const uid in clientRegistry) {
            if (clientRegistry[uid].esps.includes(senderEspId)) {
              ownerUid = uid;
              break;
            }
          }

          if (ownerUid) {
            // Ensure ESP record exists
            clientRegistry[ownerUid].esps[senderEspId] =
              clientRegistry[ownerUid].esps[senderEspId] || {};

            // Save ESP socket
            clientRegistry[ownerUid].esps[senderEspId].socket = ws;

            // Only send thresholds once per ESP connection
            if (!clientRegistry[ownerUid].esps[senderEspId].thresholdSent) {
              if (ws.readyState === WebSocket.OPEN) {
                console.log('esp connected');
                ws.send(
                  JSON.stringify({
                    type: 'THRESHOLDS',
                    thresholds: {
                      TEMPERATURE_THRESHOLD,
                      DRY_THRESHOLD,
                      WATER_THRESHOLD,
                      GAS_THRESHOLD,
                    },
                  }),
                );
                console.log(`Sent thresholds to ESP ID ${senderEspId}`);
                clientRegistry[ownerUid].esps[senderEspId].thresholdSent = true;
              }
            }
          }
          const flooredSensorData = {
            ...parsed.value,
            temperature: safeFloor(parsed.value?.temperature),
            humidity: safeFloor(parsed.value?.humidity),
            soil_moisture: parsed.value?.soil_moisture === true ? 50 : 0,
            gas_value: safeFloor(parsed.value?.gas_value),
          };
          console.log('message from esp ', senderEspId, ':', flooredSensorData);
          // Save per ESP into history
          if (!sensorDataHistory[senderEspId]) {
            sensorDataHistory[senderEspId] = [];
          }
          sensorDataHistory[senderEspId].push({
            ...flooredSensorData,
            timestamp: Date.now(),
          });

          // Send the latest sensor data to the owner's socket
          const dataToSend = {
            ...flooredSensorData,
            timestamp: Date.now(),
            espId: senderEspId,
          };

          if (ownerUid) {
            const ownerSocket = clientRegistry[ownerUid]?.socket;
            if (ownerSocket && ownerSocket.readyState === WebSocket.OPEN) {
              ownerSocket.send(JSON.stringify(dataToSend));
            }
          }
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');

      for (const uid in clientRegistry) {
        if (clientRegistry[uid].socket === ws) {
          console.log(`Nulling socket for UID: ${uid}`);
          clientRegistry[uid].socket = null;
        }

        const esps = clientRegistry[uid].esps;
        if (esps) {
          for (const espId in esps) {
            if (esps[espId].socket === ws) {
              console.log(
                `Nulling ESP socket for ESP ID: ${espId} under UID: ${uid}`,
              );
              esps[espId].thresholdSent = false;
              esps[espId].socket = null;
            }
          }
        }
      }
    });

    ws.on('error', error => {
      console.error('WebSocket error:', error);
    });
  });
}

startServer();
setInterval(async () => {
  for (const espId in sensorDataHistory) {
    const history = sensorDataHistory[espId];
    if (!history || history.length === 0) continue;

    try {
      // Push the whole history array as a batch under espId
      // Usually in RTDB you can't save arrays directly, so push each entry individually or save under a timestamp key

      // Here, pushing each entry individually (you can optimize)
      const ref = db.ref(`esp_data/${espId}/sensor_history`);
      for (const entry of history) {
        await ref.push(entry);
      }

      console.log(`Saved entire history for ESP ${espId} to Realtime Database`);
    } catch (err) {
      console.error(`Failed to save history for ESP ${espId}:`, err);
    }

    sensorDataHistory[espId] = []; // Clear after saving
  }
}, 30000); // every 30 seconds

function safeFloor(value) {
  return typeof value === 'number' ? Math.floor(value) : null;
}

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
  console.log('trying to connect i see');
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

      return res.status(200).json(response);
    } else {
      return res.status(403).json({valid: false, message: 'UID mismatch'});
    }
  } catch (err) {
    console.error('Error verifying token:', err);
    return res.status(401).json({valid: false, message: 'Invalid token'});
  }
});
app.post('/get-username', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid or missing token');
    return res
      .status(401)
      .json({success: false, message: 'Missing or invalid token'});
  }

  const idToken = authHeader.split('Bearer ')[1];
  const {uid} = req.body;

  if (!uid) {
    return res.status(400).json({success: false, message: 'UID is required'});
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (decodedToken.uid !== uid) {
      return res.status(403).json({success: false, message: 'UID mismatch'});
    }

    const userRef = admin.database().ref(`users/${uid}/username`);
    const usernameSnapshot = await userRef.once('value');

    if (!usernameSnapshot.exists()) {
      return res
        .status(404)
        .json({success: false, message: 'Username not found'});
    }

    const username = usernameSnapshot.val();

    console.log(`Username fetched for user ${uid}:`, username);

    return res.status(200).json({
      success: true,
      username,
    });
  } catch (err) {
    console.error('Error fetching username:', err);
    return res
      .status(500)
      .json({success: false, message: 'Internal server error'});
  }
});

app.post('/add-zone', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid or missing token');
    return res
      .status(401)
      .json({success: false, message: 'Missing or invalid token'});
  }

  const idToken = authHeader.split('Bearer ')[1];
  const {uid, name, color} = req.body;

  if (!uid || !name || !color) {
    return res
      .status(400)
      .json({success: false, message: 'UID, name, and color are required'});
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (decodedToken.uid !== uid) {
      return res.status(403).json({success: false, message: 'UID mismatch'});
    }

    const userRef = admin.database().ref(`users/${uid}`);
    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
      return res.status(404).json({success: false, message: 'User not found'});
    }

    // Add the new zone under users/{uid}/zones/
    const zonesRef = userRef.child('zones');
    const newZoneRef = zonesRef.push(); // generate unique key
    await newZoneRef.set({name, color});

    console.log(`Zone added for user ${uid}:`, {name, color});

    return res.status(200).json({
      success: true,
      message: 'Zone added successfully',
      zoneId: newZoneRef.key,
    });
  } catch (err) {
    console.error('Error adding zone:', err);
    return res
      .status(500)
      .json({success: false, message: 'Internal server error'});
  }
});
app.post('/add-subzone', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid or missing token');
    return res
      .status(401)
      .json({success: false, message: 'Missing or invalid token'});
  }

  const idToken = authHeader.split('Bearer ')[1];
  const {uid, zoneId, name, color, espId} = req.body; // include espId

  if (!uid || !zoneId || !name || !color || !espId) {
    return res.status(400).json({
      success: false,
      message: 'UID, zoneId, name, color, and espId are required',
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (decodedToken.uid !== uid) {
      return res.status(403).json({success: false, message: 'UID mismatch'});
    }

    const userRef = admin.database().ref(`users/${uid}`);
    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
      return res.status(404).json({success: false, message: 'User not found'});
    }

    const zoneRef = userRef.child(`zones/${zoneId}`);
    const zoneSnapshot = await zoneRef.once('value');

    if (!zoneSnapshot.exists()) {
      return res.status(404).json({success: false, message: 'Zone not found'});
    }

    // --- ESP CHECK STARTS HERE ---
    const productRef = admin.database().ref(`products/${espId}`);
    const productSnapshot = await productRef.once('value');

    if (!productSnapshot.exists()) {
      return res.status(404).json({success: false, message: 'ESP not found'});
    }

    const productData = productSnapshot.val();

    if (!productData.sold) {
      return res
        .status(403)
        .json({success: false, message: 'ESP is not sold yet'});
    }

    if (productData.owner) {
      const message =
        productData.owner === uid
          ? 'You already used this ESP in another subzone.'
          : 'ESP already owned by someone else';
      return res.status(403).json({success: false, message});
    }

    // Assign ESP to user if not owned or already owned by this user
    await productRef.update({owner: uid});

    // Add the new subzone under users/{uid}/zones/{zoneId}/subzones/
    const subzonesRef = zoneRef.child('subzones');
    const newSubzoneRef = subzonesRef.push();
    await newSubzoneRef.set({name, color, espId});
    // ----- CLIENT REGISTRY UPDATE STARTS HERE -----
    if (!clientRegistry[uid]) {
      clientRegistry[uid] = {
        socket: null,
        esps: [],
      };
    }

    if (clientRegistry[uid].esps.includes(espId)) {
      return res.status(409).json({
        success: false,
        message: `ESP ${espId} is already linked to your account.`,
      });
    }

    // Otherwise, link it
    clientRegistry[uid].esps.push(espId);
    // ----- CLIENT REGISTRY UPDATE ENDS HERE -----

    return res.status(200).json({
      success: true,
      message: `Subzone added successfully. ESP ${espId} assigned.`,
      subzoneId: newSubzoneRef.key,
    });
  } catch (err) {
    console.error('Error adding subzone with ESP:', err);
    return res
      .status(500)
      .json({success: false, message: 'Internal server error'});
  }
});

app.get('/simulate-data', async (req, res) => {
  console.log('Full req.query:', req.query);
  const {sensor, espId} = req.query;
  console.log('Received request for sensor:', sensor, 'from ESP:', espId);

  const validTypes = ['temperature', 'humidity', 'gas_value', 'soil_moisture'];
  if (!validTypes.includes(sensor)) {
    console.log('Invalid sensor type requested');
    return res.send({error: 'Invalid sensor type requested'});
  }

  if (!espId) {
    console.log('Missing espId in query');
    return res.send({error: 'Missing espId in query'});
  }

  try {
    const db = admin.database();
    const snapshot = await db
      .ref(`esp_data/${espId}/sensor_history`)
      .orderByChild('timestamp')
      .once('value');

    let filteredData = [];

    if (snapshot.exists()) {
      const dataObj = snapshot.val();
      filteredData = Object.values(dataObj)
        .map(entry => ({
          timestamp: entry.timestamp,
          value: entry[sensor] ?? null,
        }))
        .filter(entry => entry.value !== null);
    }

    // Fallback if no data in Realtime Database
    if (filteredData.length === 0) {
      console.log(
        `No Realtime DB data for ESP ${espId}, using sensorDataHistory fallback`,
      );
      const history = sensorDataHistory[espId] || [];
      filteredData = history
        .map(entry => ({
          timestamp: entry.timestamp,
          value: entry[sensor] ?? null,
        }))
        .filter(entry => entry.value !== null);
    }

    const response = {values: filteredData};
    const binaryData = msgpack.encode(response);
    res.send(binaryData);
  } catch (error) {
    console.error('Error fetching sensor data from Realtime Database:', error);
    res.status(500).send({error: 'Failed to retrieve sensor data'});
  }
});

// Downsampling function to reduce data from 3600 to around 200 data points
const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

async function createInitialProductsIfNeeded() {
  const productsRef = db.ref('products');
  const snapshot = await productsRef.once('value');
  const data = snapshot.val();

  if (data) {
    console.log('Products already exist. Skipping generation.');
    return;
  }

  console.log('Generating initial products...');
  const newProducts = {};

  for (let i = 0; i < 10; i++) {
    let newId;
    do {
      newId = generateId(8);
    } while (newProducts[newId]); // ensure local uniqueness

    newProducts[newId] = {
      id: newId,
      name: 'ESP32 DevKit V1',
      category: 'microcontroller',
      price: 12.99,
      originalPrice: 15.99,
      description:
        'Carte de développement ESP32 avec WiFi et Bluetooth intégrés',
      shortDescription: 'Carte ESP32 avec WiFi/Bluetooth',
      specs: {
        Processeur: 'Dual-core 32-bit LX6',
        Fréquence: '240 MHz',
        WiFi: '802.11 b/g/n',
        Bluetooth: '4.2 BR/EDR et BLE',
        GPIO: '38 pins',
        Flash: '4 MB',
        Tension: '3.3V',
      },
      fullDescription:
        'La carte de développement ESP32 DevKit V1 est une plateforme idéale pour prototyper vos projets IoT. Avec son processeur dual-core, sa connectivité WiFi et Bluetooth intégrée, et ses nombreuses entrées/sorties, cette carte est parfaite pour les applications de smart farming.',
      sold: false,
      owner: null,
      activated: false,
    };
  }

  await productsRef.set(newProducts);
  console.log('Initial products created.');
}

// Call it on server start
createInitialProductsIfNeeded().catch(err =>
  console.error('Error creating products:', err),
);
