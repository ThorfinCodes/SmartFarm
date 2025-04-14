import React, {useEffect, useState} from 'react';
import {Text, View, StyleSheet, Dimensions, Pressable} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {mixPath, useVector} from 'react-native-redash';
import * as shape from 'd3-shape';
import {scaleLinear} from 'd3-scale';
import {parse} from 'react-native-redash';
import Header from '../components/Header';
import Cursor from '../components/Cursor';
import {useRoute} from '@react-navigation/native';
import msgpack from 'msgpack-lite';

const {width} = Dimensions.get('window');
const SIZE = width;
const AnimatedPath = Animated.createAnimatedComponent(Path);
const SELECTION_WIDTH = width - 32;

const buildGraph = (datapoints, label) => {
  // Format the data to extract the temperature and timestamp
  const formattedValues = datapoints.map(price => [
    parseFloat(price.value), // Extract temperature as a number
    new Date(price.timestamp).getTime(), // Convert timestamp to milliseconds if needed
  ]);

  const values = formattedValues.map(value => value[0]); // Array of temperature values
  const dates = formattedValues.map(value => value[1]); // Array of timestamps

  // Create scaling functions for the X (time) and Y (temperature) axes
  const scaleX = scaleLinear()
    .domain([Math.min(...dates), Math.max(...dates)]) // Scale by timestamps (numeric values)
    .range([0, SIZE]);

  const scaleY = scaleLinear()
    .domain([Math.min(...values), Math.max(...values)]) // Scale by temperature
    .range([SIZE, 0]);

  return {
    label,
    minPrice: Math.min(...values),
    maxPrice: Math.max(...values),

    path: parse(
      shape
        .line()
        .x(([, x]) => scaleX(x)) // X position mapped to timestamp
        .y(([y]) => scaleY(y)) // Y position mapped to temperature
        .curve(shape.curveBasis)(formattedValues) || '', // Creating path with smooth curve
    ),
  };
};

const GraphScreen = () => {
  const [data, setData] = useState(null);
  const [graphs, setGraphs] = useState([]);
  const route = useRoute();
  const {text} = route.params;

  const BUTTON_WIDTH = SELECTION_WIDTH / Math.max(graphs.length, 1);
  const translation = useVector();
  const transition = useSharedValue(0);
  const previous = useSharedValue(0);
  const current = useSharedValue(0);

  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    if (graphs.length > 0) {
      setIsDataReady(true); // Set data as ready once graphs are populated
    }
  }, [graphs]); // This triggers when graphs data changes

  const animatedProps = useAnimatedProps(() => {
    const previousPath = graphs[previous.value]?.data?.path;
    const currentPath = graphs[current.value]?.data?.path;

    // Disable animation if data is not ready yet
    if (!isDataReady || !previousPath || !currentPath) {
      return {d: ''}; // No transition while data isn't ready
    }

    return {d: mixPath(transition.value, previousPath, currentPath)};
  });

  const selectionStyle = useAnimatedStyle(() => ({
    transform: [{translateX: withTiming(BUTTON_WIDTH * current.value)}],
  }));

  useEffect(() => {
    if (data?.values) {
      const builtGraphs = [
        {
          label: '1H',
          value: 0,
          data: buildGraph(data.values.hour, 'Last Hour'),
        },
        {
          label: '1D',
          value: 1,
          data: buildGraph(data.values.day, 'Last Day'),
        },
        {
          label: '1W',
          value: 2,
          data: buildGraph(data.values.week, 'Last Week'),
        },
        {
          label: '1M',
          value: 3,
          data: buildGraph(data.values.month, 'Last Month'),
        },
      ];
      setGraphs(builtGraphs);
    }
  }, [data]);
  const sensorData = {
    Temperature: {name: 'Temperature', value: 23, unit: '°C'},
    Humidity: {name: 'Humidity', value: 45, unit: '%'},
    'CO2 Sensor': {name: 'CO2', value: 400, unit: 'ppm'},
    'PH Sensor': {name: 'PH Level', value: 6.5, unit: ''},
    Arrosage: {name: 'Arrosage', value: 'Active', unit: ''},
    'Air Conditioner': {name: 'Air Conditioner', value: 'Off', unit: ''},
  };
  const selectedSensor = sensorData[text] || {
    name: 'Unknown',
    value: 'N/A',
    unit: '',
  };
  useEffect(() => {
    console.log('🔥 useEffect triggered with text:', text);
    const sensor = text?.toLowerCase();

    if (!sensor) {
      console.warn(
        '⚠️ text is undefined or empty, skipping WebSocket connection',
      );
      return;
    }

    console.log(
      '📡 Connecting to WebSocket server for simulated data on port 3004',
    );

    const socket = new WebSocket('ws://192.168.1.37:3004');

    socket.onopen = () => {
      console.log('✅ WebSocket connection established');
      socket.send(
        JSON.stringify({
          sensor: sensor,
        }),
      );
    };

    socket.onmessage = event => {
      console.log('📥 Message received from WebSocket');
      try {
        const decodedData = msgpack.decode(new Uint8Array(event.data));
        if (decodedData && decodedData.values) {
          setData(decodedData);
          console.log(decodedData);
        } else {
          console.error('🚫 No valid data received:', decodedData);
        }
      } catch (err) {
        console.error('❌ MessagePack Decoding Error:', err);
      }
    };

    socket.onclose = () => console.log('⚠️ WebSocket connection closed');
    socket.onerror = err => console.error('❌ WebSocket error:', err);

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
        console.log('⚠️ WebSocket connection closed during cleanup');
      }
    };
  }, [text]);

  // 🔁 After all hooks: safe to conditionally render
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
        index={current}
        sensorDetails={selectedSensor}
      />
      <View style={{marginTop: -50}}>
        <Svg width={SIZE} height={SIZE}>
          <AnimatedPath
            animatedProps={animatedProps}
            fill="transparent"
            stroke="black"
            strokeWidth={3}
          />
        </Svg>
        <Cursor translation={translation} index={current} />
      </View>
      <View style={styles.selection}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.backgroundSelection, selectionStyle]} />
        </View>
        {graphs.map((graph, index) => (
          <Pressable
            key={graph.label}
            onPress={() => {
              previous.value = current.value;
              transition.value = 0;
              current.value = index;
              transition.value = withTiming(1);
            }}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>{graph.label}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'white'},
  backgroundSelection: {
    backgroundColor: '#f3f3f3',
    ...StyleSheet.absoluteFillObject,
    width: SELECTION_WIDTH / 4,
    borderRadius: 8,
  },
  selection: {
    flexDirection: 'row',
    width: SELECTION_WIDTH,
    alignSelf: 'center',
  },
  labelContainer: {padding: 16, width: SELECTION_WIDTH / 5},
  label: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
export default GraphScreen;
