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

import type {
  Phone,
  ProductVariant,
} from './PhoneProductCard';

// ============================================================
// TYPES - PHONE
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

// ============================================================
// TYPES - LAPTOP
// ============================================================

export type CompareLaptopVariant = {
  sku: string;
  slug: string;
  ram: string;
  ssd: string;
  color: string;
  colorSlug: string;
  price: number;
  images: string[];
};

export type CompareLaptopProduct = {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  image: string;
  brandId: string;
  categoryId: string;

  ram?: string;
  ssd?: string;

  variants: CompareLaptopVariant[];
};

export type CompareLaptopItem = {
  productId: string;
  name: string;
  slug: string;
  categoryId: string;
  image: string;

  variant: {
    sku: string;
    slug: string;
    ram: string;
    ssd: string;
    color: string;
    colorSlug: string;
    price: number;
    image: string;
  };
};

// ============================================================
// TYPES - TABLET
// ============================================================

export type CompareTabletVariant = {
  sku: string;
  slug: string;
  storage: string;
  color: string;
  colorSlug: string;
  price: number;
  images: string[];
};

export type CompareTabletProduct = {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  image: string;
  brandId: string;
  categoryId: string;

  screenTech?: string;
  screenSize?: string;

  variants: CompareTabletVariant[];
};

export type CompareTabletItem = {
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
    colorSlug: string;
    price: number;
    image: string;
  };
};

// ============================================================
// RESULT TYPES
// ============================================================

export type AddPhoneResult =
  | 'added'
  | 'duplicate'
  | 'limit';

export type AddLaptopResult =
  | 'added'
  | 'duplicate'
  | 'limit';

export type AddTabletResult =
  | 'added'
  | 'duplicate'
  | 'limit';

// ============================================================
// CONTEXT TYPE
// ============================================================

type ProductCompareContextType = {
  // Phone
  phones: ComparePhoneItem[];
  phoneCount: number;
  canAddMorePhones: boolean;

  addPhone: (
    product: Phone,
    variant: ProductVariant,
  ) => AddPhoneResult;

  removePhone: (productId: string) => void;
  clearPhones: () => void;

  // Laptop
  laptops: CompareLaptopItem[];
  laptopCount: number;
  canAddMoreLaptops: boolean;

  addLaptop: (
    product: CompareLaptopProduct,
    variant: CompareLaptopVariant,
  ) => AddLaptopResult;

  removeLaptop: (productId: string) => void;
  clearLaptops: () => void;

  // Tablet
  tablets: CompareTabletItem[];
  tabletCount: number;
  canAddMoreTablets: boolean;

  addTablet: (
    product: CompareTabletProduct,
    variant: CompareTabletVariant,
  ) => AddTabletResult;

  removeTablet: (productId: string) => void;
  clearTablets: () => void;

  // Common
  isHydrated: boolean;
};

// ============================================================
// CONSTANTS
// ============================================================

const PHONE_STORAGE_KEY = 'smarthub-phone-compare';
const LAPTOP_STORAGE_KEY = 'smarthub-laptop-compare';
const TABLET_STORAGE_KEY = 'smarthub-tablet-compare';

const MAX_COMPARE_PRODUCTS = 3;

// ============================================================
// CONTEXT
// ============================================================

const ProductCompareContext =
  createContext<ProductCompareContextType | undefined>(
    undefined,
  );

// ============================================================
// LOCAL STORAGE VALIDATION - PHONE
// ============================================================

function isValidComparePhone(
  value: unknown,
): value is ComparePhoneItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  const variant = item.variant;

  if (!variant || typeof variant !== 'object') {
    return false;
  }

  const selectedVariant =
    variant as Record<string, unknown>;

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
    Number.isFinite(selectedVariant.price) &&
    typeof selectedVariant.image === 'string'
  );
}

// ============================================================
// LOCAL STORAGE VALIDATION - LAPTOP
// ============================================================

function isValidCompareLaptop(
  value: unknown,
): value is CompareLaptopItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  const variant = item.variant;

  if (!variant || typeof variant !== 'object') {
    return false;
  }

  const selectedVariant =
    variant as Record<string, unknown>;

  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.categoryId === 'string' &&
    typeof item.image === 'string' &&
    typeof selectedVariant.sku === 'string' &&
    typeof selectedVariant.slug === 'string' &&
    typeof selectedVariant.ram === 'string' &&
    typeof selectedVariant.ssd === 'string' &&
    typeof selectedVariant.color === 'string' &&
    typeof selectedVariant.colorSlug === 'string' &&
    typeof selectedVariant.price === 'number' &&
    Number.isFinite(selectedVariant.price) &&
    typeof selectedVariant.image === 'string'
  );
}

// ============================================================
// LOCAL STORAGE VALIDATION - TABLET
// ============================================================

function isValidCompareTablet(
  value: unknown,
): value is CompareTabletItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  const variant = item.variant;

  if (!variant || typeof variant !== 'object') {
    return false;
  }

  const selectedVariant =
    variant as Record<string, unknown>;

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
    typeof selectedVariant.colorSlug === 'string' &&
    typeof selectedVariant.price === 'number' &&
    Number.isFinite(selectedVariant.price) &&
    typeof selectedVariant.image === 'string'
  );
}

// ============================================================
// REMOVE DUPLICATE ITEMS
// ============================================================

function getUniqueItems<T extends { productId: string }>(
  items: T[],
): T[] {
  return items
    .filter(
      (item, index, array) =>
        array.findIndex(
          (other) =>
            other.productId === item.productId,
        ) === index,
    )
    .slice(0, MAX_COMPARE_PRODUCTS);
}

// ============================================================
// PROVIDER
// ============================================================

export function ProductCompareProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [phones, setPhones] = useState<
    ComparePhoneItem[]
  >([]);

  const [laptops, setLaptops] = useState<
    CompareLaptopItem[]
  >([]);

  const [tablets, setTablets] = useState<
    CompareTabletItem[]
  >([]);

  const [isHydrated, setIsHydrated] = useState(false);

  // ==========================================================
  // LOAD DATA FROM LOCAL STORAGE
  // ==========================================================

  useEffect(() => {
    // LOAD PHONES
    try {
      const storedPhones =
        localStorage.getItem(PHONE_STORAGE_KEY);

      if (storedPhones) {
        const parsedPhones: unknown =
          JSON.parse(storedPhones);

        if (Array.isArray(parsedPhones)) {
          const validPhones = parsedPhones.filter(
            isValidComparePhone,
          );

          setPhones(getUniqueItems(validPhones));
        }
      }
    } catch (error) {
      console.error(
        'Không thể tải danh sách điện thoại so sánh:',
        error,
      );
    }

    // LOAD LAPTOPS
    try {
      const storedLaptops =
        localStorage.getItem(LAPTOP_STORAGE_KEY);

      if (storedLaptops) {
        const parsedLaptops: unknown =
          JSON.parse(storedLaptops);

        if (Array.isArray(parsedLaptops)) {
          const validLaptops = parsedLaptops.filter(
            isValidCompareLaptop,
          );

          setLaptops(getUniqueItems(validLaptops));
        }
      }
    } catch (error) {
      console.error(
        'Không thể tải danh sách laptop so sánh:',
        error,
      );
    }

    // LOAD TABLETS
    try {
      const storedTablets =
        localStorage.getItem(TABLET_STORAGE_KEY);

      if (storedTablets) {
        const parsedTablets: unknown =
          JSON.parse(storedTablets);

        if (Array.isArray(parsedTablets)) {
          const validTablets = parsedTablets.filter(
            isValidCompareTablet,
          );

          setTablets(getUniqueItems(validTablets));
        }
      }
    } catch (error) {
      console.error(
        'Không thể tải danh sách máy tính bảng so sánh:',
        error,
      );
    }

    setIsHydrated(true);
  }, []);

  // ==========================================================
  // SAVE PHONES TO LOCAL STORAGE
  // ==========================================================

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(
        PHONE_STORAGE_KEY,
        JSON.stringify(phones),
      );
    } catch (error) {
      console.error(
        'Không thể lưu danh sách điện thoại so sánh:',
        error,
      );
    }
  }, [phones, isHydrated]);

  // ==========================================================
  // SAVE LAPTOPS TO LOCAL STORAGE
  // ==========================================================

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(
        LAPTOP_STORAGE_KEY,
        JSON.stringify(laptops),
      );
    } catch (error) {
      console.error(
        'Không thể lưu danh sách laptop so sánh:',
        error,
      );
    }
  }, [laptops, isHydrated]);

  // ==========================================================
  // SAVE TABLETS TO LOCAL STORAGE
  // ==========================================================

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(
        TABLET_STORAGE_KEY,
        JSON.stringify(tablets),
      );
    } catch (error) {
      console.error(
        'Không thể lưu danh sách máy tính bảng so sánh:',
        error,
      );
    }
  }, [tablets, isHydrated]);

  // ==========================================================
  // ADD PHONE
  // ==========================================================

  const addPhone = useCallback(
    (
      product: Phone,
      variant: ProductVariant,
    ): AddPhoneResult => {
      const isDuplicate = phones.some(
        (item) => item.productId === product._id,
      );

      if (isDuplicate) {
        return 'duplicate';
      }

      if (phones.length >= MAX_COMPARE_PRODUCTS) {
        return 'limit';
      }

      const selectedImage =
        variant.images?.[0] || product.image;

      const newPhone: ComparePhoneItem = {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId,
        image: selectedImage,

        variant: {
          sku: variant.sku,
          slug: variant.slug,
          storage: variant.storage,
          color: variant.color,
          price: variant.price,
          image: selectedImage,
        },
      };

      setPhones((previous) => [
        ...previous,
        newPhone,
      ]);

      return 'added';
    },
    [phones],
  );

  // ==========================================================
  // REMOVE PHONE
  // ==========================================================

  const removePhone = useCallback(
    (productId: string) => {
      setPhones((previous) =>
        previous.filter(
          (phone) => phone.productId !== productId,
        ),
      );
    },
    [],
  );

  // ==========================================================
  // CLEAR PHONES
  // ==========================================================

  const clearPhones = useCallback(() => {
    setPhones([]);
  }, []);

  // ==========================================================
  // ADD LAPTOP
  // ==========================================================

  const addLaptop = useCallback(
    (
      product: CompareLaptopProduct,
      variant: CompareLaptopVariant,
    ): AddLaptopResult => {
      const isDuplicate = laptops.some(
        (item) => item.productId === product._id,
      );

      if (isDuplicate) {
        return 'duplicate';
      }

      if (laptops.length >= MAX_COMPARE_PRODUCTS) {
        return 'limit';
      }

      const selectedImage =
        variant.images?.[0] || product.image;

      const newLaptop: CompareLaptopItem = {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId,
        image: selectedImage,

        variant: {
          sku: variant.sku,
          slug: variant.slug,
          ram: variant.ram,
          ssd: variant.ssd,
          color: variant.color,
          colorSlug: variant.colorSlug,
          price: variant.price,
          image: selectedImage,
        },
      };

      setLaptops((previous) => [
        ...previous,
        newLaptop,
      ]);

      return 'added';
    },
    [laptops],
  );

  // ==========================================================
  // REMOVE LAPTOP
  // ==========================================================

  const removeLaptop = useCallback(
    (productId: string) => {
      setLaptops((previous) =>
        previous.filter(
          (laptop) => laptop.productId !== productId,
        ),
      );
    },
    [],
  );

  // ==========================================================
  // CLEAR LAPTOPS
  // ==========================================================

  const clearLaptops = useCallback(() => {
    setLaptops([]);
  }, []);

  // ==========================================================
  // ADD TABLET
  // ==========================================================

  const addTablet = useCallback(
    (
      product: CompareTabletProduct,
      variant: CompareTabletVariant,
    ): AddTabletResult => {
      const isDuplicate = tablets.some(
        (item) => item.productId === product._id,
      );

      if (isDuplicate) {
        return 'duplicate';
      }

      if (tablets.length >= MAX_COMPARE_PRODUCTS) {
        return 'limit';
      }

      const selectedImage =
        variant.images?.[0] || product.image;

      const newTablet: CompareTabletItem = {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId,
        image: selectedImage,

        variant: {
          sku: variant.sku,
          slug: variant.slug,
          storage: variant.storage,
          color: variant.color,
          colorSlug: variant.colorSlug,
          price: variant.price,
          image: selectedImage,
        },
      };

      setTablets((previous) => [
        ...previous,
        newTablet,
      ]);

      return 'added';
    },
    [tablets],
  );

  // ==========================================================
  // REMOVE TABLET
  // ==========================================================

  const removeTablet = useCallback(
    (productId: string) => {
      setTablets((previous) =>
        previous.filter(
          (tablet) => tablet.productId !== productId,
        ),
      );
    },
    [],
  );

  // ==========================================================
  // CLEAR TABLETS
  // ==========================================================

  const clearTablets = useCallback(() => {
    setTablets([]);
  }, []);

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = useMemo(
    () => ({
      // Phone
      phones,
      phoneCount: phones.length,
      canAddMorePhones:
        phones.length < MAX_COMPARE_PRODUCTS,
      addPhone,
      removePhone,
      clearPhones,

      // Laptop
      laptops,
      laptopCount: laptops.length,
      canAddMoreLaptops:
        laptops.length < MAX_COMPARE_PRODUCTS,
      addLaptop,
      removeLaptop,
      clearLaptops,

      // Tablet
      tablets,
      tabletCount: tablets.length,
      canAddMoreTablets:
        tablets.length < MAX_COMPARE_PRODUCTS,
      addTablet,
      removeTablet,
      clearTablets,

      // Common
      isHydrated,
    }),
    [
      phones,
      laptops,
      tablets,
      isHydrated,
      addPhone,
      removePhone,
      clearPhones,
      addLaptop,
      removeLaptop,
      clearLaptops,
      addTablet,
      removeTablet,
      clearTablets,
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
