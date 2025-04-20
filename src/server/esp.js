const WebSocket = require('ws');

// Simulate the ESP device (local WebSocket client)
const espWs = new WebSocket('ws://192.168.1.33:3003');

// State variables for pump and motion detector
let pumpEnabled = false;
let motionDetectorEnabled = false;

// Log the initial states
console.log(`Initial Pump Status: ${pumpEnabled ? 'ON' : 'OFF'}`);
console.log(
  `Initial Motion Detector Status: ${motionDetectorEnabled ? 'ON' : 'OFF'}`,
);

// Listen for messages from the server
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

// Function to simulate PIR status based on the motion detector
function getPIRStatus() {
  if (!motionDetectorEnabled) return false;
  const flipToTrue = Math.random() < 0.1;
  const flipToFalse = Math.random() < 0.05;
  return flipToTrue || flipToFalse;
}

// Function to simulate soil moisture as boolean
function getSoilMoistureStatus() {
  return Math.random() < 0.5; // 50% chance: true = wet, false = dry
}

setInterval(() => {
  const pirStatus = getPIRStatus();
  const soilMoistureStatus = getSoilMoistureStatus();

  const simulatedData = {
    type: 'SENSOR_INFO',
    value: {
      gas_value: Math.floor(Math.random() * 100),
      humidity: Math.floor(Math.random() * 100),
      soil_moisture: soilMoistureStatus,
      temperature: Math.floor(Math.random() * 40),
      pir_status: pirStatus,
    },
  };

  if (espWs.readyState === WebSocket.OPEN) {
    espWs.send(JSON.stringify(simulatedData));
    console.log(
      `Sending PIR_STATUS: ${pirStatus ? 'TRUE' : 'FALSE'}, SOIL_MOISTURE: ${
        soilMoistureStatus ? 'WET' : 'DRY'
      }`,
    );
  }
}, 1000);
