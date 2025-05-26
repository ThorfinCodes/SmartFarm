import React, {useEffect, useState, useCallback} from 'react';
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
import {ADD_SUBZONE_URL, DELETE_SUBZONE_URL} from '@env';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ToastAndroid, Platform} from 'react-native';
import {SUBMIT_REPORT_URL} from '@env';
const SubzoneItem = React.memo(
  ({subZone, data, username, navigation, onDelete}) => {
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [issueDescription, setIssueDescription] = useState('');

    const handleReportSubmit = async () => {
      const uid = await AsyncStorage.getItem('uid');
      const reportData = {
        uid: uid,
        name: username,
        espId: subZone.espId,
        espName: subZone.name,
        msg: issueDescription,
        timestamp: new Date().toISOString(),
      };

      console.log('Report submitted:', reportData);

      // Close modal and reset description
      setIsReportModalVisible(false);
      setIssueDescription('');

      try {
        const idToken = await AsyncStorage.getItem('userToken'); // Firebase Auth token

        const response = await fetch(SUBMIT_REPORT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(reportData),
        });

        const data = await response.json();

        if (data.success) {
          console.log('Report successfully sent:', data.notificationId);
          if (Platform.OS === 'android') {
            ToastAndroid.show('Report submitted', ToastAndroid.SHORT);
          }
        } else {
          console.warn('Report failed:', data.message);
          if (Platform.OS === 'android') {
            ToastAndroid.show('Failed to submit report', ToastAndroid.SHORT);
          }
        }
      } catch (error) {
        console.error('Error submitting report:', error);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Error submitting report', ToastAndroid.SHORT);
        }
      }
    };
    return (
      <View style={[styles.Zone, {backgroundColor: subZone.color}]}>
        <View style={styles.top}>
          <Text style={styles.zoneName}>{subZone.name}</Text>
          <TouchableOpacity
            style={styles.reportButtonIcon}
            onPress={() => setIsReportModalVisible(true)}>
            <Icon name="alert-circle-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
        {data ? (
          <View style={styles.sensorContainer}>
            {/* First row with two items (temperature and cloud) */}
            <View style={styles.sensorRow}>
              <View style={styles.sensorItem}>
                <Icon name="thermometer" size={15} color="black" />
                <Text style={styles.sensorText}>{data.temperature}°C</Text>
              </View>
              <View style={styles.sensorItem}>
                <Icon name="cloud" size={15} color="black" />
                <Text style={styles.sensorText}>{data.gasValue}</Text>
              </View>
            </View>

            {/* Second row with three items (leaf, water cup, humidity) */}
            <View style={styles.sensorRow}>
              <View style={styles.sensorItem}>
                <Icon name="leaf" size={15} color="black" />
                <Text style={styles.sensorText}>{data.soilMoistureValue}%</Text>
              </View>
              <View style={styles.sensorItem}>
                <Icon name="cup-water" size={20} color="black" />
                <Text style={styles.sensorText}>{data.waterLevel || '--'}</Text>
              </View>
              <View style={styles.sensorItem}>
                <Icon name="water" size={15} color="black" />
                <Text style={styles.sensorText}>{data.humidity}%</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.sensorText}>No data available</Text>
        )}
        <Modal
          visible={isReportModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsReportModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.reportModal}>
              <Text style={styles.reportTitle}>Report Issue</Text>

              <View style={styles.reportInfo}>
                <Text style={styles.reportLabel}>ESP ID:</Text>
                <Text style={styles.reportValue}>{subZone.espId}</Text>
              </View>

              <View style={styles.reportInfo}>
                <Text style={styles.reportLabel}>Name:</Text>
                <Text style={styles.reportValue}>{subZone.name}</Text>
              </View>

              <TextInput
                style={styles.issueInput}
                placeholder="Describe the issue..."
                placeholderTextColor="#888"
                multiline
                numberOfLines={4}
                value={issueDescription}
                onChangeText={setIssueDescription}
              />

              <View style={styles.reportButtons}>
                <TouchableOpacity
                  style={[styles.reportButton, styles.cancelButton]}
                  onPress={() => setIsReportModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reportButton, styles.submitButton]}
                  onPress={handleReportSubmit}>
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Action Buttons */}
        <View style={styles.BtnZoneRow}>
          <TouchableOpacity
            onPress={() => onDelete(subZone.subzoneId)}
            style={styles.iconDeleteWrapper}>
            <Icon name="trash-can-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home', {espId: subZone.espId})}>
            <View style={styles.iconArrowWrapper}>
              <ArrowAwjaDown color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  },

  (prevProps, nextProps) => {
    return (
      prevProps.subZone === nextProps.subZone &&
      prevProps.data === nextProps.data
    );
  },
);
const Subzone = ({username, route, zones, setZones, espData}) => {
  const navigation = useNavigation();
  const [zoneName, setZoneName] = useState('');
  const [zoneFocused, setZoneFocused] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  // get zones and setter from props
  const {zoneId} = route.params;
  const [espId, setEspId] = useState('');

  const zoneUnderline = useState(new Animated.Value(1))[0];
  const espUnderline = useState(new Animated.Value(1))[0];

  // Get the current zone's subzones from zones prop (no local zones state)
  const subZones = React.useMemo(() => {
    const zone = zones.find(z => z.zoneId === zoneId);
    return zone && zone.subzones ? zone.subzones : [];
  }, [zones, zoneId]);
  const handleDelete = useCallback(
    async espId => {
      const uid = await AsyncStorage.getItem('uid');
      const token = await AsyncStorage.getItem('userToken');

      if (!uid || !zoneId || !espId || !token) {
        console.error('Missing required delete parameters');
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            'Missing parameters for delete.',
            ToastAndroid.SHORT,
          );
        }
        return;
      }

      try {
        const res = await fetch(DELETE_SUBZONE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({uid, zoneId, espId}),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('Failed to delete subzone:', data.message);
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              `Delete failed: ${data.message}`,
              ToastAndroid.LONG,
            );
          }
          return;
        }

        console.log('Subzone deleted successfully:', data.subzoneId);
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            'Subzone deleted successfully!',
            ToastAndroid.SHORT,
          );
        }

        // Update local UI by removing the deleted subzone
        setZones(prevZones =>
          prevZones.map(zone => {
            if (zone.zoneId !== zoneId) return zone;
            return {
              ...zone,
              subzones: zone.subzones.filter(
                subzone => subzone.espId !== espId,
              ),
            };
          }),
        );
      } catch (error) {
        console.error('Error deleting subzone:', error);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Error deleting subzone.', ToastAndroid.LONG);
        }
      }
    },
    [zoneId, setZones],
  );
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
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              'Authentication data missing. Please login again.',
              ToastAndroid.LONG,
            );
          }
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

          if (Platform.OS === 'android') {
            ToastAndroid.show(
              'Subzone added successfully!',
              ToastAndroid.SHORT,
            );
          }
        } else {
          console.warn(
            'Failed to add subzone:',
            data.message || 'Unknown error',
          );
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              `Failed to add subzone: ${data.message || 'Unknown error'}`,
              ToastAndroid.LONG,
            );
          }
        }
      } catch (error) {
        console.error('Error adding subzone:', error);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Error adding subzone.', ToastAndroid.LONG);
        }
      }
    } else {
      console.warn('Please fill in all required fields.');
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          'Please fill in all required fields.',
          ToastAndroid.SHORT,
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Sub Zone Management</Text>
      </View>

      <View style={styles.Top}>
        <View style={styles.TopText}>
          <Text style={styles.title}>{username}</Text>
        </View>
        <View style={styles.TopButtons}>
          {/* Buy ESP Button - placed left of the add button */}
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => {
              Linking.openURL(
                'https://half-cherry-kingfisher.glitch.me/index.html',
              );
            }}>
            <Icon name="cart" size={24} color="black" />
          </TouchableOpacity>

          {/* Add Subzone Button */}
          <TouchableOpacity
            style={styles.AddBtn}
            onPress={() => setIsModalVisible(true)}>
            <Text style={styles.plus}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.ZoneContainer}
        keyboardShouldPersistTaps="handled">
        {subZones.map((subZone, index) => (
          <SubzoneItem
            key={subZone.subzoneId}
            subZone={subZone}
            data={espData[subZone.espId]}
            username={username}
            navigation={navigation}
            onDelete={() => handleDelete(subZone.espId)}
          />
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
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 5,
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
    flexDirection: 'column',
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
    fontSize: 30,
  },
  buyBtn: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  buyButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginLeft: 10,
  },
  TopButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15, // Space between buttons
  },

  buyBtn: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
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

  zoneName: {
    color: 'black',
    fontFamily: 'Poppins-Bold',
    fontSize: 25,
  },
  sensorContainer: {
    marginVertical: 0,
    alignItems: 'center', // This will center all rows
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Center items in the row
    marginVertical: 5,
    width: '80%', // Reduce the width to bring items closer
  },
  sensorItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%', // Adjust width to fit the reduced row width
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    marginHorizontal: 5, // Add some horizontal spacing
  },
  sensorItemCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  sensorItemCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '20%',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    bottom: '50%',
  },
  sensorText: {
    color: 'black',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    marginTop: 5,
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
    height: 'auto',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between', // This will push content to top and buttons to bottom
    marginBottom: 20,
  },
  BtnZoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto', // This will push the row to the bottom
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  reportModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
  },

  reportTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: 20,
    color: 'black',
    textAlign: 'center',
  },

  reportInfo: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  reportLabel: {
    fontFamily: 'Poppins-SemiBold',
    color: 'black',
    width: 80,
  },

  reportValue: {
    fontFamily: 'Poppins-Regular',
    color: 'black',
    flex: 1,
  },

  issueInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginVertical: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'Poppins-Regular',
  },

  reportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportButtonIcon: {padding: 8, borderRadius: 8, width: '13.75%'},
  reportButton: {
    padding: 8,
    borderRadius: 8,
    width: '48%',
  },

  cancelButton: {
    backgroundColor: '#e0e0e0',
  },

  submitButton: {
    backgroundColor: '#F9865B',
  },

  buttonText: {
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
  },
});

export default Subzone;
