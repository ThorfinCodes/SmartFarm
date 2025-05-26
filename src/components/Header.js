import React, {useEffect, useRef} from 'react';
import {Image, StyleSheet, Text, View, Animated} from 'react-native';

const Header = ({title, sensorDetails, delta}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [delta]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../images/LogoFarmus.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.values}>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>
            {sensorDetails.value} {sensorDetails.unit}
          </Text>
          <Text style={styles.label}>{title}</Text>
        </View>
        <View style={styles.valueContainer}>
          <Animated.Text
            style={[
              styles.value,
              styles.fixedDelta,
              {color: delta > 0 ? 'green' : 'red', opacity},
            ]}>
            {typeof delta === 'number'
              ? delta >= 0
                ? `+${delta.toFixed(2)}`
                : delta.toFixed(2)
              : '--'}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'black',
  },
  values: {
    marginTop: 50,
    marginBottom: 75,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueContainer: {
    alignItems: 'center',
    gap: 10,
  },
  value: {
    fontWeight: '500',
    fontSize: 24,
  },
  label: {
    fontSize: 18,
  },
  fixedDelta: {
    minWidth: 90,
    textAlign: 'right',
    marginRight: 10,
  },
});

export default Header;
