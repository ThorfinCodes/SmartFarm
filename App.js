import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import GraphScreen from './src/screens/GraphScreen';
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
          <Stack.Screen name="Home" component={HomeScreen} />
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
