import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const categories = [
  { title: 'Điện thoại', subtitle: 'Mẫu mới mỗi ngày', color: '#dff5f1' },
  { title: 'Laptop', subtitle: 'Làm việc hiệu quả', color: '#e5efff' },
  { title: 'Máy tính bảng', subtitle: 'Giải trí linh hoạt', color: '#fff0d9' },
];

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-[#f3f8f8]" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-3xl bg-[#073b4c] p-5">
          <Text className="text-sm font-semibold text-[#9de3dd]">
            SMART TECHNOLOGY
          </Text>
          <Text className="mt-2 text-2xl font-extrabold leading-8 text-white">
            Công nghệ phù hợp{'\n'}cho cuộc sống của bạn
          </Text>
          <Text className="mt-3 text-sm leading-5 text-slate-200">
            Khám phá sản phẩm chính hãng với trải nghiệm mua sắm đơn giản.
          </Text>
          <View className="mt-5 self-start rounded-xl bg-[#168b87] px-4 py-3">
            <Text className="font-bold text-white">Khám phá ngay</Text>
          </View>
        </View>

        <View className="mt-6 flex-row items-end justify-between">
          <View>
            <Text className="text-xl font-extrabold text-[#073b4c]">
              Danh mục nổi bật
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              Chọn thiết bị bạn đang quan tâm
            </Text>
          </View>
          <Text className="text-sm font-semibold text-[#168b87]">Xem tất cả</Text>
        </View>

        <View className="mt-4 gap-3">
          {categories.map((category) => (
            <View
              key={category.title}
              className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
            >
              <View
                className="mr-4 h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: category.color }}
              >
                <Text className="text-2xl">▦</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-[#073b4c]">
                  {category.title}
                </Text>
                <Text className="mt-1 text-sm text-slate-500">
                  {category.subtitle}
                </Text>
              </View>
              <Text className="text-xl font-bold text-[#168b87]">›</Text>
            </View>
          ))}
        </View>

        <View className="mt-6 rounded-2xl border border-[#bfe8e4] bg-[#eaf9f7] p-4">
          <Text className="text-base font-bold text-[#073b4c]">
            Ưu đãi dành cho bạn
          </Text>
          <Text className="mt-1 text-sm leading-5 text-slate-600">
            Đăng nhập để theo dõi đơn hàng, lưu sản phẩm và nhận thông báo ưu đãi.
          </Text>
          <Text className="mt-3 font-bold text-[#168b87]">
            Tài khoản của tôi →
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
