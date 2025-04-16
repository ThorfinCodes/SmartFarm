import React, {useState} from 'react';
import {View, StyleSheet, Dimensions, Text} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {getYForX} from 'react-native-redash';

const {width: screenWidth} = Dimensions.get('window');
const CURSOR = 50;

const Cursor = ({translation, graph}) => {
  const isActive = useSharedValue(false);

  const [labelTime, setLabelTime] = useState('');
  const [labelValue, setLabelValue] = useState('');

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isActive.value = true;
    })
    .onUpdate(event => {
      const x = event.x;
      translation.x.value = x;

      const y = getYForX(graph?.path, x) || 0;
      translation.y.value = y;

      if (graph?.data && graph.data.length > 0) {
        const screenXToTimestamp = screenX => {
          const [minTime, maxTime] = [
            Math.min(...graph.data.map(d => d[1])),
            Math.max(...graph.data.map(d => d[1])),
          ];
          return minTime + (screenX / screenWidth) * (maxTime - minTime);
        };

        const currentTimestamp = screenXToTimestamp(x);

        const closest = graph.data.reduce((prev, curr) => {
          return Math.abs(curr[1] - currentTimestamp) <
            Math.abs(prev[1] - currentTimestamp)
            ? curr
            : prev;
        });

        if (closest) {
          runOnJS(setLabelTime)(new Date(closest[1]).toLocaleTimeString());
          runOnJS(setLabelValue)(closest[0].toFixed(2));
        }
      }
    })
    .onEnd(() => {
      isActive.value = false;
    });

  const cursorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: translation.x.value - CURSOR / 2},
        {translateY: translation.y.value - CURSOR / 2},
        {scale: withSpring(isActive.value ? 1 : 0)},
      ],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: translation.x.value - 50,
      top: translation.y.value - 100,
      opacity: withSpring(isActive.value ? 1 : 0),
    };
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFill}>
          {/* Label */}
          <Animated.View style={labelStyle}>
            <View style={styles.labelContainer}>
              <View style={styles.labelBox}>
                <Text style={styles.labelText}>{labelTime}</Text>
              </View>
              <View style={styles.labelBox}>
                <Text style={styles.labelText}>{labelValue}°</Text>
              </View>
            </View>
          </Animated.View>

          {/* Cursor */}
          <Animated.View style={[styles.cursor, cursorStyle]}>
            <View style={styles.cursorBody} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  cursor: {
    width: CURSOR,
    height: CURSOR,
    borderRadius: CURSOR / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cursorBody: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'black',
  },
  labelContainer: {
    gap: 6, // spacing between time and value
    alignItems: 'center',
  },
  labelBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2, // For Android
  },

  labelText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Cursor;
