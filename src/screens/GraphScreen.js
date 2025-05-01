import React, {useEffect, useState} from 'react';
import {Text, View, StyleSheet, Dimensions, ScrollView} from 'react-native';
import {useRoute} from '@react-navigation/native';
import msgpack from 'msgpack-lite';
import {LineChart} from 'react-native-chart-kit';
import Header from '../components/Header';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const SIZE = screenWidth;

const GraphScreen = ({gasValue, humidity, soilMoisture, temperature}) => {
  const [data, setData] = useState(null);
  const [graphs, setGraphs] = useState([]);
  const [labels, setLabels] = useState([]);
  const [deltaValues, setDeltaValues] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tapPosition, setTapPosition] = useState(null);
  const route = useRoute();
  const {text} = route.params;

  const sensorData = {
    Temperature: {
      name: 'Temperature',
      value:
        typeof temperature === 'number' && !isNaN(temperature)
          ? temperature.toFixed(1)
          : 'N/A',
      unit: '°C',
    },
    Humidity: {
      name: 'Humidity',
      value:
        typeof humidity === 'number' && !isNaN(humidity)
          ? humidity.toFixed(1)
          : 'N/A',
      unit: '%',
    },
    soil_moisture: {
      name: 'Soil Moisture',
      value:
        soilMoisture === true ? 'Wet' : soilMoisture === false ? 'Dry' : 'N/A',
      unit: '',
    },
    gas_value: {
      name: 'Gas',
      value:
        typeof gasValue === 'number' && !isNaN(gasValue)
          ? gasValue.toFixed(1)
          : 'N/A',
      unit: 'ppm',
    },
  };

  const selectedSensor = sensorData[text] || {
    name: 'Unknown',
    value: 'N/A',
    unit: '',
  };

  useEffect(() => {
    const sensor = text?.toLowerCase();
    if (!sensor) return;

    const fetchData = async () => {
      try {
        const response = await fetch(
          'http://192.168.1.41:3000/simulate-data?sensor=' + sensor,
        );
        const buffer = await response.arrayBuffer();
        const decodedData = msgpack.decode(new Uint8Array(buffer));

        if (decodedData?.values) {
          setData(decodedData);
        } else {
          console.error('🚫 No valid data received:', decodedData);
        }
      } catch (err) {
        console.error('❌ Error during fetch:', err);
      }
    };

    fetchData();
  }, [text]);

  useEffect(() => {
    if (data?.values) {
      const graphData = data.values.map(d => d.value);
      setGraphs(graphData);

      // Generate timestamps and show time every 5 points
      const timeLabels = data.values.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      });

      // Show time every 5th point
      const reducedLabels = timeLabels.map((label, i) =>
        i % 60 === 0 ? label : '',
      );

      setLabels(reducedLabels);

      const delta = graphData.length
        ? graphData[graphData.length - 1] - graphData[0]
        : 0;

      setDeltaValues(delta);
    }
  }, [data]);

  if (!data || graphs.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={selectedSensor.name}
        sensorDetails={selectedSensor}
        delta={deltaValues[currentIndex]}
      />

      <View style={styles.chartContainer}>
        <ScrollView horizontal>
          <LineChart
            data={{
              labels: labels,
              datasets: [{data: graphs}],
            }}
            width={Math.max(graphs.length * 10, SIZE)}
            height={screenHeight / 1.7}
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: () => `rgba(0, 0, 0, 1)`, // solid black line
              labelColor: () => `rgba(0, 0, 0, 1)`,
              propsForDots: {
                r: '0', // no dots
              },
              propsForBackgroundLines: {
                stroke: '#e0e0e0',
              },
              propsForLabels: {
                fontSize: 10,
              },
              propsForHorizontalLabels: {
                rotation: 30,
              },
            }}
            bezier
            style={styles.chartStyle}
          />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  chartContainer: {
    position: 'absolute',
    bottom: 0,
  },
  chartStyle: {
    borderRadius: 16,
  },
});

export default GraphScreen;
