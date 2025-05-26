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
  FlatList,
} from 'react-native';
import ArrowAwjaDown from '../icones/ArrowAwjaDown.svg';
import {useNavigation, useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ADD_ZONE_URL} from '@env';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ToastAndroid, Platform} from 'react-native';
import {DELETE_ZONE_URL} from '@env';
const UserStuff = props => {
  const [zoneName, setZoneName] = useState('');
  const [zoneFocused, setZoneFocused] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();

  const routeUsername = route.params?.username;
  const {username: propUsername, zones, setZones} = props;

  const username = routeUsername || propUsername;
  console.log(DELETE_ZONE_URL);
  const zoneUnderline = useState(new Animated.Value(1))[0];
  const handleDelete = async zoneId => {
    if (!zoneId) {
      ToastAndroid.show('Zone ID is required.', ToastAndroid.SHORT);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const uid = await AsyncStorage.getItem('uid');

      if (!token || !uid) {
        ToastAndroid.show('Missing token or uid', ToastAndroid.SHORT);
        return;
      }

      const response = await fetch(DELETE_ZONE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({uid, zoneId}),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setZones(prevZones => prevZones.filter(zone => zone.zoneId !== zoneId));
        ToastAndroid.show('Zone deleted successfully.', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(
          data.message || 'Failed to delete zone.',
          ToastAndroid.SHORT,
        );
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      ToastAndroid.show('Error deleting zone.', ToastAndroid.SHORT);
    }
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
    if (zoneName && selectedColor) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const uid = await AsyncStorage.getItem('uid');

        const response = await fetch(ADD_ZONE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uid,
            name: zoneName,
            color: selectedColor,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Zone added on server:', data);

          // Show success toast (Android only)
          if (Platform.OS === 'android') {
            ToastAndroid.show('Zone added successfully!', ToastAndroid.SHORT);
          }

          setZones([
            ...zones,
            {name: zoneName, color: selectedColor, zoneId: data.zoneId},
          ]);

          setZoneName('');
          setSelectedColor(null);
          setIsModalVisible(false);
        } else {
          const errorText = await response.text();

          // Show error toast (Android only)
          if (Platform.OS === 'android') {
            ToastAndroid.show(`Server error: ${errorText}`, ToastAndroid.LONG);
          }
          console.error('Server error:', response.statusText);
        }
      } catch (error) {
        console.error('Network or AsyncStorage error:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Zone Management</Text>
      </View>
      <View style={styles.Top}>
        <View style={styles.TopText}>
          <Text style={styles.title}>Hello, </Text>
          <Text style={styles.title}>{username}</Text>
        </View>
        <TouchableOpacity
          style={styles.AddBtn}
          onPress={() => setIsModalVisible(true)}>
          <Text style={styles.plus}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ZoneContainer}>
        <FlatList
          data={zones}
          keyExtractor={item => item.zoneId.toString()}
          renderItem={({item}) => (
            <View style={[styles.Zone, {backgroundColor: item.color}]}>
              <View style={styles.zoneHeader}>
                <Text style={styles.zoneText}>{item.name}</Text>
                <View style={styles.subzoneCountBadge}>
                  <Text style={styles.subzoneCountText}>
                    {item.subzones ? item.subzones.length : 0}
                  </Text>
                  <Icon
                    name="leaf"
                    size={16}
                    color="white"
                    style={styles.subzoneIcon}
                  />
                </View>
              </View>
              {/* Subzone names list */}

              {item.subzones && item.subzones.length > 0 && (
                <View style={styles.subzoneList}>
                  {item.subzones.slice(0, 3).map((subzone, index) => (
                    <View key={index} style={styles.subzoneItem}>
                      <View
                        style={[
                          styles.subzoneBullet,
                          {backgroundColor: item.color},
                        ]}
                      />
                      <Text style={styles.subzoneName}>{subzone.name}</Text>
                    </View>
                  ))}
                  {item.subzones.length > 3 && (
                    <Text style={styles.moreSubzonesText}>
                      +{item.subzones.length - 3} more...
                    </Text>
                  )}
                </View>
              )}
              <View style={styles.BtnZoneRow}>
                <TouchableOpacity
                  onPress={() => handleDelete(item.zoneId)}
                  style={styles.iconDeleteWrapper}>
                  <Icon name="trash-can-outline" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('MySubzone', {zoneId: item.zoneId})
                  }>
                  <View style={styles.iconArrowWrapper}>
                    <ArrowAwjaDown color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

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
  headerTitleContainer: {
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 0,
  },
  headerTitle: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    alignSelf: 'center',
  },
  Top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    marginBottom: 10,
  },
  TopText: {
    flexDirection: 'row',
  },
  AddBtn: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  title: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 25,
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
  Zone: {
    width: '100%',
    height: 280,
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
    elevation: 6, // Android
    shadowColor: '#000', // iOS
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  zoneText: {
    color: 'black',
    fontFamily: 'Poppins-Bold',
    fontSize: 25,
  },
  BtnZoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    gap: 10, // Adjust space between icons
  },
  iconArrowWrapper: {
    backgroundColor: 'black',
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  iconDeleteWrapper: {
    backgroundColor: 'black',
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
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
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },

  subzoneCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  subzoneCountText: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    marginRight: 5,
  },

  subzoneIcon: {
    marginLeft: 3,
  },

  subzoneList: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 8,
    marginBottom: 45,
  },

  subzoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },

  subzoneBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    opacity: 0.8,
  },

  subzoneName: {
    color: 'black',
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 8,
    flex: 1,
  },

  moreSubzonesText: {
    color: 'black',
    fontFamily: 'Poppins-Italic',
    fontSize: 13,
    marginTop: 4,
    alignSelf: 'center',
  },
});
export default UserStuff;
