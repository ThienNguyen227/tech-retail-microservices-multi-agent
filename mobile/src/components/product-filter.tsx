import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  brands: { slug: string; name: string }[];
  selectedBrands: string[];
  selectedRam: number[];
  selectedStorage: string[];
  maxPrice: number;
  onToggleBrand: (value: string) => void;
  onToggleRam: (value: number) => void;
  onToggleStorage: (value: string) => void;
  onPrice: (value: number) => void;
  onClear: () => void;
  onClose: () => void;
  onApply: () => void;
};

export default function ProductFilter(props: Props) {
  const {
    visible,
    brands,
    selectedBrands,
    selectedRam,
    selectedStorage,
    maxPrice,
    onToggleBrand,
    onToggleRam,
    onToggleStorage,
    onPrice,
    onClear,
    onClose,
    onApply,
  } = props;
  const selectedCount =
    selectedBrands.length +
    selectedRam.length +
    selectedStorage.length +
    (maxPrice < 100000000 ? 1 : 0);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1 bg-black/40">
        <View className="flex-1 justify-end">
          <View className="max-h-[88%] rounded-t-3xl bg-white p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-slate-900">
                Bộ lọc {selectedCount ? `(${selectedCount})` : ''}
              </Text>
              <Pressable onPress={onClose}>
                <Text className="text-2xl text-slate-400">×</Text>
              </Pressable>
            </View>
            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              <Text className="mb-2 font-bold text-slate-800">Hãng</Text>
              <View className="flex-row flex-wrap gap-2">
                {brands.map((brand) => (
                  <Pressable
                    key={brand.slug}
                    onPress={() => onToggleBrand(brand.slug)}
                    className={`rounded-lg border px-3 py-2 ${selectedBrands.includes(brand.slug) ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                  >
                    <Text className="text-sm text-slate-700">{brand.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mb-2 mt-6 font-bold text-slate-800">RAM</Text>
              <View className="flex-row flex-wrap gap-2">
                {[3, 4, 6, 8, 12, 16].map((ram) => (
                  <Pressable
                    key={ram}
                    onPress={() => onToggleRam(ram)}
                    className={`rounded-lg border px-3 py-2 ${selectedRam.includes(ram) ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                  >
                    <Text>{ram}GB</Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mb-2 mt-6 font-bold text-slate-800">
                Dung lượng
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {['64', '128', '256', '512', '1024'].map((storage) => (
                  <Pressable
                    key={storage}
                    onPress={() => onToggleStorage(storage)}
                    className={`rounded-lg border px-3 py-2 ${selectedStorage.includes(storage) ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                  >
                    <Text>{storage === '1024' ? '1TB' : `${storage}GB`}</Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mb-2 mt-6 font-bold text-slate-800">
                Giá tối đa
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {[10000000, 20000000, 30000000, 50000000, 100000000].map(
                  (price) => (
                    <Pressable
                      key={price}
                      onPress={() => onPrice(price)}
                      className={`rounded-lg border px-3 py-2 ${maxPrice === price ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                    >
                      <Text>
                        {price === 100000000
                          ? 'Tất cả'
                          : `${price / 1000000} triệu`}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            </ScrollView>
            <View className="mt-4 flex-row gap-3">
              <Pressable
                className="flex-1 rounded-xl border border-slate-200 py-3"
                onPress={onClear}
              >
                <Text className="text-center font-bold text-slate-600">
                  Xóa lọc
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-xl bg-teal-600 py-3"
                onPress={onApply}
              >
                <Text className="text-center font-bold text-white">
                  Áp dụng
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
