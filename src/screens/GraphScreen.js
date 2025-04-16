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
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const SIZE = screenWidth;
const AnimatedPath = Animated.createAnimatedComponent(Path);

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
    data: formattedValues,
  };
};

const GraphScreen = ({gasValue, humidity, soilMoisture, temperature}) => {
  const [data, setData] = useState(null);
  const [graphs, setGraphs] = useState([]);
  const route = useRoute();
  const {text} = route.params;
  const [labelWidths, setLabelWidths] = useState([]);
  const [deltaValues, setDeltaValues] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDataComplete, setIsDataComplete] = useState(true);
  const [renderFlag, setRenderFlag] = useState(false);
  // Capture label widths on layout
  const onLabelLayout = (index, event) => {
    const {width} = event.nativeEvent.layout;
    setLabelWidths(prevWidths => {
      const newWidths = [...prevWidths];
      newWidths[index] = width;
      return newWidths;
    });
  };

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

    // If data is not ready or no current path, return an empty path
    if (!isDataReady || !currentPath) {
      return {d: ''}; // Return empty path if data is not ready or no current path
    }

    // If previous path is undefined, mix the current path with itself
    if (!previousPath) {
      return {d: mixPath(transition.value, currentPath, currentPath)}; // Mix current path with itself
    }

    // If both paths are valid, mix them for animation
    return {d: mixPath(transition.value, previousPath, currentPath)}; // Mix paths for animation
  });

  const handleGraphSelection = index => {
    setCurrentIndex(index);
  };
  const selectionStyle = useAnimatedStyle(() => {
    const width = labelWidths[current.value] || 0; // Get the width of the active label
    const left = labelWidths
      .slice(0, current.value)
      .reduce((acc, width) => acc + width, 0); // Calculate the left position

    return {
      width,
      transform: [{translateX: withTiming(left)}], // Animate the position
    };
  });

  useEffect(() => {
    if (data?.values) {
      const builtGraphs = [
        {
          label: '1H',
          value: 0,
          data: Array.isArray(data.values.hour)
            ? buildGraph(data.values.hour, 'Last Hour') // This assumes `buildGraph` returns the graph data
            : {dataAvailable: false}, // If the data is not valid, set dataAvailable to false
          dataAvailable:
            Array.isArray(data.values.hour) && data.values.hour.length > 0, // Set to true if the data exists
        },
        {
          label: '1D',
          value: 1,
          data: Array.isArray(data.values.day)
            ? buildGraph(data.values.day, 'Last Day')
            : {dataAvailable: false},
          dataAvailable:
            Array.isArray(data.values.day) && data.values.day.length > 0, // Same check as for 1H
        },
        {
          label: '1W',
          value: 2,
          data: Array.isArray(data.values.week)
            ? buildGraph(data.values.week, 'Last Week')
            : {dataAvailable: false},
          dataAvailable:
            Array.isArray(data.values.week) && data.values.week.length > 0, // Same check for 1W
        },
        {
          label: '1M',
          value: 3,
          data: Array.isArray(data.values.month)
            ? buildGraph(data.values.month, 'Last Month')
            : {dataAvailable: false},
          dataAvailable:
            Array.isArray(data.values.month) && data.values.month.length > 0, // Same check for 1M
        },
      ];

      setGraphs(builtGraphs);
      console.log(builtGraphs);
      const deltaHour = data.values.hour?.length
        ? data.values.hour[data.values.hour.length - 1].value -
          data.values.hour[0].value
        : 0;
      const deltaDay = data.values.day?.length
        ? data.values.day[data.values.day.length - 1].value -
          data.values.day[0].value
        : 0;
      const deltaWeek = data.values.week?.length
        ? data.values.week[data.values.week.length - 1].value -
          data.values.week[0].value
        : 0;
      const deltaMonth = data.values.month?.length
        ? data.values.month[data.values.month.length - 1].value -
          data.values.month[0].value
        : 0;

      setDeltaValues({
        0: deltaHour,
        1: deltaDay,
        2: deltaWeek,
        3: deltaMonth,
      });

      // Check for incomplete data
      const incomplete = Object.values(data.values).some(
        val => val === 'Data Incomplete',
      );
      setIsDataComplete(!incomplete); // Update the data completion state
    }
  }, [data]);

  const sensorData = {
    Temperature: {
      name: 'Temperature',
      value: temperature !== null ? temperature.toFixed(1) : 'N/A',
      unit: '°C',
    },
    Humidity: {
      name: 'Humidity',
      value: humidity !== null ? humidity.toFixed(1) : 'N/A',
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
      value: gasValue !== null ? gasValue.toFixed(1) : 'N/A',
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

    if (!sensor) {
      console.warn('⚠️ text is undefined or empty, skipping HTTP request');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(
          'https://zany-pyrite-trollius.glitch.me/simulate-data?sensor=' +
            sensor,
        );
        const buffer = await response.arrayBuffer();
        const decodedData = msgpack.decode(new Uint8Array(buffer));

        if (decodedData && decodedData.values) {
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
        sensorDetails={selectedSensor}
        label={graphs[current.value]?.data.label}
        delta={deltaValues[currentIndex]}
      />

      <View style={{marginTop: -100}}>
        {graphs[currentIndex]?.data?.dataAvailable === false ? (
          <View
            style={{
              height: SIZE,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{fontSize: 16, color: 'gray'}}>
              Graph data not available
            </Text>
          </View>
        ) : (
          <>
            <Svg key={`graph-${currentIndex}`} width={SIZE} height={SIZE}>
              <AnimatedPath
                key={`path-${currentIndex}`}
                animatedProps={animatedProps}
                fill="transparent"
                stroke="black"
                strokeWidth={3}
              />
            </Svg>
            <Cursor
              translation={translation}
              index={current}
              graph={graphs[current.value].data}
            />
          </>
        )}
      </View>
      <View style={styles.selection}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.backgroundSelection, selectionStyle]} />
        </View>
        {graphs.map((graph, index) => (
          <Pressable
            key={graph.label}
            onPress={() => {
              handleGraphSelection(index); // Update the current graph index
              previous.value = current.value; // Set previous to current
              current.value = index; // Update current graph index
              transition.value = 0; // Reset transition value
              transition.value = withTiming(1); // Start transition animation
            }}>
            <View
              style={styles.labelContainer}
              onLayout={event => onLabelLayout(index, event)}>
              <Text style={styles.label}>{graph.label}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  backgroundSelection: {
    backgroundColor: '#dadada',
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
  selection: {
    flexDirection: 'row', // Keeps the buttons in a row
    justifyContent: 'center', // Centers the buttons horizontally
    alignItems: 'center', // Ensures buttons are vertically centered
    width: '80%',
    alignSelf: 'center', // Centers the whole selection view horizontally on the screen
    position: 'absolute', // Fixes the buttons at a specific position
    bottom: 50, // Adjust this value to control how far from the bottom you want it
  },
  labelContainer: {
    padding: 16,
    width: (screenWidth * 20) / 100,
  },
  label: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
export default GraphScreen;
