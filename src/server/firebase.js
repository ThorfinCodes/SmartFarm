// Import the Firebase Admin SDK
var admin = require('firebase-admin');

// Load the service account key JSON file
var serviceAccount = require('./serviceAccountKey.json'); // Adjust the path if necessary
// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    'https://smart-farm-358c5-default-rtdb.europe-west1.firebasedatabase.app',
});

// Export the initialized admin instance for use in other files
module.exports = admin;
