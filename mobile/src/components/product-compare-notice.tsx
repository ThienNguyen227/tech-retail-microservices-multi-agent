import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProductCompareIcon from './product-compare-icon';

export default function ProductCompareNotice({ message, onClose }: {
  message: string;
  onClose: () => void;
}) {
  if (!message) return null;

  const title = message.includes('đã có')
    ? 'Sản phẩm đã được chọn'
    : message.includes('tối đa')
      ? 'Danh sách so sánh đã đầy'
      : 'Chưa thể thêm sản phẩm';

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-black/45">
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng thông báo"
          onPress={onClose} className="absolute inset-0" />
        <SafeAreaView pointerEvents="box-none" className="flex-1 items-center justify-center px-6">
          <View accessibilityViewIsModal className="max-h-[80%] w-full max-w-sm overflow-hidden rounded-3xl border border-teal-100 bg-white"
            style={{ elevation: 12, shadowColor: '#0f172a', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } }}>
            <ScrollView contentContainerStyle={{ padding: 24 }} bounces={false}>
              <View className="mb-5 h-20 w-20 items-center justify-center self-center rounded-full bg-teal-50">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-teal-100">
                  <ProductCompareIcon size={30} />
                </View>
              </View>
              <Text accessibilityRole="header" className="text-center text-xl font-bold leading-7 text-slate-900">{title}</Text>
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="mt-3 text-center text-sm leading-6 text-slate-500">{message}</Text>
              <Pressable accessibilityRole="button" onPress={onClose}
                className="mt-6 min-h-12 items-center justify-center rounded-2xl bg-teal-700 px-5 py-3 active:bg-teal-800">
                <Text className="text-base font-semibold text-white">Đã hiểu</Text>
              </Pressable>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
