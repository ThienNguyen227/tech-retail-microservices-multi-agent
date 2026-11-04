import { Stack } from 'expo-router';

import CustomerHeader from '@/components/customer-header';
import AIChatbox from '@/components/ai-chatbox';

export default function StoreLayout() {
  return (
    <>
      <CustomerHeader />
      <Stack screenOptions={{ headerShown: false }} />
      <AIChatbox />
    </>
  );
}
