import { StoreScrollView } from '@/components/store-scroll-to-top';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import PhoneProductDetail, {
  type PhoneDetailProduct,
} from '@/components/phone-product-detail';
import LaptopProductDetail, {
  type LaptopDetailProduct,
} from '@/components/laptop-product-detail';
import TabletProductDetail, {
  type TabletDetailProduct,
} from '@/components/tablet-product-detail';
import { customerProductService } from '@/lib/axios/services/customer-services/product_service';

type DetailResponse = {
  product: Record<string, unknown> & {
    variants?: { slug: string }[];
  };
  category?: { slug?: string };
};

export default function ProductDetailPage() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug ?? '');
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const onRefresh = () => {
    if (!refreshing) {
      setRefreshing(true);
      setError('');
      setRefreshKey((value) => value + 1);
    }
  };
  const [error, setError] = useState('');
  const loadedDetail = useRef<DetailResponse | null>(null);
  const loadedRefreshKey = useRef(-1);

  useEffect(() => {
    const hasVariant = loadedDetail.current?.product.variants?.some(
      (variant) => variant.slug === slug,
    );
    if (hasVariant && loadedRefreshKey.current === refreshKey) {
      return;
    }

    let active = true;
    setError('');
    customerProductService
      .getProductDetail(slug)
      .then((response) => {
        if (active) {
          loadedDetail.current = response as DetailResponse;
          loadedRefreshKey.current = refreshKey;
          setData(response as DetailResponse);
        }
      })
      .catch(() => {
        if (active) setError('Không thể tải thông tin sản phẩm.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug, refreshKey]);

  return (
    <View className="flex-1 bg-slate-50">
      {loading ? (
        <ActivityIndicator className="mt-20" color="#0d9488" />
      ) : error || !data?.product ? (
        <StoreScrollView
          alwaysBounceVertical
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#168b87"
            />
          }
          contentContainerClassName="m-5 rounded-2xl bg-white p-8"
        >
          <Text className="text-center text-red-600">
            {error || 'Không tìm thấy sản phẩm.'}
          </Text>
        </StoreScrollView>
      ) : data.category?.slug === 'dien-thoai-di-dong' ? (
        <PhoneProductDetail
          key={String(data.product._id)}
          product={data.product as unknown as PhoneDetailProduct}
          selectedSlug={slug}
          refreshing={refreshing}
          onRefresh={onRefresh}
          refreshKey={refreshKey}
        />
      ) : data.category?.slug === 'may-tinh-xach-tay' ? (
        <LaptopProductDetail
          key={String(data.product._id)}
          product={data.product as unknown as LaptopDetailProduct}
          selectedSlug={slug}
          refreshing={refreshing}
          onRefresh={onRefresh}
          refreshKey={refreshKey}
        />
      ) : (
        <TabletProductDetail
          key={String(data.product._id)}
          product={data.product as unknown as TabletDetailProduct}
          selectedSlug={slug}
          refreshing={refreshing}
          onRefresh={onRefresh}
          refreshKey={refreshKey}
        />
      )}
    </View>
  );
}
