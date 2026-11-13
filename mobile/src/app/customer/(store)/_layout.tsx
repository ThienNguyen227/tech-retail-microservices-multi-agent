import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import CustomerHeader from '@/components/customer-header';
import CustomerBottom from '@/components/customer-bottom';
import AIChatbox from '@/components/ai-chatbox';
import { ProductCompareProvider } from '@/components/product-compare-provider';
import { StoreScrollToTopProvider } from '@/components/store-scroll-to-top';

export default function StoreLayout() {
  const [bottomHeight, setBottomHeight] = useState(0);

  return (
    <ProductCompareProvider>
      <StoreScrollToTopProvider bottomOffset={bottomHeight}>
        <View className="flex-1">
          <CustomerHeader />
          <Stack screenOptions={{ headerShown: false }} />
          <CustomerBottom
            onLayout={(event) =>
              setBottomHeight(event.nativeEvent.layout.height)
            }
          />
        </View>
        <AIChatbox bottomOffset={bottomHeight} />
      </StoreScrollToTopProvider>
    </ProductCompareProvider>
  );
}
