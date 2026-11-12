import { Stack } from 'expo-router';

import CustomerHeader from '@/components/customer-header';
import AIChatbox from '@/components/ai-chatbox';
import { ProductCompareProvider } from '@/components/product-compare-provider';
import { StoreScrollToTopProvider } from '@/components/store-scroll-to-top';

export default function StoreLayout() {
  return (
    <ProductCompareProvider>
      <StoreScrollToTopProvider>
        <CustomerHeader />
        <Stack screenOptions={{ headerShown: false }} />
        <AIChatbox />
      </StoreScrollToTopProvider>
    </ProductCompareProvider>
  );
}
