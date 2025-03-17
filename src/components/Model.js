/* eslint-disable camelcase */
import * as shape from 'd3-shape';
import {scaleLinear} from 'd3-scale';
import {Dimensions} from 'react-native';
import {parse} from 'react-native-redash';

import data from './data.json';

export const SIZE = Dimensions.get('window').width;

const values = data.data.prices;
const POINTS = 60;

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

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const scaleY = scaleLinear().domain([minPrice, maxPrice]).range([SIZE, 0]);

  return {
    label,
    minPrice,
    maxPrice,
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

export const graphs = [
  {label: '1H', value: 0, data: buildGraph(values.hour, 'Last Hour')},
  {label: '1D', value: 1, data: buildGraph(values.day, 'Today')},
  {label: '1M', value: 2, data: buildGraph(values.month, 'Last Month')},
  {label: '1Y', value: 3, data: buildGraph(values.year, 'This Year')},
  {label: 'all', value: 4, data: buildGraph(values.all, 'All time')},
];
