import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
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
import data from '../components/data';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [isArrosageEnabled, setIsArrosageEnabled] = useState(false);
  const [isAirConditionerEnabled, setIsAirConditionerEnabled] = useState(false);
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
              data: data,
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
            <Text style={{fontSize: 18, fontFamily: 'Poppins-SemiBold'}}>
              Arrosage
            </Text>
            <Text
              style={{
                fontSize: 18,
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
              data: data,
              text: 'Air Conditioner',
            })
          }>
          <View style={styles.Bento2Left}>
            <Text style={{fontFamily: 'Poppins-SemiBold', fontSize: 25}}>
              Air Conditioner
            </Text>

            <Text style={{fontFamily: 'Poppins-Bold', fontSize: 55}}>28°C</Text>

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
                  data: data,
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
                fontSize: 18,
                letterSpacing: 0.2,
              }}>
              Température
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medieum',
                fontSize: 18,
              }}>
              28°C
            </Text>
          </View>
        </View>
        <View style={styles.Bento3Right}>
          <View>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-SemiBold',
                fontSize: 18,
                letterSpacing: 0.3,
              }}>
              PH Sensor
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medieum',
                fontSize: 18,
              }}>
              11 °F
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Graph', {
                data: data,
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
                fontSize: 18,
                letterSpacing: 0.3,
              }}>
              CO₂ Sensor
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medieum',
                fontSize: 18,
              }}>
              11ppm
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Graph', {
                data: data,
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
                  data: data,
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
                fontSize: 18,
                letterSpacing: 0.2,
              }}>
              Humidité
            </Text>
            <Text
              style={{
                color: 'white',
                fontFamily: 'Poppins-Medieum',
                fontSize: 18,
              }}>
              28 g/m³
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
    width: '100%',
    height: 200,
    flexDirection: 'row',
    paddingLeft: 12,
    paddingRight: 22,
    gap: 10,
  },
  Bento1Left: {
    backgroundColor: '#222124',
    width: '50%',
    height: '100%',
    borderRadius: 20,
    flexDirection: 'column',
    justifyContent: 'space-around',
    borderWidth: 1.5,
    borderColor: '#303030',
  },
  Bento1LeftTop: {
    width: '100%',
    height: '41%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  imageBento1LeftTop: {
    resizeMode: 'cover',
    borderRadius: 50,
    width: 70,
    height: 70,
  },
  Bento1Right: {
    backgroundColor: '#ACF900',
    width: '50%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'space-evenly',
  },
  TransparentIcone: {
    backgroundColor: '#303030',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    width: 70,
    height: 70,
  },
  WelcomeText: {
    color: 'white',
    fontSize: 18,
    width: '75%',
    letterSpacing: 1.2,
    paddingLeft: 12,
    marginTop: 20,
  },
  Bento1RightTop: {
    height: '41%',
    width: '100%',
    paddingLeft: 10,
    // justifyContent: 'space-between',
  },
  TransparentIconeGreen: {
    width: 70,
    height: 70,
    borderRadius: 180,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageTransparentIconeGreen: {
    width: '100%', // Prend toute la largeur du parent
    height: '100%', // Prend toute la hauteur du parent
    resizeMode: 'contain', // S'assure que l'image est contenue dans la div
    transform: [{scale: 0.6}], // Réduit la taille à 80%
  },
  faucet: {
    width: 50,
    height: 50,
  },
  GreenText: {
    paddingLeft: 12,
    gap: 0,
  },
  SwintchContainer: {
    marginLeft: '50%',
  },
  Bento2Container: {
    paddingLeft: 12,
    paddingRight: 12,
  },
  Bento2: {
    width: '100%',
    height: 260,
    backgroundColor: '#FFED48',
    borderRadius: 20,
    flexDirection: 'row',
  },
  Bento2Left: {
    height: '100%',
    width: '60%',
    paddingLeft: 10,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  Bento2Right: {
    height: '100%',
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  BtnArrowDroit: {
    backgroundColor: 'white',
    height: 65,
    width: 65,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  Bento3: {
    width: '100%',
    height: 240,
    gap: 10,
    flexDirection: 'row',
    paddingLeft: 10,
    paddingRight: 10,
    paddingRight: 20,
  },
  Bento3Left: {
    backgroundColor: '#8000FF',
    height: '100%',
    width: '60%',
    borderRadius: 20,
    justifyContent: 'space-between',
  },
  Bento3LeftTop: {
    width: '100%',
    height: '45%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  TextBento3Left: {
    justifyContent: 'center',
    paddingLeft: 10,
    paddingBottom: 23,
  },
  Bento3Right: {
    backgroundColor: '#222124',
    height: '100%',
    width: '40%',
    borderRadius: 20,
    justifyContent: 'space-around',
    paddingLeft: 12,
    borderWidth: 1.5,
    borderColor: '#303030',
  },
  Bento4: {
    width: '100%',
    height: 240,
    gap: 10,
    flexDirection: 'row',
    paddingLeft: 10,
    paddingRight: 10,
    paddingRight: 20,
  },
  Bento4Left: {
    backgroundColor: '#222124',
    height: '100%',
    width: '40%',
    borderRadius: 20,
    justifyContent: 'space-around',
    paddingLeft: 12,
    borderWidth: 1.5,
    borderColor: '#303030',
  },
  Bento4Right: {
    backgroundColor: '#F9865B',
    height: '100%',
    width: '60%',
    borderRadius: 20,
    justifyContent: 'space-between',
  },
  Bento4RightTop: {
    width: '100%',
    height: '45%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  TextBento4Right: {
    justifyContent: 'center',
    paddingLeft: 10,
    paddingBottom: 23,
  },
});
export default HomeScreen;
