// import {
//   BadRequestException,
//   Injectable,
//   InternalServerErrorException,
//   ServiceUnavailableException,
// } from '@nestjs/common';

// import axios from 'axios';

// // ==========================================
// // INTERFACES
// // ==========================================

// export interface CalculateFinalPriceItem {
//   sku: string;
//   quantity: number;
// }

// interface ProductPrice {
//   sku: string;
//   price: number | string;
// }

// interface ProductPriceResponse {
//   requestedCount: number;
//   foundCount: number;
//   notFoundSkus: string[];
//   products: ProductPrice[];
// }

// interface DirectDiscount {
//   sku: string;
//   promotionId?: number;
//   promotionName?: string;
//   discountType: string;
//   discountValue: number | string;
// }

// export interface CalculatedProduct {
//   sku: string;
//   quantity: number;
//   price: number;
//   directDiscountAmount: number;
//   totalDirectDiscountAmount: number;
//   subtotal: number;
//   promotionId: number | null;
//   promotionName: string | null;
// }

// // ==========================================
// // SERVICE
// // ==========================================

// @Injectable()
// export class CalculateFinalPriceService {
//   // ==========================================
//   // SERVICE URL
//   // ==========================================

//   private readonly productServiceUrl = (
//     process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003'
//   ).replace(/\/$/, '');

//   private readonly promotionServiceUrl = (
//     process.env.PROMOTION_SERVICE_URL || 'http://localhost:3008'
//   ).replace(/\/$/, '');

//   // ==========================================
//   // HTTP GET HELPER - AXIOS
//   // ==========================================

//   private async getApiData<T>(
//     url: string,
//     serviceName: string,
//   ): Promise<T> {
//     try {
//       const response = await axios.get<T>(url, {
//         headers: {
//           Accept: 'application/json',
//         },
//         timeout: 10000,
//       });

//       return response.data;
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         console.error(
//           `[${serviceName}] Axios Error:`,
//           {
//             status: error.response?.status,
//             data: error.response?.data,
//             message: error.message,
//           },
//         );
//       } else {
//         console.error(
//           `[${serviceName}] Connection Error:`,
//           error,
//         );
//       }

//       throw new ServiceUnavailableException(
//         `Không thể kết nối đến ${serviceName}`,
//       );
//     }
//   }

//   // ==========================================
//   // NORMALIZE API ARRAY RESPONSE
//   // ==========================================

//   private extractArray<T>(
//     response: unknown,
//     fieldName: string,
//   ): T[] {
//     if (Array.isArray(response)) {
//       return response as T[];
//     }

//     if (
//       response &&
//       typeof response === 'object' &&
//       Array.isArray(
//         (response as Record<string, unknown>)[fieldName],
//       )
//     ) {
//       return (response as Record<string, T[]>)[fieldName];
//     }

//     if (
//       response &&
//       typeof response === 'object' &&
//       Array.isArray(
//         (response as Record<string, unknown>)['data'],
//       )
//     ) {
//       return (response as { data: T[] }).data;
//     }

//     throw new InternalServerErrorException(
//       `Dữ liệu trả về từ API không đúng định dạng: ${fieldName}`,
//     );
//   }

//   // ==========================================
//   // NUMBER VALIDATION
//   // ==========================================

//   private toNumber(
//     value: unknown,
//     fieldName: string,
//   ): number {
//     const number = Number(value);

//     if (!Number.isFinite(number) || number < 0) {
//       throw new InternalServerErrorException(
//         `Giá trị ${fieldName} không hợp lệ`,
//       );
//     }

//     return number;
//   }

//   // ==========================================
//   // CALCULATE DISCOUNT
//   // ==========================================

//   private calculateDiscountAmount(
//     baseAmount: number,
//     discountType: string,
//     discountValue: number,
//   ): number {
//     let discountAmount = 0;

//     switch (discountType.toUpperCase()) {
//       case 'PERCENTAGE':
//         discountAmount = Math.round(
//           (baseAmount * discountValue) / 100,
//         );
//         break;

//       case 'FIXED_AMOUNT':
//         discountAmount = discountValue;
//         break;

//       default:
//         throw new InternalServerErrorException(
//           `Loại khuyến mãi không được hỗ trợ: ${discountType}`,
//         );
//     }

//     return Math.min(
//       baseAmount,
//       Math.max(0, Math.round(discountAmount)),
//     );
//   }

//   // ==========================================
//   // CALCULATE FINAL PRICE
//   // ==========================================

//   async calculateFinalPrice(
//     items: CalculateFinalPriceItem[],
//   ) {
//     // ==========================================
//     // 1. VALIDATE ITEMS
//     // ==========================================

//     if (!Array.isArray(items) || items.length === 0) {
//       throw new BadRequestException(
//         'Danh sách sản phẩm không được để trống',
//       );
//     }

//     if (items.length > 100) {
//       throw new BadRequestException(
//         'Số lượng sản phẩm tối đa mỗi lần truy vấn là 100',
//       );
//     }

//     for (const item of items) {
//       if (
//         !item ||
//         typeof item.sku !== 'string' ||
//         !item.sku.trim()
//       ) {
//         throw new BadRequestException(
//           'SKU không hợp lệ',
//         );
//       }

//       if (
//         !Number.isInteger(item.quantity) ||
//         item.quantity < 1
//       ) {
//         throw new BadRequestException(
//           `Số lượng sản phẩm không hợp lệ: ${item.sku}`,
//         );
//       }
//     }

//     // ==========================================
//     // 2. NORMALIZE ITEMS
//     // ==========================================

//     // Nếu SKU xuất hiện nhiều lần thì cộng số lượng

//     const quantityMap = new Map<string, number>();

//     for (const item of items) {
//       const sku = item.sku.trim();

//       const currentQuantity =
//         quantityMap.get(sku) ?? 0;

//       quantityMap.set(
//         sku,
//         currentQuantity + item.quantity,
//       );
//     }

//     const normalizedItems = Array.from(
//       quantityMap.entries(),
//     ).map(([sku, quantity]) => ({
//       sku,
//       quantity,
//     }));

//     const uniqueSkus = normalizedItems.map(
//       (item) => item.sku,
//     );

//     // ==========================================
//     // 3. BUILD QUERY STRING
//     // ==========================================

//     const queryParams = new URLSearchParams();

//     uniqueSkus.forEach((sku) => {
//       queryParams.append('skus', sku);
//     });

//     const queryString = queryParams.toString();

//     // ==========================================
//     // 4. CALL PRODUCT + PROMOTION SERVICES
//     // ==========================================

//     const productPriceUrl =
//       `${this.productServiceUrl}` +
//       `/api/v1/ai/product-service/prices?${queryString}`;

//     const directDiscountUrl =
//       `${this.promotionServiceUrl}` +
//       `/api/v1/customer-session/promotion-service/direct-discounts?${queryString}`;

//     console.log(
//       '\n========== CALCULATE FINAL PRICE ==========',
//     );

//     console.log('[ITEMS]', normalizedItems);

//     const [
//       productPriceResponse,
//       directDiscountResponse,
//     ] = await Promise.all([
//       this.getApiData<ProductPriceResponse>(
//         productPriceUrl,
//         'Product-Service',
//       ),

//       this.getApiData<DirectDiscount[]>(
//         directDiscountUrl,
//         'Promotion-Service Direct Discount',
//       ),
//     ]);

//     // ==========================================
//     // 5. NORMALIZE RESPONSE
//     // ==========================================

//     if (
//       !productPriceResponse ||
//       !Array.isArray(productPriceResponse.products)
//     ) {
//       throw new InternalServerErrorException(
//         'Product-Service trả về danh sách sản phẩm không hợp lệ',
//       );
//     }

//     const directDiscounts =
//       this.extractArray<DirectDiscount>(
//         directDiscountResponse,
//         'promotions',
//       );

//     // Map promotion theo SKU
//     const promotionMap = new Map<
//       string,
//       DirectDiscount
//     >();

//     for (const promotion of directDiscounts) {
//       promotionMap.set(promotion.sku, promotion);
//     }

//     // Map product price theo SKU
//     const priceMap = new Map<string, ProductPrice>();

//     for (const product of productPriceResponse.products) {
//       priceMap.set(product.sku, product);
//     }

//     const notFoundSkus = uniqueSkus.filter(
//       (sku) => !priceMap.has(sku),
//     );

//     // ==========================================
//     // 6. CALCULATE EACH PRODUCT
//     // ==========================================

//     const products: CalculatedProduct[] = [];

//     for (const item of normalizedItems) {
//       const { sku, quantity } = item;

//       const product = priceMap.get(sku);

//       // Bỏ qua SKU không tìm thấy
//       if (!product) {
//         continue;
//       }

//       const price = this.toNumber(
//         product.price,
//         `price của SKU ${sku}`,
//       );

//       const promotion = promotionMap.get(sku);

//       let directDiscountAmount = 0;

//       if (promotion) {
//         const discountValue = this.toNumber(
//           promotion.discountValue,
//           `discountValue của SKU ${sku}`,
//         );

//         // Mức giảm giá trên một sản phẩm
//         directDiscountAmount =
//           this.calculateDiscountAmount(
//             price,
//             promotion.discountType,
//             discountValue,
//           );
//       }

//       // Tổng tiền giảm cho toàn bộ số lượng
//       const totalDirectDiscountAmount =
//         directDiscountAmount * quantity;

//       // Thành tiền sau giảm giá
//       const subtotal =
//         (price - directDiscountAmount) * quantity;

//       products.push({
//         sku,
//         quantity,
//         price,
//         directDiscountAmount,
//         totalDirectDiscountAmount,
//         subtotal,
//         promotionId: promotion?.promotionId ?? null,
//         promotionName: promotion?.promotionName ?? null,
//       });
//     }

//     // ==========================================
//     // 7. CALCULATE TOTALS
//     // ==========================================

//     const subtotal = products.reduce(
//       (sum, product) => sum + product.subtotal,
//       0,
//     );

//     const totalDirectDiscountAmount = products.reduce(
//       (sum, product) =>
//         sum + product.totalDirectDiscountAmount,
//       0,
//     );

//     const totalQuantity = products.reduce(
//       (sum, product) => sum + product.quantity,
//       0,
//     );

//     // Không áp dụng coupon
//     const totalAmount = subtotal;

//     // ==========================================
//     // 8. RETURN RESULT
//     // ==========================================

//     const result = {
//       requestedCount: normalizedItems.length,
//       foundCount: products.length,
//       totalQuantity,
//       notFoundSkus,
//       products,
//       subtotal,
//       totalDirectDiscountAmount,
//       totalAmount,
//     };

//     console.log(
//       '========== FINAL PRICE RESULT ==========',
//     );

//     console.log(
//       JSON.stringify(result, null, 2),
//     );

//     return result;
//   }
// }
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';

import axios from 'axios';

// ============================================================
// INTERFACES
// ============================================================

export interface CalculateFinalPriceItem {
  sku: string;
  quantity: number;
}

export interface CalculateFinalPriceRequest {
  items: CalculateFinalPriceItem[];
  couponId?: number | null;
}

interface ProductPrice {
  sku: string;
  price: number | string;
}

interface ProductPriceResponse {
  requestedCount: number;
  foundCount: number;
  notFoundSkus: string[];
  products: ProductPrice[];
}

interface DirectDiscount {
  sku: string;
  promotionId?: number;
  promotionName?: string;
  discountType: string;
  discountValue: number | string;
}

interface Coupon {
  couponId: number;
  couponName: string;
  discountValue: number | string;
  minOrderValue: number | string | null;
  maxDiscountValue: number | string | null;
  discountType: string;
}

export interface CalculatedProduct {
  sku: string;
  quantity: number;
  price: number;
  directDiscountAmount: number;
  totalDirectDiscountAmount: number;
  subtotal: number;
  promotionId: number | null;
  promotionName: string | null;
}

export interface CalculatedCoupon {
  couponId: number;
  couponName: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue: number | null;
  applied: boolean;
  couponDiscountAmount: number;
  message: string;
}

// ============================================================
// SERVICE
// ============================================================

@Injectable()
export class CalculateFinalPriceService {

  // ==========================================================
  // SERVICE URL
  // ==========================================================

  private readonly productServiceUrl = (
    process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003'
  ).replace(/\/$/, '');

  private readonly promotionServiceUrl = (
    process.env.PROMOTION_SERVICE_URL || 'http://localhost:3008'
  ).replace(/\/$/, '');

  // ==========================================================
  // HTTP GET HELPER
  // ==========================================================

  private async getApiData<T>(
    url: string,
    serviceName: string,
  ): Promise<T> {
    try {
      const response = await axios.get<T>(url, {
        headers: {
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      return response.data;

    } catch (error) {
      this.logAxiosError(error, serviceName);

      throw new ServiceUnavailableException(
        `Không thể kết nối đến ${serviceName}`,
      );
    }
  }

  // ==========================================================
  // HTTP POST HELPER
  // ==========================================================

  private async postApiData<T>(
    url: string,
    payload: unknown,
    serviceName: string,
  ): Promise<T> {
    try {
      const response = await axios.post<T>(
        url,
        payload,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      return response.data;

    } catch (error) {
      this.logAxiosError(error, serviceName);

      throw new ServiceUnavailableException(
        `Không thể kết nối đến ${serviceName}`,
      );
    }
  }

  // ==========================================================
  // LOG AXIOS ERROR
  // ==========================================================

  private logAxiosError(
    error: unknown,
    serviceName: string,
  ): void {
    if (axios.isAxiosError(error)) {
      console.error(`[${serviceName}] Axios Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

    } else {
      console.error(
        `[${serviceName}] Connection Error:`,
        error,
      );
    }
  }

  // ==========================================================
  // EXTRACT ARRAY RESPONSE
  // ==========================================================

  private extractArray<T>(
    response: unknown,
    fieldName: string,
  ): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    if (!response || typeof response !== 'object') {
      throw new InternalServerErrorException(
        `Dữ liệu trả về không hợp lệ: ${fieldName}`,
      );
    }

    const data = response as Record<string, unknown>;

    if (Array.isArray(data[fieldName])) {
      return data[fieldName] as T[];
    }

    if (Array.isArray(data.data)) {
      return data.data as T[];
    }

    if (data.data && typeof data.data === 'object') {
      const nestedData = data.data as Record<string, unknown>;

      if (Array.isArray(nestedData[fieldName])) {
        return nestedData[fieldName] as T[];
      }
    }

    throw new InternalServerErrorException(
      `Dữ liệu trả về không đúng định dạng: ${fieldName}`,
    );
  }

  // ==========================================================
  // NUMBER VALIDATION
  // ==========================================================

  private toNumber(
    value: unknown,
    fieldName: string,
  ): number {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
      throw new InternalServerErrorException(
        `Giá trị ${fieldName} không hợp lệ`,
      );
    }

    return number;
  }

  // ==========================================================
  // CALCULATE DISCOUNT
  // ==========================================================

  private calculateDiscountAmount(
    baseAmount: number,
    discountType: string,
    discountValue: number,
  ): number {
    let discountAmount = 0;

    switch (discountType.toUpperCase()) {

      case 'PERCENTAGE': {
        if (discountValue > 100) {
          throw new InternalServerErrorException(
            'Giá trị giảm phần trăm không hợp lệ',
          );
        }

        discountAmount = Math.round(
          (baseAmount * discountValue) / 100,
        );

        break;
      }

      case 'FIXED_AMOUNT': {
        discountAmount = discountValue;
        break;
      }

      default:
        throw new InternalServerErrorException(
          `Loại giảm giá không được hỗ trợ: ${discountType}`,
        );
    }

    // Không giảm vượt quá giá trị đơn hàng.

    return Math.min(
      baseAmount,
      Math.max(0, Math.round(discountAmount)),
    );
  }

  // ==========================================================
  // CALCULATE COUPON
  // ==========================================================

  private calculateCoupon(
    subtotal: number,
    coupon: Coupon,
  ): CalculatedCoupon {

    // --------------------------------------------------------
    // 1. NORMALIZE COUPON DATA
    // --------------------------------------------------------

    const discountValue = this.toNumber(
      coupon.discountValue,
      'coupon.discountValue',
    );

    const minOrderValue = this.toNumber(
      coupon.minOrderValue ?? 0,
      'coupon.minOrderValue',
    );

    const maxDiscountValue =
      coupon.maxDiscountValue === null ||
      coupon.maxDiscountValue === undefined
        ? null
        : this.toNumber(
            coupon.maxDiscountValue,
            'coupon.maxDiscountValue',
          );

    // --------------------------------------------------------
    // 2. CHECK MIN ORDER VALUE
    // --------------------------------------------------------

    if (subtotal < minOrderValue) {
      return {
        couponId: coupon.couponId,
        couponName: coupon.couponName,
        discountType: coupon.discountType,
        discountValue,
        minOrderValue,
        maxDiscountValue,
        applied: false,
        couponDiscountAmount: 0,
        message: (
          `Đơn hàng chưa đạt giá trị tối thiểu ` +
          `${minOrderValue} để áp dụng coupon`
        ),
      };
    }

    // --------------------------------------------------------
    // 3. CALCULATE DISCOUNT
    // --------------------------------------------------------

    let couponDiscountAmount =
      this.calculateDiscountAmount(
        subtotal,
        coupon.discountType,
        discountValue,
      );

    // --------------------------------------------------------
    // 4. APPLY MAX DISCOUNT VALUE
    // --------------------------------------------------------

    if (maxDiscountValue !== null) {
      couponDiscountAmount = Math.min(
        couponDiscountAmount,
        maxDiscountValue,
      );
    }

    // Không để giảm vượt quá subtotal.

    couponDiscountAmount = Math.min(
      subtotal,
      Math.max(0, Math.round(couponDiscountAmount)),
    );

    // --------------------------------------------------------
    // 5. RETURN COUPON RESULT
    // --------------------------------------------------------

    return {
      couponId: coupon.couponId,
      couponName: coupon.couponName,
      discountType: coupon.discountType,
      discountValue,
      minOrderValue,
      maxDiscountValue,
      applied: true,
      couponDiscountAmount,
      message: 'Áp dụng coupon thành công',
    };
  }

  // ==========================================================
  // CALCULATE FINAL PRICE
  // ==========================================================

  async calculateFinalPrice(
    items: CalculateFinalPriceItem[],
    couponId: number | null = null,
  ) {

    // ========================================================
    // 1. VALIDATE ITEMS
    // ========================================================

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException(
        'Danh sách sản phẩm không được để trống',
      );
    }

    if (items.length > 100) {
      throw new BadRequestException(
        'Số lượng sản phẩm tối đa là 100',
      );
    }

    for (const item of items) {
      if (
        !item ||
        typeof item.sku !== 'string' ||
        !item.sku.trim()
      ) {
        throw new BadRequestException(
          'SKU không hợp lệ',
        );
      }

      if (
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1
      ) {
        throw new BadRequestException(
          `Số lượng sản phẩm không hợp lệ: ${item.sku}`,
        );
      }
    }

    if (
      couponId !== null &&
      (
        !Number.isSafeInteger(couponId) ||
        couponId < 1
      )
    ) {
      throw new BadRequestException(
        'couponId không hợp lệ',
      );
    }

    // ========================================================
    // 2. NORMALIZE ITEMS
    // ========================================================

    const quantityMap = new Map<string, number>();

    for (const item of items) {
      const sku = item.sku.trim();

      const currentQuantity = quantityMap.get(sku) ?? 0;

      const newQuantity = currentQuantity + item.quantity;

      if (!Number.isSafeInteger(newQuantity)) {
        throw new BadRequestException(
          `Tổng số lượng không hợp lệ: ${sku}`,
        );
      }

      quantityMap.set(sku, newQuantity);
    }

    const normalizedItems = Array.from(
      quantityMap.entries(),
    ).map(([sku, quantity]) => ({
      sku,
      quantity,
    }));

    const uniqueSkus = normalizedItems.map(
      (item) => item.sku,
    );

    // ========================================================
    // 3. BUILD PRODUCT QUERY
    // ========================================================

    const queryParams = new URLSearchParams();

    uniqueSkus.forEach((sku) => {
      queryParams.append('skus', sku);
    });

    const queryString = queryParams.toString();

    // ========================================================
    // 4. BUILD SERVICE URL
    // ========================================================

    const productPriceUrl =
      `${this.productServiceUrl}` +
      `/api/v1/ai/product-service/prices?${queryString}`;

    const directDiscountUrl =
      `${this.promotionServiceUrl}` +
      `/api/v1/customer-session/promotion-service/direct-discounts`;

    const couponListUrl =
      `${this.promotionServiceUrl}` +
      `/api/v1/customer-session/promotion-service/coupons`;

    // ========================================================
    // 5. CALL SERVICES
    // ========================================================

    console.log(
      '\n========== CALCULATE FINAL PRICE ==========',
    );

    console.log('[ITEMS]', normalizedItems);
    console.log('[COUPON ID]', couponId);

    const couponPromise: Promise<unknown> =
      couponId !== null
        ? this.getApiData<unknown>(
            couponListUrl,
            'Promotion-Service Coupon',
          )
        : Promise.resolve(null);

    const [
      productPriceResponse,
      directDiscountResponse,
      couponListResponse,
    ] = await Promise.all([
      // Product prices: GET
      this.getApiData<ProductPriceResponse>(
        productPriceUrl,
        'Product-Service',
      ),

      // Direct discounts: POST
      this.postApiData<unknown>(
        directDiscountUrl,
        {
          skus: uniqueSkus,
        },
        'Promotion-Service Direct Discount',
      ),

      // Coupons: GET, chỉ gọi khi có couponId
      couponPromise,
    ]);

    // ========================================================
    // 6. VALIDATE PRODUCT RESPONSE
    // ========================================================

    if (
      !productPriceResponse ||
      !Array.isArray(productPriceResponse.products)
    ) {
      throw new InternalServerErrorException(
        'Product-Service trả về danh sách sản phẩm không hợp lệ',
      );
    }

    // ========================================================
    // 7. NORMALIZE DIRECT DISCOUNTS
    // ========================================================

    const directDiscounts =
      this.extractArray<DirectDiscount>(
        directDiscountResponse,
        'promotions',
      );

    const promotionMap = new Map<
      string,
      DirectDiscount
    >();

    for (const promotion of directDiscounts) {
      promotionMap.set(
        promotion.sku,
        promotion,
      );
    }

    // ========================================================
    // 8. NORMALIZE PRODUCT PRICES
    // ========================================================

    const priceMap = new Map<string, ProductPrice>();

    for (const product of productPriceResponse.products) {
      priceMap.set(product.sku, product);
    }

    const notFoundSkus = uniqueSkus.filter(
      (sku) => !priceMap.has(sku),
    );

    // ========================================================
    // 9. CALCULATE EACH PRODUCT
    // ========================================================

    const products: CalculatedProduct[] = [];

    for (const item of normalizedItems) {
      const { sku, quantity } = item;

      const product = priceMap.get(sku);

      if (!product) {
        continue;
      }

      const price = this.toNumber(
        product.price,
        `price của SKU ${sku}`,
      );

      const promotion = promotionMap.get(sku);

      let directDiscountAmount = 0;

      if (promotion) {
        const discountValue = this.toNumber(
          promotion.discountValue,
          `discountValue của SKU ${sku}`,
        );

        // Giảm giá trên một sản phẩm.

        directDiscountAmount =
          this.calculateDiscountAmount(
            price,
            promotion.discountType,
            discountValue,
          );
      }

      // Tổng giảm giá theo quantity.

      const totalDirectDiscountAmount =
        directDiscountAmount * quantity;

      // Thành tiền sau Direct Discount.

      const subtotal =
        (price - directDiscountAmount) * quantity;

      products.push({
        sku,
        quantity,
        price,
        directDiscountAmount,
        totalDirectDiscountAmount,
        subtotal,
        promotionId: promotion?.promotionId ?? null,
        promotionName: promotion?.promotionName ?? null,
      });
    }

    // ========================================================
    // 10. CALCULATE ORIGINAL SUBTOTAL
    // ========================================================

    // Tổng tiền hàng trước tất cả giảm giá.

    const originalSubtotal = products.reduce(
      (sum, product) =>
        sum + product.price * product.quantity,
      0,
    );

    // ========================================================
    // 11. CALCULATE DIRECT DISCOUNT TOTAL
    // ========================================================

    const subtotal = products.reduce(
      (sum, product) => sum + product.subtotal,
      0,
    );

    const totalDirectDiscountAmount = products.reduce(
      (sum, product) =>
        sum + product.totalDirectDiscountAmount,
      0,
    );

    const totalQuantity = products.reduce(
      (sum, product) => sum + product.quantity,
      0,
    );

    // ========================================================
    // 12. VALIDATE NOT FOUND PRODUCTS
    // ========================================================

    if (couponId !== null && notFoundSkus.length > 0) {
      throw new BadRequestException({
        message: (
          'Không thể áp dụng coupon vì có sản phẩm ' +
          'không tìm thấy trong Product-Service'
        ),
        notFoundSkus,
      });
    }

    // ========================================================
    // 13. CALCULATE COUPON
    // ========================================================

    let calculatedCoupon: CalculatedCoupon | null = null;

    let couponDiscountAmount = 0;

    if (couponId !== null) {
      const coupons = this.extractArray<Coupon>(
        couponListResponse,
        'coupons',
      );

      // Tìm coupon theo ID trong danh sách ACTIVE.

      const selectedCoupon = coupons.find(
        (coupon) =>
          Number(coupon.couponId) === couponId,
      );

      if (!selectedCoupon) {
        throw new BadRequestException(
          'Coupon không tồn tại hoặc không còn hoạt động',
        );
      }

      // Tính coupon trên subtotal sau Direct Discount.

      calculatedCoupon = this.calculateCoupon(
        subtotal,
        selectedCoupon,
      );

      couponDiscountAmount =
        calculatedCoupon.couponDiscountAmount;
    }

    // ========================================================
    // 14. CALCULATE FINAL TOTALS
    // ========================================================

    const discountAmount =
      totalDirectDiscountAmount + couponDiscountAmount;

    // Tổng tiền sau Direct Discount và Coupon.
    // Chưa bao gồm phí vận chuyển.

    const totalAmount = Math.max(
      0,
      subtotal - couponDiscountAmount,
    );

    // ========================================================
    // 15. BUILD RESULT
    // ========================================================

    const result = {
      requestedCount: normalizedItems.length,
      foundCount: products.length,

      totalQuantity,

      notFoundSkus,

      products,

      // Tổng tiền trước giảm giá.
      originalSubtotal,

      // Tổng tiền sau Direct Discount.
      // Giữ nguyên ý nghĩa field cũ để tương thích.
      subtotal,

      totalDirectDiscountAmount,

      // Thông tin coupon.
      couponId: calculatedCoupon?.couponId ?? null,

      couponName: calculatedCoupon?.couponName ?? null,

      couponApplied: calculatedCoupon?.applied ?? false,

      couponDiscountAmount,

      coupon: calculatedCoupon,

      // Tổng giảm giá.
      discountAmount,

      // Tổng thanh toán sau tất cả giảm giá.
      // Chưa bao gồm phí vận chuyển.
      totalAmount,
    };

    // ========================================================
    // 16. LOG RESULT
    // ========================================================

    console.log(
      '\n========== FINAL PRICE RESULT ==========',
    );

    console.log(
      JSON.stringify(result, null, 2),
    );

    return result;
  }
}