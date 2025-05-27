const WebSocket = require('ws');

// Simulate the ESP device (local WebSocket client)

const espWs = new WebSocket('wss://tulip-half-dormouse.glitch.me', {
  headers: {
    Origin: 'https://tulip-half-dormouse.glitch.me',
    'User-Agent': 'Mozilla/5.0 (Node.js ws client)',
  },
});
// State variables for pump and motion detector
let pumpEnabled = false;
let motionDetectorEnabled = true;

const esp_id = 'YCGU72C6';

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
    if (parsed.type === 'FAN_STATUS') {
      const fanEnabled = parsed.value;
      console.log(
        `Received FAN_STATUS: Fan turned ${fanEnabled ? 'ON' : 'OFF'}`,
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
    if (parsed.type === 'THRESHOLDS') {
      console.log('📥 Received Thresholds from Server:');
      console.log(
        `TEMPERATURE_THRESHOLD: ${parsed.thresholds.TEMPERATURE_THRESHOLD}`,
      );
      console.log(`WET_THRESHOLD: ${parsed.thresholds.WET_THRESHOLD}`);
      console.log(`DRY_THRESHOLD: ${parsed.thresholds.DRY_THRESHOLD}`);
      console.log(`WATER_THRESHOLD: ${parsed.thresholds.WATER_THRESHOLD}`);
      console.log(`GAS_THRESHOLD: ${parsed.thresholds.GAS_THRESHOLD}`);
    }
    if (parsed.type === 'SET_FAN_AUTO') {
      console.log(
        `📥 Received SET_FAN_AUTO: AC Mode is set to ${
          parsed.value ? 'AUTO' : 'MANUAL'
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
    esp_id,
    value: {
      temperature: 50, // °C
      humidity: 20, // %
      soil_moisture: soilMoistureStatus, // true/false status
      soil_moisture_value: Math.floor(Math.random() * 100), // percentage
      gas_value: 3001, // ppm or custom unit
      water_level: 449, // percentage or cm
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
  const motionDetected = Math.random() < 0.5; // 10% chance of motion

  const motionMessage = {
    type: 'MOTION_DETECTED',
    esp_id: esp_id,
    value: true,
  };

  espWs.send(JSON.stringify(motionMessage));
}, 1000);
