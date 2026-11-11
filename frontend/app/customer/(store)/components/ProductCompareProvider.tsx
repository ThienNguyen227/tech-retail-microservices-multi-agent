'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Phone, ProductVariant } from './PhoneProductCard';

// ============================================================
// TYPES
// ============================================================

export type ComparePhoneItem = {
  productId: string;
  name: string;
  slug: string;
  categoryId: string;
  image: string;

  variant: {
    sku: string;
    slug: string;
    storage: string;
    color: string;
    price: number;
    image: string;
  };
};

export type AddPhoneResult = 'added' | 'duplicate' | 'limit';

type ProductCompareContextType = {
  phones: ComparePhoneItem[];
  count: number;
  canAddMore: boolean;
  isHydrated: boolean;

  addPhone: (
    product: Phone,
    variant: ProductVariant,
  ) => AddPhoneResult;

  removePhone: (productId: string) => void;
  clearPhones: () => void;
};

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY = 'smarthub-phone-compare';
const MAX_COMPARE_PRODUCTS = 3;

// ============================================================
// CONTEXT
// ============================================================

const ProductCompareContext =
  createContext<ProductCompareContextType | undefined>(undefined);

// ============================================================
// LOCAL STORAGE VALIDATION
// ============================================================

function isValidComparePhone(value: unknown): value is ComparePhoneItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  const variant = item.variant;

  if (!variant || typeof variant !== 'object') {
    return false;
  }

  const selectedVariant = variant as Record<string, unknown>;

  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.categoryId === 'string' &&
    typeof item.image === 'string' &&
    typeof selectedVariant.sku === 'string' &&
    typeof selectedVariant.slug === 'string' &&
    typeof selectedVariant.storage === 'string' &&
    typeof selectedVariant.color === 'string' &&
    typeof selectedVariant.price === 'number' &&
    typeof selectedVariant.image === 'string'
  );
}

// ============================================================
// PROVIDER
// ============================================================

export function ProductCompareProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [phones, setPhones] = useState<ComparePhoneItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // ----------------------------------------------------------
  // LOAD DATA FROM LOCAL STORAGE
  // ----------------------------------------------------------

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);

      if (storedData) {
        const parsedData: unknown = JSON.parse(storedData);

        if (Array.isArray(parsedData)) {
          const validPhones = parsedData
            .filter(isValidComparePhone)
            .slice(0, MAX_COMPARE_PRODUCTS);

          // Loại bỏ những sản phẩm bị trùng ID
          const uniquePhones = validPhones.filter(
            (phone, index, array) =>
              array.findIndex(
                (item) => item.productId === phone.productId,
              ) === index,
          );

          setPhones(uniquePhones);
        }
      }
    } catch (error) {
      console.error(
        'Không thể tải danh sách so sánh:',
        error,
      );
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // ----------------------------------------------------------
  // SAVE DATA TO LOCAL STORAGE
  // ----------------------------------------------------------

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(phones),
      );
    } catch (error) {
      console.error(
        'Không thể lưu danh sách so sánh:',
        error,
      );
    }
  }, [phones, isHydrated]);

  // ----------------------------------------------------------
  // ADD PHONE
  // ----------------------------------------------------------

  const addPhone = useCallback(
    (
      product: Phone,
      variant: ProductVariant,
    ): AddPhoneResult => {
      // Không cho thêm cùng một sản phẩm hai lần
      const isDuplicate = phones.some(
        (item) => item.productId === product._id,
      );

      if (isDuplicate) {
        return 'duplicate';
      }

      // Giới hạn tối đa 3 sản phẩm
      if (phones.length >= MAX_COMPARE_PRODUCTS) {
        return 'limit';
      }

      const newPhone: ComparePhoneItem = {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId,
        image: variant.images?.[0] || product.image,

        variant: {
          sku: variant.sku,
          slug: variant.slug,
          storage: variant.storage,
          color: variant.color,
          price: variant.price,
          image: variant.images?.[0] || product.image,
        },
      };

      setPhones((previous) => [...previous, newPhone]);

      return 'added';
    },
    [phones],
  );

  // ----------------------------------------------------------
  // REMOVE PHONE
  // ----------------------------------------------------------

  const removePhone = useCallback((productId: string) => {
    setPhones((previous) =>
      previous.filter(
        (phone) => phone.productId !== productId,
      ),
    );
  }, []);

  // ----------------------------------------------------------
  // CLEAR ALL PHONES
  // ----------------------------------------------------------

  const clearPhones = useCallback(() => {
    setPhones([]);
  }, []);

  // ----------------------------------------------------------
  // CONTEXT VALUE
  // ----------------------------------------------------------

  const value = useMemo(
    () => ({
      phones,
      count: phones.length,
      canAddMore: phones.length < MAX_COMPARE_PRODUCTS,
      isHydrated,
      addPhone,
      removePhone,
      clearPhones,
    }),
    [
      phones,
      isHydrated,
      addPhone,
      removePhone,
      clearPhones,
    ],
  );

  return (
    <ProductCompareContext.Provider value={value}>
      {children}
    </ProductCompareContext.Provider>
  );
}

// ============================================================
// CUSTOM HOOK
// ============================================================

export function useProductCompare() {
  const context = useContext(ProductCompareContext);

  if (!context) {
    throw new Error(
      'useProductCompare phải được sử dụng bên trong ProductCompareProvider',
    );
  }

  return context;
}
