import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import RNSwitch from '../components/RNSwitch';
import ArrowDroite from '../icones/ArrowDroite.svg';
import ArrowDown from '../icones/ArrowDown.svg';
import ArrowAwjaOrange from '../icones/ArrowAwjaOrange.svg';
import ArrowAwjaMauve from '../icones/ArrowAwjaMauve.svg';
import ArrowAwjaDown from '../icones/ArrowAwjaDown.svg';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Dimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const HomeScreen = ({espData, isArrosageEnabled, socketRef}) => {
  const [autoMode, setAutoMode] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const espId = route.params?.espId;

  // Get the data for current espId or empty object
  const data = espData[espId] || {};
  console.log('data:', data);
  // Local state initialized with prop
  const [isArrosageOn, setIsArrosageOn] = useState(isArrosageEnabled);
  const [isAirConditionerEnabled, setIsAirConditionerEnabled] = useState(false);
  const [isMotionDetectorEnabled, setIsMotionDetectorEnabled] = useState(false);

  const [uid, setUid] = useState(null);

  // Load uid from AsyncStorage once when component mounts
  useEffect(() => {
    const loadUid = async () => {
      try {
        const storedUid = await AsyncStorage.getItem('uid');
        if (storedUid) setUid(storedUid);
        else console.warn('UID not found in AsyncStorage');
      } catch (error) {
        console.error('Error reading uid from AsyncStorage', error);
      }
    };
    loadUid();
  }, []);
  const handleMotionSwitchToggle = () => {
    const newValue = !isMotionDetectorEnabled;

    // Update local state
    setIsMotionDetectorEnabled(newValue);

    // Send message through WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'TOGGLE_MOTION_DETECTOR',
          value: newValue,
          uid, // include uid here
          espId, // include espId here
        }),
      );
    } else {
      console.warn('WebSocket is not open. Cannot send message.');
    }
  };
  const handleSwitchToggle = () => {
    const newValue = !isArrosageOn;

    // Update local state
    setIsArrosageOn(newValue);

    // Send message through WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'TOGGLE_PUMP',
          value: newValue,
          uid, // include uid here
          espId, // include espId here
        }),
      );
    } else {
      console.warn('WebSocket is not open. Cannot send message.');
    }
  };
  const handleAirConditionerToggle = () => {
    const newValue = !isAirConditionerEnabled;

    // Update local state
    setIsAirConditionerEnabled(newValue);

    // Send message through WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'TOGGLE_FAN',
          value: newValue,
          uid, // include uid here
          espId, // include espId here
        }),
      );
    } else {
      console.warn('WebSocket is not open. Cannot send FAN_STATUS message.');
    }
  };
  const handleAirModeToggle = () => {
    const newMode = !autoMode;

    // Update local state
    setAutoMode(newMode);

    // Send mode change to server
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'SET_AC_MODE',
          mode: newMode ? 'auto' : 'manual', // Send string form for clarity
          uid,
          espId,
        }),
      );
    } else {
      console.warn('WebSocket is not open. Cannot send AC mode change.');
    }
  };
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{gap: 10}}>
      <View style={styles.Bento1}>
        <View style={styles.Bento1Left}>
          <View style={styles.Bento1LeftTop}>
            <View
              style={{
                width: 70, // adjust size
                height: 70,
                borderRadius: 35, // half of width/height
                borderWidth: 1,
                borderColor: '#5a5a5a', // or black, green, etc.
                backgroundColor: '#1c1c1c', // optional contrast background
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Image
                source={require('../images/LogoFarmus.png')}
                style={{
                  width: 50, // smaller than container
                  height: 50,
                  borderRadius: 25, // also half
                  resizeMode: 'contain',
                }}
              />
            </View>
          </View>
          <Text style={{...styles.WelcomeText, fontFamily: 'Poppins-Medium'}}>
            Bienvenue à la ferme
          </Text>
        </View>
        <View style={styles.Bento1Right}>
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
              arrosage
            </Text>
          </View>
          <View style={styles.SwintchContainer}>
            <RNSwitch
              value={isArrosageOn}
              handleOnPress={handleSwitchToggle}
              activeTrackColor="#9DE607"
              inActiveTrackColor="gray"
              thumbColor="white"
            />
          </View>
        </View>
      </View>
      <View style={styles.Bento2Container}>
        <View style={styles.Bento2}>
          <View style={styles.Bento2Left}>
            <Text
              style={{fontFamily: 'Poppins-SemiBold', fontSize: RFValue(24)}}>
              Climatisation
            </Text>

            {data.temperature != null ? (
              <Text style={{fontFamily: 'Poppins-Bold', fontSize: RFValue(54)}}>
                {data.temperature + '°C'}
              </Text>
            ) : (
              <ActivityIndicator
                size="large"
                color="white"
                style={{padding: 26}}
              />
            )}

            <TouchableWithoutFeedback
              disabled={!autoMode} // disables this blocking layer if manual
              onPress={() => {}} // capture touches and do nothing
            >
              <View pointerEvents={autoMode ? 'none' : 'auto'}>
                <RNSwitch
                  value={isAirConditionerEnabled}
                  handleOnPress={handleAirConditionerToggle}
                  activeTrackColor="green"
                  inActiveTrackColor="gray"
                  thumbColor="white"
                />
              </View>
            </TouchableWithoutFeedback>
          </View>

          <View style={styles.Bento2Right}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Graph', {
                  text: 'temperature',
                  espId: espId,
                })
              }
              style={{
                ...styles.BtnArrowDroit,
                backgroundColor: 'black',
                marginLeft: '40%',
                marginBottom: 10,
              }}>
              <ArrowAwjaDown color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.Bento3}>
        <View style={styles.Bento3Left}>
          <View style={styles.Bento3LeftTop}>
            <View
              style={{...styles.TransparentIcone, backgroundColor: 'white'}}>
              <Icon name="cup-water" size={30} color="#8000FF" />
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Graph', {
                  text: 'water_level',
                  espId: espId,
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
              Niveau d'eau
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medium',
                fontSize: RFValue(18),
              }}>
              {data.waterLevel ?? 'Loading...'}
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
              Humidité du sol
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medium',
                fontSize: RFValue(18),
              }}>
              {data.soilMoistureValue
                ? data.soilMoistureValue + ' %'
                : 'Loading...'}
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Regular',
                fontSize: RFValue(16),
                marginTop: 4,
              }}>
              {data.soilMoisture == 0 ? 'Humide' : 'Sec'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Graph', {
                text: 'soil_moisture_value',
                espId: espId,
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
              Valeur du gaz
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medium',
                fontSize: RFValue(18),
              }}>
              {data.gasValue ? `${data.gasValue} ` : 'Loading...'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Graph', {
                text: 'gas_value',
                espId: espId,
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
                  text: 'humidity',
                  espId: espId,
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
                fontFamily: 'Poppins-Medium',
                fontSize: RFValue(18),
              }}>
              {data.humidity ? data.humidity + ' %' : 'Loading...'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.MotionDetectorContainer}>
        <View style={styles.MotionDetectorBox}>
          <Text style={styles.MotionDetectorTitle}>Détecteur de mouvement</Text>
          <RNSwitch
            value={isMotionDetectorEnabled}
            handleOnPress={handleMotionSwitchToggle}
            activeTrackColor="#FF6F61"
            inActiveTrackColor="gray"
            thumbColor="white"
          />
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
    width: (screenWidth * 17.4) / 100,
    height: (screenWidth * 17.4) / 100,
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
    marginLeft: (screenWidth * 3.5) / 100,
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
    justifyContent: 'flex-end',
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
  // Existing Bento styles...
  MotionDetectorContainer: {
    width: '100%',
    height: (screenHeight * 20) / 100,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    marginTop: (screenHeight * 3) / 100,
    padding: (screenWidth * 3) / 100,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  MotionDetectorBox: {
    backgroundColor: '#2C2C2C',
    width: '100%',
    borderRadius: 15,
    padding: (screenWidth * 4) / 100,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  MotionDetectorTitle: {
    color: '#FF6F61',
    fontSize: RFValue(20),
    fontFamily: 'Poppins-SemiBold',
    marginBottom: (screenHeight * 2) / 100,
    letterSpacing: 0.5,
  },
});
export default HomeScreen;
