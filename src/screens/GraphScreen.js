import React, {useEffect, useState} from 'react';
import {Text, View, StyleSheet, Dimensions, ScrollView} from 'react-native';
import {useRoute} from '@react-navigation/native';
import msgpack from 'msgpack-lite';
import {LineChart} from 'react-native-chart-kit';
import Header from '../components/Header';
import {SIMULATE_DATA_URL} from '@env';
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const SIZE = screenWidth;

const GraphScreen = ({espData}) => {
  const [data, setData] = useState(null);

  const [graphs, setGraphs] = useState([]);
  const [labels, setLabels] = useState([]);
  const [delta, setDelta] = useState();
  const [currentIndex, setCurrentIndex] = useState(0);

  const route = useRoute();
  const {text, espId} = route.params;
  const simpleData = espData[espId] || {};
  const sensorData = {
    Temperature: {
      name: 'Temperature',
      value:
        typeof simpleData.temperature === 'number' &&
        !isNaN(simpleData.temperature)
          ? simpleData.temperature.toFixed(1)
          : 'N/A',
      unit: '°C',
    },
    Humidity: {
      name: 'Humidity',
      value:
        typeof simpleData.humidity === 'number' && !isNaN(simpleData.humidity)
          ? simpleData.humidity.toFixed(1)
          : 'N/A',
      unit: '%',
    },
    soil_moisture: {
      name: 'Soil Moisture',
      value:
        simpleData.soilMoisture === 50
          ? 'Wet'
          : simpleData.soilMoisture === 0
          ? 'Dry'
          : 'N/A',
      unit: '',
    },
    gas_value: {
      name: 'Gas',
      value:
        typeof simpleData.gasValue === 'number' && !isNaN(simpleData.gasValue)
          ? simpleData.gasValue.toFixed(1)
          : 'N/A',
      unit: 'ppm',
    },
  };

  const selectedSensor = sensorData[text] || {
    name: 'Unknown',
    value: 'N/A',
    unit: '',
  };
  console.log('esp data:', simpleData);
  console.log('esp id:', espId);
  console.log('data:', selectedSensor);
  useEffect(() => {
    const sensor = text?.toLowerCase();
    if (!sensor) return;

    const fetchData = async () => {
      try {
        const url = `${SIMULATE_DATA_URL}?sensor=${encodeURIComponent(
          sensor,
        )}&espId=${encodeURIComponent(espId)}`;
        console.log('✅ Final URL:', url);

        const response = await fetch(url);
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

      const timeLabels = data.values.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      });

      const reducedLabels = timeLabels.map((label, i) =>
        i % 60 === 0 ? label : '',
      );

      setLabels(reducedLabels);

      const deltaValue = graphData.length
        ? graphData[graphData.length - 1] - graphData[0]
        : 0;

      setDelta(deltaValue);
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
        delta={delta}
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
