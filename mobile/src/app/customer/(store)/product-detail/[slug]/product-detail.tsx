import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import PhoneProductDetail, { type PhoneDetailProduct } from '@/components/phone-product-detail';
import LaptopProductDetail, { type LaptopDetailProduct } from '@/components/laptop-product-detail';
import TabletProductDetail, { type TabletDetailProduct } from '@/components/tablet-product-detail';
import { customerProductService } from '@/lib/axios/services/customer-services/product_service';

type DetailResponse = {
  product: Record<string, unknown>;
  category?: { slug?: string };
};

export default function ProductDetailPage() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug ?? '';
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    customerProductService
      .getProductDetail(slug)
      .then((response) => {
        if (active) setData(response as DetailResponse);
      })
      .catch(() => {
        if (active) setError('Không thể tải thông tin sản phẩm.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      {loading ? (
        <ActivityIndicator className="mt-20" color="#0d9488" />
      ) : error || !data?.product ? (
        <View className="m-5 rounded-2xl bg-white p-8">
          <Text className="text-center text-red-600">{error || 'Không tìm thấy sản phẩm.'}</Text>
        </View>
      ) : data.category?.slug === 'dien-thoai-di-dong' ? (
        <PhoneProductDetail product={data.product as unknown as PhoneDetailProduct} selectedSlug={slug} />
      ) : data.category?.slug === 'may-tinh-xach-tay' ? (
        <LaptopProductDetail product={data.product as unknown as LaptopDetailProduct} selectedSlug={slug} />
      ) : (
        <TabletProductDetail product={data.product as unknown as TabletDetailProduct} selectedSlug={slug} />
      )}
    </SafeAreaView>
  );
}
