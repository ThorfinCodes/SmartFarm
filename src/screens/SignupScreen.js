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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SIGNUP_URL} from '@env';
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigation = useNavigation();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const confirmPasswordUnderline = useState(new Animated.Value(1))[0];
  const [isLoading, setIsLoading] = useState(false); // For loading state
  const [error, setError] = useState(''); // For error handling
  const emailUnderline = useState(new Animated.Value(1))[0];
  const passwordUnderline = useState(new Animated.Value(1))[0];
  const [username, setUsername] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const usernameUnderline = useState(new Animated.Value(1))[0];
  const handleFocus = type => {
    if (type === 'username') {
      setUsernameFocused(true);
      Animated.timing(usernameUnderline, {
        toValue: 2,
        duration: 150,
        useNativeDriver: false,
      }).start();
    } else if (type === 'email') {
      setEmailFocused(true);
      Animated.timing(emailUnderline, {
        toValue: 2,
        duration: 150,
        useNativeDriver: false,
      }).start();
    } else if (type === 'password') {
      setPasswordFocused(true);
      Animated.timing(passwordUnderline, {
        toValue: 2,
        duration: 150,
        useNativeDriver: false,
      }).start();
    } else if (type === 'confirmPassword') {
      setConfirmPasswordFocused(true);
      Animated.timing(confirmPasswordUnderline, {
        toValue: 2,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleBlur = type => {
    if (type === 'username') {
      setUsernameFocused(false);
      Animated.timing(usernameUnderline, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    } else if (type === 'email') {
      setEmailFocused(false);
      Animated.timing(emailUnderline, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    } else if (type === 'password') {
      setPasswordFocused(false);
      Animated.timing(passwordUnderline, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    } else if (type === 'confirmPassword') {
      setConfirmPasswordFocused(false);
      Animated.timing(confirmPasswordUnderline, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(SIGNUP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({username, email, password}),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Signup successful!');

        // 🧠 Save token + uid to AsyncStorage
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('uid', data.uid);
        await AsyncStorage.setItem('username', username);
        navigation.navigate('MyStuff', {username});
      } else {
        setError(data.message || 'An error occurred during signup.');
      }
    } catch (error) {
      setError('Failed to connect to the server. Please try again later.');
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
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#F9865B"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              onFocus={() => handleFocus('username')}
              onBlur={() => handleBlur('username')}
            />
            <Animated.View
              style={[
                styles.underline,
                {
                  height: usernameUnderline,
                  backgroundColor: usernameFocused ? '#F9865B' : '#F9865B',
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
          <View style={styles.TextZone}>
            <TextInput
              placeholder="Confirmer mot de passe"
              placeholderTextColor="#F9865B"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry
              onFocus={() => handleFocus('confirmPassword')}
              onBlur={() => handleBlur('confirmPassword')}
            />
            <Animated.View
              style={[
                styles.underline,
                {
                  height: confirmPasswordUnderline,
                  backgroundColor: confirmPasswordFocused
                    ? '#F9865B'
                    : '#F9865B',
                },
              ]}
            />

            {error && (
              <Text
                style={{
                  color: 'red',
                  bottom: (screenHeight * -6) / 100,
                  position: 'absolute',
                }}>
                {error}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.BottomBtn}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Identification')}>
            <Text
              style={{
                color: '#F9865B',
                fontFamily: 'Poppins-Medium',
                fontSize: RFValue(16),
              }}>
              déjà un compte ?
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignup} disabled={isLoading}>
            <View style={styles.Btn}>
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ArrowDroite />
              )}
            </View>
          </TouchableOpacity>
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
    position: 'absolute',
    width: '100%',
    height: '40%',
    top: (screenHeight * -5) / 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  BottomSc: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: (screenHeight * 62) / 100,
    backgroundColor: 'black',
    borderTopLeftRadius: 140,
    alignItems: 'center',
    paddingTop: (screenHeight * 4) / 100,
    gap: (screenHeight * 2.75) / 100,
    justifyContent: 'space-around',
  },
  trait: {
    width: (screenWidth * 12) / 100,
    height: (screenHeight * 1.4) / 100,
    backgroundColor: '#F9865B',
    borderRadius: 30,
    marginBottom: (screenHeight * 4.2) / 100,
  },
  input: {
    color: '#F9865B',
    fontSize: RFValue(16),
    paddingVertical: (screenHeight * 1.15) / 100,
    fontFamily: 'Poppins-Medium',
  },
  underline: {
    width: '100%',
    marginTop: (screenHeight * -0.75) / 100,
  },
  TextZone: {
    width: (screenWidth * 60) / 100,
  },
  TextZoneContainer: {
    width: '100%',
    alignItems: 'center',

    gap: (screenHeight * 3.46) / 100,
  },
  Btn: {
    backgroundColor: '#F9865B',
    height: (screenHeight * 8.4) / 100,
    width: (screenHeight * 8.4) / 100,
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
    padding: (screenHeight * 2.55) / 100,
  },
});

export default SignupScreen;
