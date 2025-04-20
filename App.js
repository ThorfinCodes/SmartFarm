import React, {useState, useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import HomeScreen from './src/screens/HomeScreen';
import GraphScreen from './src/screens/GraphScreen';

import notifee, {AndroidImportance} from '@notifee/react-native';
import {Platform} from 'react-native';
import Sound from 'react-native-sound'; // Import react-native-sound

const Stack = createNativeStackNavigator();

const App = () => {
  const [gasValue, setGasValue] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [soilMoisture, setSoilMoisture] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [isArrosageEnabled, setIsArrosageEnabled] = useState(false);

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

      socketRef.current = new WebSocket('ws://192.168.1.33:3003');

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

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
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
