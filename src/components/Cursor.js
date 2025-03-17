import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {getYForX} from 'react-native-redash';

import {graphs} from './Model';

const CURSOR = 50;
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
});

const Cursor = ({index, translation}) => {
  const isActive = useSharedValue(false);

  // Define the gesture handler using Gesture API
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isActive.value = true;
    })
    .onUpdate(event => {
      translation.x.value = event.x;
      translation.y.value =
        getYForX(graphs[index.value].data.path, translation.x.value) || 0;
    })
    .onEnd(() => {
      isActive.value = false;
    });

  const style = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: translation.x.value - CURSOR / 2},
        {translateY: translation.y.value - CURSOR / 2},
        {scale: withSpring(isActive.value ? 1 : 0)},
      ],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.cursor, style]}>
            <View style={styles.cursorBody} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default Cursor;
