import Svg, { Path } from 'react-native-svg';

const paths = {
  compare: 'M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4',
  close: 'm6 6 12 12M6 18 18 6',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6m4-6v6',
  laptop: 'M5 4h14v12H5zM2 20h20l-3-4H5z',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM11 18h2',
  tablet: 'M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM11 18h2',
  back: 'm15 18-6-6 6-6',
  check: 'm4 12 5 5L20 6',
};

export default function ProductCompareIcon({ name = 'compare', color = '#0f766e', size = 20 }: {
  name?: keyof typeof paths; color?: string; size?: number;
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d={paths[name]} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
