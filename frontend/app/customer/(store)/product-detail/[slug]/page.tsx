import PhoneProductDetail from '../../components/PhoneProductDetail';
import LaptopProductDetail from '../../components/LaptopProductDetail';
import TabletProductDetail from '../../components/TabletProductDetail';

async function getProductDetail(slug: string) {
  try {
    const res = await fetch(
      `http://localhost:3003/api/v1/customer-session/product-service/product-detail?name=${encodeURIComponent(slug)}`,
      {
        cache: 'no-store',
      },
    );

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error('Fetch product detail error:', error);
    return null;
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const data = await getProductDetail(slug);

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Không tìm thấy sản phẩm
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Sản phẩm không tồn tại hoặc đã bị xóa.
        </p>
      </div>
    );
  }

  const { product, category } = data;

  switch (category.slug) {
    case 'dien-thoai-di-dong':
      return <PhoneProductDetail product={product} selectedSlug={slug}/>;

    case 'may-tinh-xach-tay':
      return <LaptopProductDetail product={product} selectedSlug={slug}/>;

    case 'may-tinh-bang':
      return <TabletProductDetail product={product} selectedSlug={slug}/>;

    default:
      return (
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          Loại sản phẩm không được hỗ trợ.
        </div>
      );
  }
}