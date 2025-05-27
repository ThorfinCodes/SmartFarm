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
import {VERIFY_TOKEN_URL, WEBSOCKET_URL} from '@env';
const Stack = createNativeStackNavigator();

const App = () => {
  const [isArrosageEnabled, setIsArrosageEnabled] = useState(false);
  const [initialRoute, setInitialRoute] = useState(null);
  const [username, setUsername] = useState('');
  const [zones, setZones] = useState([]);

  const socketRef = useRef(null);
  const [espData, setEspData] = useState({});
  let lastAlertTime = 0; // To track time of the last alert

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
          await Promise.all([
            AsyncStorage.setItem('userToken', token),
            AsyncStorage.setItem('uid', uid),
          ]);

          const res = await fetch(VERIFY_TOKEN_URL, {
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

            const userZones = result.user.zones
              ? Object.entries(result.user.zones).map(([zoneId, zone]) => ({
                  zoneId,
                  name: zone.name,
                  color: zone.color,
                  subzones: zone.subzones
                    ? Object.entries(zone.subzones).map(
                        ([subzoneId, subZone]) => ({
                          subzoneId,
                          name: subZone.name,
                          color: subZone.color,
                          espId: subZone.espId, // <-- Add espId here!
                        }),
                      )
                    : [],
                }))
              : [];

            setZones(userZones);
            console.log('app zones:', userZones);

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

      socketRef.current = new WebSocket(WEBSOCKET_URL);

      // Send REGISTER message as soon as socket opens
      socketRef.current.onopen = () => {
        // Get uid from AsyncStorage (or wherever you saved it)
        AsyncStorage.getItem('uid').then(uid => {
          if (uid) {
            socketRef.current.send(JSON.stringify({type: 'REGISTER', uid}));
            console.log(`Sent REGISTER with UID: ${uid}`);
          } else {
          }
        });
      };
      socketRef.current.onmessage = async event => {
        const data = JSON.parse(event.data);

        if (data.type === 'PUMP_STATUS') {
          setIsArrosageEnabled(data.value);
        } else if (data.type === 'ALERT') {
          const currentTime = Date.now();

          // If lastAlertTime is zero (meaning first alert), or 30 seconds passed, show alert
          if (lastAlertTime === 0 || currentTime - lastAlertTime > 30000) {
            console.log('🚨 Alerts received:', data.alerts);

            data.alerts.forEach(async alert => {
              console.log(alert);

              alertSound.play();

              await notifee.displayNotification({
                title: 'Alert!',
                body: alert,
                android: {
                  channelId,
                },
              });
            });

            lastAlertTime = currentTime;
          } else {
            console.log('Alert received too soon, ignoring.');
          }
        }
        if (!data.espId) return; // Skip if no ESP ID (safety check)

        setEspData(prev => ({
          ...prev,
          [data.espId]: {
            ...(prev[data.espId] || {}),
            temperature: data.temperature,
            humidity: data.humidity,
            soilMoisture: data.soil_moisture,
            soilMoistureValue: data.soil_moisture_value,
            gasValue: data.gas_value,
            waterLevel: data.water_level,
          },
        }));
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
  const UserStuffWithUsername = ({username, zones, setZones, ...props}) => {
    return (
      <UserStuff
        {...props}
        username={username}
        zones={zones}
        setZones={setZones}
      />
    );
  };

  const SubzoneWithUsername = ({
    username,
    zones,
    setZones,
    espData,
    ...props
  }) => {
    return (
      <Subzone
        {...props}
        username={username}
        zones={zones}
        setZones={setZones}
        espData={espData} // <--- forward espData here
      />
    );
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
                espData={espData}
                isArrosageEnabled={isArrosageEnabled}
                socketRef={socketRef}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="MyStuff">
            {props => (
              <UserStuffWithUsername
                {...props}
                username={username}
                zones={zones}
                setZones={setZones} // <-- pass setter here
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="MySubzone">
            {props => (
              <Subzone
                {...props}
                username={username}
                zones={zones}
                setZones={setZones}
                espData={espData}
                socketRef={socketRef}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Graph" options={{animation: 'fade_from_bottom'}}>
            {props => (
              <GraphScreen {...props} espData={espData} socketRef={socketRef} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
