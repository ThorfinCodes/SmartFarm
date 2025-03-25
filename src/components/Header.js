import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {useDerivedValue} from 'react-native-reanimated';
import {round} from 'react-native-redash';

import {graphs} from './Model';

const Header = ({title, index, sensorDetails}) => {
  const data = useDerivedValue(() => graphs[index.value].data);

  const percentChange = useDerivedValue(
    () => `${round(data.value.percentChange, 3)}%`,
  );
  const label = useDerivedValue(() => data.value.label);

  return (
    <View style={styles.container}>
      <Image
        source={require('../images/avatar.png')}
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
          <Text
            style={[
              styles.value,
              {color: data.value.percentChange > 0 ? 'green' : 'red'},
            ]}>
            {percentChange.value}
          </Text>
          <Text style={styles.label}>{label.value}</Text>
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
  },
  values: {
    marginTop: 50,
    marginBottom: 75,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueContainer: {
    gap: 10,
  },
  value: {
    fontWeight: '500',
    fontSize: 24,
  },
  label: {
    fontSize: 18,
  },
});

export default Header;
