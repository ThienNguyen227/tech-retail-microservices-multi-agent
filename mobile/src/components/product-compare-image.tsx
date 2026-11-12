import { useState } from 'react';
import { Image, Text, View } from 'react-native';

import { FRONTEND_ASSET_URL } from '@/constants/api';

export function getCompareImageUrl(image: string, kind: 'phone' | 'laptop' | 'tablet') {
  if (/^https?:\/\//i.test(image)) return image;
  const path = image.replace(/^\/+/, '');
  return `${FRONTEND_ASSET_URL}/${path.includes('/') ? path : `product/${kind}/${path}`}`;
}

function CompareImage({ uri, name }: { uri: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <View className="h-full w-full items-center justify-center rounded-xl bg-slate-50 p-2">
      <Text className="text-center text-xs text-slate-400">Không tải được ảnh</Text>
    </View>
  ) : (
    <Image source={{ uri }} accessibilityLabel={name} resizeMode="contain"
      style={{ width: '100%', height: '100%' }} onError={() => setFailed(true)} />
  );
}

export default function ProductCompareImage({ image, name, kind }: {
  image: string; name: string; kind: 'phone' | 'laptop' | 'tablet';
}) {
  const uri = getCompareImageUrl(image, kind);
  return <CompareImage key={uri} uri={uri} name={name} />;
}
