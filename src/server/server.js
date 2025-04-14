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

// Function to generate random sensor values
function generateSensorValues() {
  const gas_value = Math.floor(Math.random() * 100);
  const humidity = Math.floor(Math.random() * 100);
  const soil_moisture = Math.floor(Math.random() * 100);
  const temperature = Math.floor(Math.random() * 40);

  return {
    gas_value,
    humidity,
    soil_moisture,
    temperature,
  };
}

// WebSocket server for constant data
const wss = new WebSocket.Server({port: 3003}); // WebSocket server on port 3003

wss.on('connection', ws => {
  console.log('Client connected to WebSocket');

  // Emit data every second for constant data updates
  const interval = setInterval(() => {
    const sensorData = generateSensorValues();
    const timestamp = Date.now();
    const data = {...sensorData, timestamp};
    ws.send(JSON.stringify(data)); // Send the data as a JSON string
  }, 1000);

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval); // Stop emitting data when the client disconnects
  });

  // Handle WebSocket errors
  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

// WebSocket server for simulated large data (historical data)
const simulateWs = new WebSocket.Server({port: 3004}); // WebSocket server on port 3004 for simulated data

// Generate 30 days of data (1 month)
const preGeneratedData = generateDataPoints(2592000); // 2592000 seconds = 1 month

function generateDataPoints(count) {
  const values = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const data = generateSensorValues();
    const timestamp = now - (count - i) * 1000;
    values.push({...data, timestamp});
  }
  return values;
}

simulateWs.on('connection', ws => {
  console.log('Client connected for simulated data');

  // Receive requests for historical data
  ws.on('message', message => {
    const {sensor} = JSON.parse(message); // Expecting only 'sensor' as input
    console.log(`Received request for sensor: ${sensor}`);

    const validTypes = [
      'temperature',
      'humidity',
      'gas_value',
      'soil_moisture',
    ];
    if (!validTypes.includes(sensor)) {
      return ws.send(JSON.stringify({error: 'Invalid sensor type requested'}));
    }

    let dataToSend = {};

    // Data generation for each timeframe
    dataToSend.hour = preGeneratedData.slice(preGeneratedData.length - 3600); // Last hour's worth of data
    dataToSend.day = preGeneratedData.slice(preGeneratedData.length - 86400); // Last day's worth of data
    dataToSend.week = preGeneratedData.slice(preGeneratedData.length - 604800); // Last week's worth of data
    dataToSend.month = preGeneratedData; // Entire month's worth of data

    // Downsample data for each timeframe
    dataToSend.hour = downsampleData(dataToSend.hour, 60, sensor); // Downsample hourly data
    dataToSend.day = downsampleData(dataToSend.day, 60, sensor); // Downsample daily data
    dataToSend.week = downsampleData(dataToSend.week, 60, sensor); // Downsample weekly data
    dataToSend.month = downsampleData(dataToSend.month, 60, sensor); // Downsample monthly data

    // Prepare the response with all timeframes
    const response = {values: dataToSend};
    const binaryData = msgpack.encode(response);
    ws.send(binaryData);
  });

  ws.on('close', () => {
    console.log('Client disconnected from simulated data WebSocket');
  });
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
