
import Svg, { Circle } from 'react-native-svg';
import { View, Text } from 'react-native';
import { colors } from '../styles/commonStyles';

interface Props {
  size?: number;
  thickness?: number;
  percent: number;
  color?: string;
}

export default function ProgressDonut({ size = 64, thickness = 8, percent, color = colors.accent }: Props) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="#E5E7EB" strokeWidth={thickness} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <Text style={{ position: 'absolute', fontSize: 12, fontWeight: '800', color: colors.text }}>{percent}%</Text>
    </View>
  );
}
