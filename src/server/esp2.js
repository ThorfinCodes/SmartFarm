const WebSocket = require('ws');

// Simulate the ESP device (local WebSocket client)
const espWs = new WebSocket('ws://192.168.1.34:3003');

// State variables for pump and motion detector
let pumpEnabled = false;
let motionDetectorEnabled = false;

const espId = '4BRBXDZV';

console.log(`Initial Pump Status: ${pumpEnabled ? 'ON' : 'OFF'}`);
console.log(
  `Initial Motion Detector Status: ${motionDetectorEnabled ? 'ON' : 'OFF'}`,
);

// Handle incoming messages
espWs.on('message', message => {
  try {
    const parsed = JSON.parse(message);

    if (parsed.type === 'PUMP_STATUS') {
      pumpEnabled = parsed.value;
      console.log(
        `Received PUMP_STATUS: Pump turned ${pumpEnabled ? 'ON' : 'OFF'}`,
      );
    }

    if (parsed.type === 'MOTION_DETECTOR_STATUS') {
      motionDetectorEnabled = parsed.value;
      console.log(
        `Received MOTION_DETECTOR_STATUS: Motion Detector turned ${
          motionDetectorEnabled ? 'ON' : 'OFF'
        }`,
      );
    }
  } catch (err) {
    console.error('Error parsing message:', err);
  }
});

// Simulate soil moisture as boolean
function getSoilMoistureStatus() {
  return Math.random() < 0.5; // 50% chance: true = wet, false = dry
}

// SENSOR_INFO sending every second (excluding pir_status now)
setInterval(() => {
  const soilMoistureStatus = getSoilMoistureStatus();

  const simulatedData = {
    type: 'SENSOR_INFO',
    espId,
    value: {
      gas_value: Math.floor(Math.random() * 100),
      humidity: Math.floor(Math.random() * 100),
      soil_moisture: soilMoistureStatus,
      temperature: Math.floor(Math.random() * 40),
    },
  };

  if (espWs.readyState === WebSocket.OPEN) {
    espWs.send(JSON.stringify(simulatedData));
  }
}, 1000);

// Simulate motion detection separately
setInterval(() => {
  if (!motionDetectorEnabled || espWs.readyState !== WebSocket.OPEN) return;

  // Random chance to flip value (simulate motion)
  const motionDetected = Math.random() < 0.1; // 10% chance of motion

  const motionMessage = {
    type: 'MOTION_DETECTED',
    esp_id: espId,
    value: motionDetected,
  };

  espWs.send(JSON.stringify(motionMessage));
}, 1000);
