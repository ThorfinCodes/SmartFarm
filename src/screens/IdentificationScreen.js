import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Image,
  TextInput,
  Animated,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import ArrowDroite from '../icones/ArrowDroite.svg';
import {useNavigation} from '@react-navigation/native';
import {RFValue} from 'react-native-responsive-fontsize';
import auth, {
  getAuth,
  signInWithEmailAndPassword,
} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const IdentificationScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigation = useNavigation();

  const emailUnderline = useState(new Animated.Value(1))[0];
  const passwordUnderline = useState(new Animated.Value(1))[0];

  const handleFocus = type => {
    if (type === 'email') {
      setEmailFocused(true);
      Animated.timing(emailUnderline, {
        toValue: 2,
        duration: 150,
        useNativeDriver: false,
      }).start();
    } else {
      setPasswordFocused(true);
      Animated.timing(passwordUnderline, {
        toValue: 2,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleBlur = type => {
    if (type === 'email') {
      setEmailFocused(false);
      Animated.timing(emailUnderline, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    } else {
      setPasswordFocused(false);
      Animated.timing(passwordUnderline, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Log the credentials (for debugging purposes only)
      console.log('User credentials:', {email, password});

      // Firebase authentication
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Get ID token
      const token = await user.getIdToken();

      // Log token and UID
      console.log('Login successful!');
      console.log('User Email:', user.email);
      console.log('UID:', user.uid);

      console.log('Token:', token);

      // 🧠 Save token + uid to AsyncStorage
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('uid', user.uid);

      // Navigate to your desired screen
      navigation.navigate('MyStuff');
    } catch (err) {
      console.error('Error during login:', err);
      setError('Email ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.TopSc}>
        <Image
          source={require('../images/LogoFarmus.png')}
          style={styles.image}
        />
      </View>
      <View style={styles.BottomSc}>
        <View style={styles.trait}></View>

        <View style={styles.TextZoneContainer}>
          <View style={styles.TextZone}>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#F9865B"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              onFocus={() => handleFocus('email')}
              onBlur={() => handleBlur('email')}
            />
            <Animated.View
              style={[
                styles.underline,
                {
                  height: emailUnderline,
                  backgroundColor: emailFocused ? '#F9865B' : '#F9865B',
                },
              ]}
            />
          </View>
          <View style={styles.TextZone}>
            <TextInput
              placeholder="Mot de passe"
              placeholderTextColor="#F9865B"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
            />
            <Animated.View
              style={[
                styles.underline,
                {
                  height: passwordUnderline,
                  backgroundColor: passwordFocused ? '#F9865B' : '#F9865B',
                },
              ]}
            />
          </View>
        </View>
        {error ? (
          <Text
            style={{
              color: 'red',
              fontFamily: 'Poppins-Regular',
              marginTop: 10,
            }}>
            {error}
          </Text>
        ) : null}
        <View style={styles.BottomBtn}>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text
              style={{
                color: '#F9865B',
                fontFamily: 'Poppins-Medium',
                fontSize: RFValue(16),
              }}>
              Première fois ici ?
            </Text>
          </TouchableOpacity>
          <View style={styles.Btn}>
            <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ArrowDroite />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Image
        source={require('../images/Demicircle.png')}
        style={{
          position: 'absolute',
          top: (screenHeight * 6.75) / 100,
          left: (screenWidth * -28) / 100,
          width: (screenWidth * 49) / 100,
          height: (screenWidth * 24.5) / 100,
          resizeMode: 'contain',
          transform: [{scaleX: -1}, {scaleY: -1}],
        }}
      />
      <Image
        source={require('../images/Demicircle.png')}
        style={{
          position: 'absolute',
          top: (screenHeight * 19.2) / 100,
          left: (screenWidth * 75) / 100,
          width: (screenWidth * 49) / 100,
          height: (screenWidth * 24.5) / 100,
          resizeMode: 'contain',
          transform: [{rotate: '-90deg'}],
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9865B',
  },
  TopSc: {
    width: '100%',
    height: '55%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  BottomSc: {
    bottom: 0,
    position: 'absolute',
    width: '100%',
    height: (screenHeight * 45) / 100,
    backgroundColor: 'black',
    borderTopLeftRadius: 140,
    alignItems: 'center',
    paddingTop: 30,
    gap: 20,
    justifyContent: 'space-around',
  },
  trait: {
    width: 50,
    height: 10,
    backgroundColor: '#F9865B',
    borderRadius: 30,
    marginBottom: 30,
  },
  input: {
    color: '#F9865B',
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: 'Poppins-Medium',
  },
  underline: {
    width: '100%',
    marginTop: -5,
  },
  TextZone: {
    width: '60%',
  },
  TextZoneContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 25,
  },
  Btn: {
    backgroundColor: '#F9865B',
    height: 60,
    width: 60,
    borderRadius: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{rotate: '90deg'}],
  },
  BottomBtn: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
});

export default IdentificationScreen;
