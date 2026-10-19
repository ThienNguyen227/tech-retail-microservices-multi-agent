import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-[#eef6f7]">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-[#12313a]">SmartHub</Text>
        <Text className="mt-2 text-center text-[#70858b]">
          Đăng nhập thành công.
        </Text>
      </View>
    </SafeAreaView>
  );
}
