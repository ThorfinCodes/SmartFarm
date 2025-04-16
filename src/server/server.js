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

  // Keep broadcasting sensor data and alerts every second (no need to include pumpEnabled)
  const interval = setInterval(() => {
    const timestamp = Date.now();
    if (sharedSensorData) {
      sharedSensorData.temperature = safeFloor(sharedSensorData.temperature);
      sharedSensorData.humidity = safeFloor(sharedSensorData.humidity);

      sharedSensorData.gas_value = safeFloor(sharedSensorData.gas_value);
    }

    // Check for alerts and prepare them
    const alertsToSend = checkAlerts(sharedSensorData);

    // Prepare the data to send, including alerts if any
    const data = {
      ...sharedSensorData,
      alerts: alertsToSend.length > 0 ? alertsToSend : null, // Only include alerts if there are any
      type: alertsToSend.length > 0 ? 'ALERT' : null,
      timestamp,
    };

    // Send the data (sensor + alerts) to the client
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, 1);

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
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval); // Stop broadcasting when client disconnects
    clients.delete(ws); // Remove client from set
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});
let lastAlertTimestamp = {soil_moisture: 0};
const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes
// Function to check thresholds and prepare alerts
function checkAlerts(sensorData) {
  const alertsToSend = [];
  // Ensure sensorData is valid before proceeding
  if (!sensorData) {
    console.error('Sensor data is null or undefined');
    return alertsToSend; // Return empty alerts if sensor data is invalid
  }
  // Check for PIR status and send an alert if it's true
  if (sensorData.pir_status && !lastAlertState.pir_status) {
    alertsToSend.push('Motion detected (PIR active)');
    lastAlertState.pir_status = true; // Track that the alert has been sent
  } else if (!sensorData.pir_status && lastAlertState.pir_status) {
    lastAlertState.pir_status = false; // Reset alert state when PIR is no longer active
  }
  if (sensorData.temperature < 10 && !lastAlertState.temperature) {
    alertsToSend.push('Temperature too low (< 10°C)');
    lastAlertState.temperature = true;
  } else if (sensorData.temperature > 35 && !lastAlertState.temperature) {
    alertsToSend.push('Temperature too high (> 35°C)');
    lastAlertState.temperature = true;
  } else if (sensorData.temperature >= 10 && sensorData.temperature <= 35) {
    lastAlertState.temperature = false;
  }

  if (sensorData.humidity < 40 && !lastAlertState.humidity) {
    alertsToSend.push('Humidity too low (< 40%)');
    lastAlertState.humidity = true;
  } else if (sensorData.humidity > 85 && !lastAlertState.humidity) {
    alertsToSend.push('Humidity too high (> 85%)');
    lastAlertState.humidity = true;
  } else if (sensorData.humidity >= 40 && sensorData.humidity <= 85) {
    lastAlertState.humidity = false;
  }

  if (
    sensorData.soil_moisture === false &&
    (!lastAlertState.soil_moisture ||
      Date.now() - lastAlertTimestamp.soil_moisture > ALERT_COOLDOWN)
  ) {
    alertsToSend.push('Soil is dry! Please water the plant.');
    lastAlertState.soil_moisture = true;
    lastAlertTimestamp.soil_moisture = Date.now();
  }

  if (sensorData.gas_value > 300 && !lastAlertState.gas_value) {
    alertsToSend.push('Gas level too high (> 300ppm)');
    lastAlertState.gas_value = true;
  } else if (sensorData.gas_value <= 300) {
    lastAlertState.gas_value = false;
  }

  return alertsToSend;
}

const timeframes = {
  hour: 3600, // 1 hour = 3600 seconds
  day: 86400, // 1 day = 86400 seconds
  week: 604800, // 1 week = 604800 seconds
  month: 2592000, // 1 month = 2592000 seconds (30 days)
};

// This part has been updated to HTTP instead of WebSocket
app.get('/simulate-data', (req, res) => {
  const {sensor} = req.query; // Expecting only 'sensor' as input
  console.log('Received request for sensor:', sensor);

  const validTypes = ['temperature', 'humidity', 'gas_value', 'soil_moisture'];
  if (!validTypes.includes(sensor)) {
    return res.send({error: 'Invalid sensor type requested'});
  }

  let dataToSend = {};

  // Check each timeframe and determine if data is available
  for (let timeframe in timeframes) {
    const durationInSeconds = timeframes[timeframe];
    const dataSlice = Array.from(sensorDataHistory.values()).slice(
      Math.max(sensorDataHistory.size - durationInSeconds, 0),
    );

    if (dataSlice.length < durationInSeconds) {
      dataToSend[timeframe] = 'Data Incomplete'; // Data is not complete for the timeframe
    } else {
      dataToSend[timeframe] = dataSlice; // Send the data slice for the timeframe
    }

    // Downsample the data if it's not incomplete
    if (dataToSend[timeframe] !== 'Data Incomplete') {
      dataToSend[timeframe] = downsampleData(dataToSend[timeframe], 60, sensor); // Downsample data to 60 points
    }
  }

  // Prepare the response with all timeframes
  const response = {values: dataToSend};
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
