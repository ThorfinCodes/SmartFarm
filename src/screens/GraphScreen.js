import React from 'react';
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

const {width} = Dimensions.get('window');
const SIZE = width;
const POINTS = 60;
const AnimatedPath = Animated.createAnimatedComponent(Path);
const SELECTION_WIDTH = width - 32;

const buildGraph = (datapoints, label) => {
  const priceList = datapoints.prices.slice(0, POINTS);
  const formattedValues = priceList.map(price => [
    parseFloat(price[0]),
    price[1],
  ]);
  const prices = formattedValues.map(value => value[0]);
  const dates = formattedValues.map(value => value[1]);

  const scaleX = scaleLinear()
    .domain([Math.min(...dates), Math.max(...dates)])
    .range([0, SIZE]);
  const scaleY = scaleLinear()
    .domain([Math.min(...prices), Math.max(...prices)])
    .range([SIZE, 0]);

  return {
    label,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    percentChange: datapoints.percent_change,
    path: parse(
      shape
        .line()
        .x(([, x]) => scaleX(x))
        .y(([y]) => scaleY(y))
        .curve(shape.curveBasis)(formattedValues) || '',
    ),
  };
};

const GraphScreen = () => {
  const route = useRoute();
  const {data} = route.params;

  const graphs = [
    {
      label: '1H',
      value: 0,
      data: buildGraph(data.data.prices.hour, 'Last Hour'),
    },
    {label: '1D', value: 1, data: buildGraph(data.data.prices.day, 'Today')},
    {
      label: '1M',
      value: 2,
      data: buildGraph(data.data.prices.month, 'Last Month'),
    },
    {
      label: '1Y',
      value: 3,
      data: buildGraph(data.data.prices.year, 'This Year'),
    },
    {
      label: 'all',
      value: 4,
      data: buildGraph(data.data.prices.all, 'All Time'),
    },
  ];

  const BUTTON_WIDTH = SELECTION_WIDTH / graphs.length;
  const translation = useVector();
  const transition = useSharedValue(0);
  const previous = useSharedValue(0);
  const current = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => {
    const previousPath = graphs[previous.value].data.path;
    const currentPath = graphs[current.value].data.path;
    return {d: mixPath(transition.value, previousPath, currentPath)};
  });

  const selectionStyle = useAnimatedStyle(() => ({
    transform: [{translateX: withTiming(BUTTON_WIDTH * current.value)}],
  }));

  return (
    <View style={styles.container}>
      <Header translation={translation} index={current} />
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
    width: SELECTION_WIDTH / 5,
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
