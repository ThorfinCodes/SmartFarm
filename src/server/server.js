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

// Last alert states to avoid repeated alerts
let lastAlertState = {
  temperature: false,
  humidity: false,
  soil_moisture: false,
  gas_value: false,
  pir_status: false,
};
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

const timeframes = {
  hour: 3600, // 1 hour = 3600 seconds
  day: 86400, // 1 day = 86400 seconds
  week: 604800, // 1 week = 604800 seconds
  month: 2592000, // 1 month = 2592000 seconds (30 days)
};

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
function downsampleData(data, targetCount, sensor) {
  const chunkSize = Math.floor(data.length / targetCount); // Calculate how many data points per chunk
  const result = [];

  // Iterate over the data in chunks
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize); // Slice out the chunk of data

    // If the chunk is empty, skip it
    if (chunk.length === 0) continue;

    // Calculate the average value for the sensor in the chunk
    const avgValue =
      chunk.reduce((sum, item) => sum + (item[sensor] || 0), 0) / chunk.length;

    // Calculate the average timestamp for the chunk (optional, if you want to keep the time dimension consistent)
    const avgTimestamp =
      chunk.reduce((sum, item) => sum + item.timestamp, 0) / chunk.length;

    // Store the averaged value and timestamp
    result.push({timestamp: avgTimestamp, value: avgValue});
  }

  return result;
}
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
