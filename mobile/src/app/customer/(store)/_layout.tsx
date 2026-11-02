import { Stack } from 'expo-router';

import CustomerHeader from '@/components/customer-header';

export default function StoreLayout() {
  return (
    <>
      <CustomerHeader />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
