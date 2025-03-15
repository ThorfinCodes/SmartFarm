import React, {useEffect, useCallback} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

const RNSwitch = ({
  handleOnPress = () => {},
  activeTrackColor = '#007AFF',
  inActiveTrackColor = '#F2F5F7',
  thumbColor = '#FFF',
  value = false,
}) => {
  const switchTranslate = useSharedValue(value ? 21 : 0);

  useEffect(() => {
    switchTranslate.value = withSpring(value ? 21 : 0, {
      mass: 1,
      damping: 15,
      stiffness: 120,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    });
  }, [value]);

  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      switchTranslate.value,
      [0, 21],
      [inActiveTrackColor, activeTrackColor],
    ),
  }));

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{translateX: switchTranslate.value}],
  }));

  const memoizedOnSwitchPressCallback = useCallback(() => {
    handleOnPress(!value);
  }, [handleOnPress, value]);

  return (
    <Pressable onPress={memoizedOnSwitchPressCallback}>
      <Animated.View style={[styles.containerStyle, animatedTrackStyle]}>
        <Animated.View
          style={[
            styles.circleStyle,
            {backgroundColor: thumbColor},
            animatedThumbStyle,
            styles.shadowValue,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  circleStyle: {
    width: 30,
    height: 30,
    borderRadius: 24,
  },
  containerStyle: {
    width: 55,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: 36.5,
  },
  shadowValue: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
});

export default RNSwitch;
