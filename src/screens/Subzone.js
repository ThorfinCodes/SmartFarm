import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import ArrowAwjaDown from '../icones/ArrowAwjaDown.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ADD_SUBZONE_URL} from '@env';
import {useNavigation} from '@react-navigation/native';

const Subzone = props => {
  const navigation = useNavigation();
  const [zoneName, setZoneName] = useState('');
  const [zoneFocused, setZoneFocused] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const {username, route, zones, setZones} = props; // get zones and setter from props
  const {zoneId} = route.params;
  const [espId, setEspId] = useState('');

  const zoneUnderline = useState(new Animated.Value(1))[0];
  const espUnderline = useState(new Animated.Value(1))[0];

  // Get the current zone's subzones from zones prop (no local zones state)
  const subZones = React.useMemo(() => {
    const zone = zones.find(z => z.zoneId === zoneId);
    return zone && zone.subzones ? zone.subzones : [];
  }, [zones, zoneId]);

  const handleEspFocus = () => {
    Animated.timing(espUnderline, {
      toValue: 2,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleEspBlur = () => {
    Animated.timing(espUnderline, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = () => {
    setZoneFocused(true);
    Animated.timing(zoneUnderline, {
      toValue: 2,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setZoneFocused(false);
    Animated.timing(zoneUnderline, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleColorSelect = color => {
    setSelectedColor(color);
  };

  const handleConfirm = async () => {
    if (zoneName && selectedColor && espId) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const uid = await AsyncStorage.getItem('uid');

        if (!token || !uid) {
          console.warn('Missing token or uid from storage');
          return;
        }

        const response = await fetch(ADD_SUBZONE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uid: uid,
            zoneId: zoneId,
            name: zoneName,
            color: selectedColor,
            espId: espId,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const newSubZone = {
            name: zoneName,
            color: selectedColor,
            espId: espId,
            subzoneId: data.subzoneId,
          };

          // Add newSubZone under the correct zone using setZones from props
          setZones(prevZones =>
            prevZones.map(zone =>
              zone.zoneId === zoneId
                ? {
                    ...zone,
                    subzones: [...(zone.subzones || []), newSubZone],
                  }
                : zone,
            ),
          );

          setZoneName('');
          setEspId('');
          setSelectedColor(null);
          setIsModalVisible(false);
        } else {
          console.warn(
            'Failed to add subzone:',
            data.message || 'Unknown error',
          );
        }
      } catch (error) {
        console.error('Error adding subzone:', error);
      }
    } else {
      console.warn('Please fill in all required fields.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.Top}>
        <View style={styles.TopText}>
          <Text style={styles.title}>Sous zone,</Text>
          <Text style={styles.title}>{username}</Text>
        </View>
        <View style={styles.TopButtons}>
          <TouchableOpacity
            style={styles.AddBtn}
            onPress={() => setIsModalVisible(true)}>
            <Text style={styles.plus}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.AddBtn}
            onPress={() => {
              Linking.openURL(
                'https://half-cherry-kingfisher.glitch.me/index.html',
              ); // Replace with your desired URL
            }}>
            <Text style={styles.plus}>★</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.ZoneContainer}>
        {subZones.map((subZone, index) => (
          <TouchableOpacity
            key={subZone.subzoneId || index}
            onPress={() => {
              console.log('Navigating to Home with espId:', subZone.espId);
              navigation.navigate('Home', {espId: subZone.espId});
            }}
            activeOpacity={0.8}>
            <View style={[styles.Zone, {backgroundColor: subZone.color}]}>
              <Text
                style={{
                  color: 'black',
                  fontFamily: 'Poppins-Bold',
                  fontSize: 25,
                }}>
                {subZone.name}
              </Text>
              <View style={styles.BtnZone}>
                <ArrowAwjaDown color="white" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.AddZone}>
            <Pressable
              style={styles.closeBtn}
              onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>

            <View style={styles.TextZone}>
              <TextInput
                placeholder="Nom de la zone"
                placeholderTextColor="#F9865B"
                value={zoneName}
                onChangeText={setZoneName}
                style={styles.input}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <Animated.View
                style={[
                  styles.underline,
                  {
                    height: zoneUnderline,
                    backgroundColor: '#F9865B',
                  },
                ]}
              />
              <TextInput
                placeholder="ESP ID"
                placeholderTextColor="#F9865B"
                value={espId}
                onChangeText={setEspId}
                style={styles.input}
                onFocus={handleEspFocus}
                onBlur={handleEspBlur}
              />
              <Animated.View
                style={[
                  styles.underline,
                  {
                    height: espUnderline,
                    backgroundColor: '#F9865B',
                  },
                ]}
              />
            </View>

            <View style={styles.ColorContainer}>
              {['#F9865B', '#FFED48', '#8000FF', '#9DE607'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorBox,
                    {backgroundColor: color},
                    selectedColor === color && styles.selectedBox,
                    selectedColor === color && {borderColor: '#F9865B'},
                  ]}
                  onPress={() => handleColorSelect(color)}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.ConfimBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  Top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  TopText: {
    flexDirection: 'row',
    flexDirection: 'column',
  },

  AddBtn: {
    backgroundColor: 'white',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  title: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 30,
  },
  plus: {
    fontSize: 30,
    textAlign: 'center',
  },
  ZoneContainer: {
    flex: 1,
    width: '100%',
    padding: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  AddZone: {
    backgroundColor: '#222124',
    borderWidth: 1.5,
    borderColor: '#303030',
    borderRadius: 20,
    height: 450,
    width: 350,
    padding: 25,
    gap: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeText: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  TextZone: {
    width: '100%',
  },
  input: {
    color: '#F9865B',
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  underline: {
    width: '100%',
    marginTop: -5,
  },
  ColorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  colorBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  selectedBox: {
    transform: [{scale: 1.2}],
  },
  ConfimBtn: {
    width: '60%',
    height: 45,
    backgroundColor: '#F9865B',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    color: 'black',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  Zone: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  BtnZone: {
    backgroundColor: 'black',
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    marginLeft: 'auto',
  },
});

export default Subzone;
