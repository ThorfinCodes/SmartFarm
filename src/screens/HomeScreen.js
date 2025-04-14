import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import RNSwitch from '../components/RNSwitch';
import ArrowDroite from '../icones/ArrowDroite.svg';
import ArrowDown from '../icones/ArrowDown.svg';
import ArrowAwjaOrange from '../icones/ArrowAwjaOrange.svg';
import ArrowAwjaMauve from '../icones/ArrowAwjaMauve.svg';
import ArrowAwjaDown from '../icones/ArrowAwjaDown.svg';
import {useNavigation} from '@react-navigation/native';

import {RFValue} from 'react-native-responsive-fontsize';
import {Dimensions} from 'react-native';
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const HomeScreen = () => {
  const navigation = useNavigation();
  const [isArrosageEnabled, setIsArrosageEnabled] = useState(false);
  const [isAirConditionerEnabled, setIsAirConditionerEnabled] = useState(false);
  // State variables to hold sensor values
  const [gasValue, setGasValue] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [soilMoisture, setSoilMoisture] = useState(null);
  const [temperature, setTemperature] = useState(null);
  useEffect(() => {
    // Establish WebSocket connection to the server that sends constant data
    const socket = new WebSocket('ws://192.168.1.37:3003'); // Connect to the WebSocket server

    // Set up the WebSocket message handler
    socket.onmessage = event => {
      const data = JSON.parse(event.data); // Parse the incoming JSON data
      // Update state with new sensor values
      setGasValue(data.gas_value);
      setHumidity(data.humidity);
      setSoilMoisture(data.soil_moisture);
      setTemperature(data.temperature);
    };

    // Handle WebSocket errors
    socket.onerror = error => {
      console.error('WebSocket error:', error);
    };

    // Clean up WebSocket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{gap: 10}}>
      <View style={styles.Bento1}>
        <View style={styles.Bento1Left}>
          <View style={styles.Bento1LeftTop}>
            <Image
              source={require('../images/avatar.png')}
              style={styles.imageBento1LeftTop}
            />
            <View style={styles.TransparentIcone}>
              <FontAwesome name="power-off" size={30} color="red" />
            </View>
          </View>
          <Text style={{...styles.WelcomeText, fontFamily: 'Poppins-Medium'}}>
            Welcome to the farm
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Graph', {
              text: 'Arrosage',
            })
          }
          style={styles.Bento1Right}>
          <View style={styles.Bento1RightTop}>
            <View style={styles.TransparentIconeGreen}>
              <Image
                source={require('../icones/faucet.png')}
                style={styles.faucet}
              />
            </View>
          </View>
          <View style={styles.GreenText}>
            <Text
              style={{fontSize: RFValue(18), fontFamily: 'Poppins-SemiBold'}}>
              Arrosage
            </Text>
            <Text
              style={{
                fontSize: RFValue(18),
                fontFamily: 'Poppins-Light',
                lineHeight: 20,
              }}>
              1h System on
            </Text>
          </View>
          <View style={styles.SwintchContainer}>
            <RNSwitch
              value={isArrosageEnabled}
              handleOnPress={() => setIsArrosageEnabled(!isArrosageEnabled)}
              activeTrackColor="#9DE607"
              inActiveTrackColor="gray"
              thumbColor="white"
            />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.Bento2Container}>
        <TouchableOpacity
          style={styles.Bento2}
          onPress={() =>
            navigation.navigate('Graph', {
              text: 'Air Conditioner',
            })
          }>
          <View style={styles.Bento2Left}>
            <Text
              style={{fontFamily: 'Poppins-SemiBold', fontSize: RFValue(24)}}>
              Air Conditioner
            </Text>

            {temperature != null ? (
              <Text style={{fontFamily: 'Poppins-Bold', fontSize: RFValue(54)}}>
                {temperature + '°C'}
              </Text>
            ) : (
              <ActivityIndicator
                size="large"
                color="white"
                style={{padding: 26}}
              />
            )}

            <RNSwitch
              value={isAirConditionerEnabled}
              handleOnPress={() =>
                setIsAirConditionerEnabled(!isAirConditionerEnabled)
              }
              activeTrackColor="green"
              inActiveTrackColor="gray"
              thumbColor="white"
            />
          </View>

          <View style={styles.Bento2Right}>
            <View style={{...styles.BtnArrowDroit, backgroundColor: 'black'}}>
              <ArrowDroite />
            </View>
            <View style={styles.BtnArrowDroit}>
              <ArrowDown color="white" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.Bento3}>
        <View style={styles.Bento3Left}>
          <View style={styles.Bento3LeftTop}>
            <View
              style={{...styles.TransparentIcone, backgroundColor: 'white'}}>
              <FontAwesome5 name="temperature-low" size={30} color="#8000FF" />
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Graph', {
                  text: 'Temperature',
                })
              }
              style={{...styles.TransparentIcone, backgroundColor: 'white'}}>
              <ArrowAwjaMauve />
            </TouchableOpacity>
          </View>
          <View style={styles.TextBento3Left}>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-SemiBold',
                fontSize: RFValue(18),
                letterSpacing: 0.2,
              }}>
              Température
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medieum',
                fontSize: RFValue(18),
              }}>
              {temperature ? temperature : 'Loading...'}°C
            </Text>
          </View>
        </View>
        <View style={styles.Bento3Right}>
          <View>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-SemiBold',
                fontSize: RFValue(18),
                letterSpacing: 0.3,
              }}>
              Soil Moisture
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medieum',
                fontSize: RFValue(18),
              }}>
              {soilMoisture ? soilMoisture : 'Loading...'}%
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Graph', {
                text: 'PH Sensor',
              })
            }
            style={{
              ...styles.BtnArrowDroit,
              backgroundColor: '#303030',
              marginLeft: '40%',
            }}>
            <ArrowAwjaDown color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.Bento4}>
        <View style={styles.Bento4Left}>
          <View>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-SemiBold',
                fontSize: RFValue(18),
                letterSpacing: 0.3,
              }}>
              CO₂ Sensor
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medieum',
                fontSize: RFValue(18),
              }}>
              {gasValue ? gasValue : 'Loading...'}ppm
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Graph', {
                text: 'CO2 Sensor',
              })
            }
            style={{
              ...styles.BtnArrowDroit,
              backgroundColor: '#303030',
              marginLeft: '40%',
            }}>
            <ArrowAwjaDown color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.Bento4Right}>
          <View style={styles.Bento4RightTop}>
            <View
              style={{...styles.TransparentIcone, backgroundColor: 'white'}}>
              <FontAwesome name="tint" size={30} color="#F9865B" />
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Graph', {
                  text: 'Humidity',
                })
              }
              style={{...styles.TransparentIcone, backgroundColor: 'white'}}>
              <ArrowAwjaOrange />
            </TouchableOpacity>
          </View>
          <View style={styles.TextBento4Right}>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-SemiBold',
                fontSize: RFValue(18),
                letterSpacing: 0.2,
              }}>
              Humidité
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medieum',
                fontSize: RFValue(18),
              }}>
              {humidity ? humidity : 'Loading...'} g/m³
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#101014',
    flex: 1,
  },
  Bento1: {
    width: screenWidth,
    height: (screenHeight * 27.5) / 100,
    flexDirection: 'row',
    paddingLeft: (screenWidth * 3.3) / 100,
    paddingRight: (screenWidth * 6) / 100,
    gap: (screenWidth * 2.7) / 100,
  },
  Bento1Left: {
    backgroundColor: '#222124',
    width: screenWidth / 2,
    height: '100%',
    borderRadius: 20,
    flexDirection: 'column',
    justifyContent: 'space-around',
    borderWidth: 1.5,
    borderColor: '#303030',
  },
  Bento1LeftTop: {
    width: '100%',
    height: (screenHeight * 10) / 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: (screenWidth * 2.7) / 100,
    paddingRight: (screenWidth * 2.7) / 100,
  },
  imageBento1LeftTop: {
    resizeMode: 'cover',
    borderRadius: 50,
    width: (screenWidth * 19.4) / 100,
    height: (screenWidth * 19.4) / 100,
  },
  Bento1Right: {
    backgroundColor: '#ACF900',
    width: (screenWidth * 41) / 100,
    height: '100%',
    borderRadius: 20,
    justifyContent: 'space-evenly',
  },
  TransparentIcone: {
    backgroundColor: '#303030',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    width: (screenWidth * 19.4) / 100,
    height: (screenWidth * 19.4) / 100,
  },
  WelcomeText: {
    color: 'white',
    fontSize: RFValue(18),
    width: '75%',
    letterSpacing: 1.2,
    paddingLeft: (screenWidth * 3.3) / 100,
    marginTop: (screenHeight * 2.4) / 100,
  },
  Bento1RightTop: {
    height: (screenHeight * 12) / 100,
    width: screenWidth,
    paddingLeft: (screenWidth * 2.7) / 100,
  },
  TransparentIconeGreen: {
    marginTop: (screenHeight * 1.5) / 100,
    width: (screenWidth * 19.4) / 100,
    height: (screenWidth * 19.4) / 100,
    borderRadius: 180,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },

  faucet: {
    width: (screenWidth * 13.8) / 100,
    height: (screenWidth * 13.8) / 100,
  },
  GreenText: {
    paddingLeft: (screenWidth * 3.3) / 100,
    gap: 0,
  },
  SwintchContainer: {
    marginLeft: (screenWidth * 20.5) / 100,
  },
  Bento2Container: {
    paddingLeft: (screenWidth * 3.3) / 100,
    paddingRight: (screenWidth * 3.3) / 100,
  },
  Bento2: {
    width: '100%',
    height: (screenHeight * 35.6) / 100,
    backgroundColor: '#FFED48',
    borderRadius: 20,
    flexDirection: 'row',
  },
  Bento2Left: {
    height: '100%',
    width: (screenWidth * 56) / 100,
    paddingLeft: (screenWidth * 2.7) / 100,
    paddingTop: (screenHeight * 1.6) / 100,
    paddingBottom: (screenHeight * 1.6) / 100,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  Bento2Right: {
    height: '100%',
    width: (screenWidth * 37) / 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: (screenHeight * 2) / 100,
  },
  BtnArrowDroit: {
    backgroundColor: 'white',
    height: (screenWidth * 18) / 100,
    width: (screenWidth * 18) / 100,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  Bento3: {
    width: '100%',
    height: (screenHeight * 33) / 100,
    gap: (screenWidth * 2.8) / 100,
    flexDirection: 'row',
    paddingLeft: (screenWidth * 2.7) / 100,
    paddingRight: (screenWidth * 5.5) / 100,
  },
  Bento3Left: {
    backgroundColor: '#8000FF',
    height: '100%',
    width: (screenWidth * 55.2) / 100,
    borderRadius: 20,
    justifyContent: 'space-between',
  },
  Bento3LeftTop: {
    width: '100%',
    height: (screenHeight * 15) / 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: (screenWidth * 2.7) / 100,
    paddingRight: (screenWidth * 2.7) / 100,
    paddingTop: (screenHeight * 1.6) / 100,
    paddingBottom: (screenHeight * 1.6) / 100,
  },
  TextBento3Left: {
    justifyContent: 'center',
    paddingLeft: (screenWidth * 2.7) / 100,
    paddingBottom: (screenHeight * 3) / 100,
  },
  Bento3Right: {
    backgroundColor: '#222124',
    height: '100%',
    width: (screenWidth * 37) / 100,
    borderRadius: 20,
    justifyContent: 'space-around',
    paddingLeft: (screenWidth * 3.3) / 100,
    borderWidth: 1.5,
    borderColor: '#303030',
  },
  Bento4: {
    width: '100%',
    height: (screenHeight * 33) / 100,
    gap: (screenWidth * 2.8) / 100,
    flexDirection: 'row',
    paddingLeft: (screenWidth * 2.7) / 100,
    paddingRight: (screenWidth * 5.5) / 100,
  },
  Bento4Left: {
    backgroundColor: '#222124',
    height: '100%',
    width: (screenWidth * 37) / 100,
    borderRadius: 20,
    justifyContent: 'space-around',
    paddingLeft: (screenWidth * 3.3) / 100,
    borderWidth: 1.5,
    borderColor: '#303030',
  },
  Bento4Right: {
    backgroundColor: '#F9865B',
    height: '100%',
    width: (screenWidth * 55) / 100,
    borderRadius: 20,
    justifyContent: 'space-between',
  },
  Bento4RightTop: {
    width: '100%',
    height: (screenHeight * 15) / 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: (screenWidth * 2.7) / 100,
    paddingRight: (screenWidth * 2.7) / 100,
    paddingTop: (screenHeight * 1.6) / 100,
    paddingBottom: (screenHeight * 1.6) / 100,
  },
  TextBento4Right: {
    justifyContent: 'center',
    paddingLeft: (screenWidth * 2.7) / 100,
    paddingBottom: (screenHeight * 3) / 100,
  },
});
export default HomeScreen;
