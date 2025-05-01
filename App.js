
import React, {useState, useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import HomeScreen from './src/screens/HomeScreen';
import GraphScreen from './src/screens/GraphScreen';

import notifee, {AndroidImportance} from '@notifee/react-native';
import {Platform} from 'react-native';
import Sound from 'react-native-sound'; // Import react-native-sound
import IdentificationScreen from './src/screens/IdentificationScreen';
import SignupScreen from './src/screens/SignupScreen';
import UserStuff from './src/screens/UserStuff';
import Subzone from './src/screens/Subzone';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ActivityIndicator, View} from 'react-native';
import './src/firebase/firebase';
import {getAuth, onAuthStateChanged} from '@react-native-firebase/auth';
const Stack = createNativeStackNavigator();

const App = () => {
  const [gasValue, setGasValue] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [soilMoisture, setSoilMoisture] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [isArrosageEnabled, setIsArrosageEnabled] = useState(false);
  const [initialRoute, setInitialRoute] = useState(null);
  const [username, setUsername] = useState('');
  const socketRef = useRef(null);
  let lastAlertTime = Date.now(); // To track time of the last alert

  // Load the sound file
  const alertSound = new Sound(
    require('../SmartFarm/src/sound/mixkitelevatortone2863.mp3'),
    Sound.MAIN_BUNDLE,
    error => {
      if (error) {
        console.log('Failed to load the sound', error);
      }
    },
  );
  alertSound.setVolume(0.1);
  useEffect(() => {
    const auth = getAuth();
    let isRequestInProgress = false; // Add this flag to prevent multiple requests

    // Listen for changes in authentication state
    onAuthStateChanged(auth, async user => {
      if (user) {
        if (isRequestInProgress) return; // Skip if request is already in progress
        isRequestInProgress = true;

        try {
          const token = await user.getIdToken(true); // Force refresh the token
          const uid = user.uid; // Get the UID

          // Store the refreshed token and UID
          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('uid', uid);

          // Proceed to verify token or other app logic
          const res = await fetch('http://192.168.1.41:3000/verify-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({uid}),
          });

          const text = await res.text();
          console.log('Response Text:', text); // Log the raw response

          const result = JSON.parse(text); // Manually parse if necessary

          if (res.ok && result?.valid) {
            setUsername(result.user.username);
            setInitialRoute('MyStuff');
          } else {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('uid');
            setInitialRoute('Identification');
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('uid');
          setInitialRoute('Identification');
        } finally {
          isRequestInProgress = false; // Reset flag after the request is done
        }
      } else {
        // User is signed out
        setInitialRoute('Identification');
      }
    });
  }, []);
  useEffect(() => {
    const setupNotification = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const permission = await notifee.requestPermission();
        console.log('Notification permission:', permission);
      }

      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      socketRef.current = new WebSocket('ws://192.168.1.41:3003');

      socketRef.current.onmessage = async event => {
        console.log('Received from server:', event.data);

        const data = JSON.parse(event.data);

        if (data.type === 'PUMP_STATUS') {
          setIsArrosageEnabled(data.value);
        } else if (data.type === 'ALERT') {
          const currentTime = Date.now();
          if (currentTime - lastAlertTime > 5000) {
            console.log('🚨 Alerts received:', data.alerts);

            data.alerts.forEach(async alert => {
              console.log(alert);

              // Play sound when an alert is triggered
              alertSound.play();

              // Display notification
              await notifee.displayNotification({
                title: 'Alert!',
                body: alert,
                android: {
                  channelId,
                },
              });
            });

            lastAlertTime = currentTime;
          }
        }
        setGasValue(data.gas_value);
        setHumidity(data.humidity);
        setSoilMoisture(data.soil_moisture);
        setTemperature(data.temperature);
      };

      return () => {
        socketRef.current?.close();
      };
    };

    setupNotification();
  }, []);
  if (!initialRoute) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }
  const UserStuffWithUsername = ({username, ...props}) => {
    return <UserStuff {...props} username={username} />;
  };

  const SubzoneWithUsername = ({username, ...props}) => {
    return <Subzone {...props} username={username} />;
  };
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{headerShown: false}}
          initialRouteName={initialRoute}>
          <Stack.Screen
            name="Identification"
            component={IdentificationScreen}
          />
          <Stack.Screen name="Home">
            {props => (
              <HomeScreen
                {...props}
                gasValue={gasValue}
                humidity={humidity}
                soilMoisture={soilMoisture}
                temperature={temperature}
                isArrosageEnabled={isArrosageEnabled}
                socketRef={socketRef}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="MyStuff">
            {props => <UserStuffWithUsername {...props} username={username} />}
          </Stack.Screen>

          <Stack.Screen name="MySubzone">
            {props => <SubzoneWithUsername {...props} username={username} />}
          </Stack.Screen>
          <Stack.Screen name="Graph" options={{animation: 'fade_from_bottom'}}>
            {props => (
              <GraphScreen
                {...props}
                gasValue={gasValue}
                humidity={humidity}
                soilMoisture={soilMoisture}
                temperature={temperature}
                socketRef={socketRef}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
=======
import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import IdentificationScreen from './src/screens/IdentificationScreen';
import SignupScreen from './src/screens/SignupScreen';
import GraphScreen from './src/screens/GraphScreen';
import Subzone from './src/screens/Subzone';
import UserStuff from './src/screens/UserStuff';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {FIREBASE_API_KEY} from '@env';

const Stack = createNativeStackNavigator();

const App = () => {
  // Log the Firebase API key
  useEffect(() => {
    console.log('Firebase API Key:', FIREBASE_API_KEY); // Logs it when the component mounts
  }, []);

  return (
    <GestureHandlerRootView>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen
            name="Identification"
            component={IdentificationScreen}
          />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MyStuff" component={UserStuff} />
          <Stack.Screen name="MySubzone" component={Subzone} />
          <Stack.Screen
            name="Graph"
            component={GraphScreen}
            options={{animation: 'fade_from_bottom'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
>>>>>>> 07e2490937a3e613fe3a4334e648a4dff4c2f9da
