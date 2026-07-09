import React from 'react';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { Colors } from '@/constants/colors';

interface FibroMarkProps {
  size?: number;
  bg?: string;
  fg?: string;
}

export function FibroMark({
  size = 48,
  bg = Colors.primary,
  fg = '#FFFFFF',
}: FibroMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Background circle */}
      <Circle cx={50} cy={50} r={48} fill={bg} />

      {/* Body silhouette — head */}
      <Circle cx={50} cy={22} r={10} fill={fg} />

      {/* Body */}
      <Ellipse cx={50} cy={52} rx={13} ry={18} fill={fg} />

      {/* Widespread pain dots — tender points */}
      <Circle cx={32} cy={38} r={4} fill={fg} opacity={0.75} />
      <Circle cx={68} cy={38} r={4} fill={fg} opacity={0.75} />
      <Circle cx={27} cy={55} r={4} fill={fg} opacity={0.75} />
      <Circle cx={73} cy={55} r={4} fill={fg} opacity={0.75} />
      <Circle cx={36} cy={72} r={4} fill={fg} opacity={0.75} />
      <Circle cx={64} cy={72} r={4} fill={fg} opacity={0.75} />
    </Svg>
  );
}
