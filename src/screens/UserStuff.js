import React, {useState} from 'react';
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
import {useNavigation} from '@react-navigation/native';

const UserStuff = props => {
  const [zoneName, setZoneName] = useState('');
  const [zoneFocused, setZoneFocused] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [zones, setZones] = useState([]);
  const zoneUnderline = useState(new Animated.Value(1))[0];

  const {username} = props;
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

  const handleConfirm = () => {
    if (zoneName && selectedColor) {
      setZones([...zones, {name: zoneName, color: selectedColor}]);
      setZoneName('');
      setSelectedColor(null);
      setIsModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.Top}>
        <View style={styles.TopText}>
          <Text style={styles.title}>Hello,</Text>
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
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => navigation.navigate('MySubzone')}>
              <View style={[styles.Zone, {backgroundColor: item.color}]}>
                <Text style={styles.zoneText}>{item.name}</Text>
                <View style={styles.BtnZone}>
                  <ArrowAwjaDown color="white" />
                </View>
              </View>
            </TouchableOpacity>
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
              <Text style={styles.closeText}>\u2715</Text>
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
  Top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  TopText: {
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
  Zone: {
    width: '100%',
    height: 260,
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  zoneText: {
    color: 'black',
    fontFamily: 'Poppins-Bold',
    fontSize: 25,
  },
  BtnZone: {
    backgroundColor: 'black',
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    alignSelf: 'flex-end',
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
});
export default UserStuff;
