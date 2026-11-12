import { StoreFlatList } from '@/components/store-scroll-to-top';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image as RNImage, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProductFilter from '@/components/product-filter';
import ProductComparePhoneBar from '@/components/product-compare-phone-bar';
import ProductCompareLaptopBar from '@/components/product-compare-laptop-bar';
import ProductCompareTabletBar from '@/components/product-compare-tablet-bar';
import { FRONTEND_ASSET_URL } from '@/constants/api';
import PhoneProductCard, { type Product, type PromotionDiscount } from '@/components/phone-product-card';
import LaptopProductCard from '@/components/laptop-product-card';
import TabletProductCard from '@/components/tablet-product-card';
import { customerProductService } from '@/lib/axios/services/customer-services/product_service';
import { customerPromotionService } from '@/lib/axios/services/customer-services/promotion_service';

type Brand = { _id?: string; id?: string; image?: string; name: string; slug: string };

const PRICE_MAX = 100000000;

function getKind(slug: string) {
  if (slug === 'dien-thoai-di-dong') return 'phone';
  if (slug === 'may-tinh-xach-tay') return 'laptop';
  return 'tablet';
}

export default function ProductCategoryPage() {
  const { slug: rawSlug, brand: rawBrand } = useLocalSearchParams<{ slug: string; brand?: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug ?? '';
  const initialBrands = (Array.isArray(rawBrand) ? rawBrand[0] : rawBrand ?? '').split(',').filter(Boolean);
  const kind = getKind(slug);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotions, setPromotions] = useState<PromotionDiscount[]>([]);
  const [selectedBrands, setSelectedBrands] = useState(initialBrands);
  const [selectedRam, setSelectedRam] = useState<number[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshRequested = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (!refreshRequested.current) setLoading(true);
      setError('');
    }, 0);
    Promise.all([
      customerProductService.getProductList(slug, selectedBrands.join(',')),
      customerProductService.getBrandList(slug),
    ]).then(async ([productData, brandData]) => {
      if (!active) return;
      const loadedProducts = (productData?.products ?? []) as Product[];
      setProducts(loadedProducts);
      setBrands((brandData?.brands ?? []) as Brand[]);
      const skus = loadedProducts.flatMap((product) => (product.variants ?? []).map((variant) => variant.sku));
      if (skus.length && ['phone', 'laptop', 'tablet'].includes(kind)) {
        try {
          const promotionData = await customerPromotionService.getDirectDiscounts(skus);
          if (active) setPromotions((promotionData?.discounts ?? promotionData ?? []) as PromotionDiscount[]);
        } catch {
          if (active) setPromotions([]);
        }
      }
    }).catch(() => {
      if (active) setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
    }).finally(() => {
      if (active) { setLoading(false); setRefreshing(false); refreshRequested.current = false; }
    });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [kind, selectedBrands, slug, refreshKey]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const variants = product.variants ?? [];
    return variants.some((variant) => {
      if (variant.price > maxPrice) return false;
      if (kind === 'laptop' && selectedRam.length && !selectedRam.includes(Number.parseInt(variant.ram ?? '', 10))) return false;
      if (kind !== 'laptop' && selectedStorage.length && !selectedStorage.includes(variant.storage ?? '')) return false;
      return true;
    });
  }), [kind, maxPrice, products, selectedRam, selectedStorage]);

  const categoryName = slug === 'dien-thoai-di-dong' ? 'Điện thoại' : slug === 'may-tinh-xach-tay' ? 'Laptop' : 'Máy tính bảng';
  const toggle = <T,>(values: T[], value: T, setter: (next: T[]) => void) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  const applyFilter = () => {
    setFilterVisible(false);
    const params = new URLSearchParams();
    if (selectedBrands.length) params.set('brand', selectedBrands.join(','));
    if (maxPrice < PRICE_MAX) params.set('maxPrice', String(maxPrice));
    if (selectedRam.length) params.set('ram', selectedRam.join(','));
    if (selectedStorage.length) params.set('storage', selectedStorage.join(','));
    router.replace(`/customer/product-category/${slug}${params.toString() ? `?${params}` : ''}` as never);
  };

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <View style={{ marginBottom: 12 }}>
      {kind === 'phone' ? (
        <PhoneProductCard product={item} promotions={promotions} />
      ) : kind === 'laptop' ? (
        <LaptopProductCard product={item} promotions={promotions} />
      ) : (
        <TabletProductCard product={item} promotions={promotions} />
      )}
    </View>
  ), [kind, promotions]);

  return (
    <SafeAreaView className="flex-1 bg-[#f5f8fa]" edges={['bottom']}>
      {brands.length ? (
        <View className="bg-[#f5f8fa] px-4 pb-1 pt-3">
          <View
            className="rounded-2xl border border-slate-200 bg-white p-4"
            style={{ height: 100}}
          >
            <Text className="mb-3 font-bold text-slate-800">
              Lọc theo thương hiệu {categoryName}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Pressable
                onPress={() => setSelectedBrands([])}
                className={`mr-2 items-center justify-center rounded-xl border ${
                  !selectedBrands.length
                    ? 'border-teal-600 bg-teal-600'
                    : 'border-slate-200 bg-slate-100'
                }`}
                style={{ height: 36, width: 76 }}
              >
                <Text className={!selectedBrands.length ? 'font-bold text-white' : 'text-slate-600'}>
                  Tất cả
                </Text>
              </Pressable>
              {brands.map((brand) => (
                <Pressable
                  key={brand.slug}
                  onPress={() => setSelectedBrands([brand.slug])}
                  accessibilityLabel={brand.name}
                  className={`mr-2 items-center justify-center rounded-xl border ${
                    selectedBrands.includes(brand.slug)
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 bg-white'
                  }`}
                  style={{ height: 36, width: 76 }}
                >
                  {brand.image ? (
                    <RNImage
                      source={{ uri: `${FRONTEND_ASSET_URL}/brand/${brand.image}` }}
                      accessibilityLabel={brand.name}
                      style={{ width: 56, height: 24 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text className="text-center text-xs text-slate-600">{brand.name}</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
      <StoreFlatList
        style={{ flex: 1 }}
        refreshing={refreshing}
        onRefresh={() => { if (!loading && !refreshRequested.current) { refreshRequested.current = true; setRefreshing(true); setRefreshKey((value) => value + 1); } }}
        data={loading || error ? [] : filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        contentContainerClassName="px-4 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={16}
        windowSize={7}
        removeClippedSubviews={false}
        ListHeaderComponent={
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-slate-900">Danh sách sản phẩm</Text>
              <Text className="mt-1 text-xs text-slate-500">
                Hiển thị {filteredProducts.length} sản phẩm
              </Text>
            </View>
            <Pressable
              onPress={() => setFilterVisible(true)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <Text className="font-semibold text-slate-700">Bộ lọc</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator className="mt-12" color="#168b87" />
          ) : error ? (
            <View className="rounded-2xl bg-white p-8">
              <Text className="text-center text-red-600">{error}</Text>
            </View>
          ) : (
            <View className="rounded-3xl border border-dashed border-slate-300 bg-white p-10">
              <Text className="text-center text-lg font-bold text-slate-800">
                Chưa có sản phẩm phù hợp
              </Text>
              <Text className="mt-2 text-center text-sm text-slate-500">
                Thử chọn thương hiệu hoặc bộ lọc khác.
              </Text>
            </View>
          )
        }
      />
      {kind === 'phone' ? <ProductComparePhoneBar /> : kind === 'laptop' ? <ProductCompareLaptopBar /> : <ProductCompareTabletBar />}
      <ProductFilter visible={filterVisible} brands={brands} selectedBrands={selectedBrands} selectedRam={selectedRam} selectedStorage={selectedStorage} maxPrice={maxPrice} onToggleBrand={(value) => toggle(selectedBrands, value, setSelectedBrands)} onToggleRam={(value) => toggle(selectedRam, value, setSelectedRam)} onToggleStorage={(value) => toggle(selectedStorage, value, setSelectedStorage)} onPrice={setMaxPrice} onClear={() => { setSelectedBrands([]); setSelectedRam([]); setSelectedStorage([]); setMaxPrice(PRICE_MAX); }} onClose={() => setFilterVisible(false)} onApply={applyFilter} />
    </SafeAreaView>
  );
}
