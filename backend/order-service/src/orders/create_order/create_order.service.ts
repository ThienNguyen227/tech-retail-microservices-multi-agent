import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from '../dto/create_order/create_order.dto';

interface InventoryGrpcService {
  checkStock(data: {
    branch_id: number;
    items: { sku: string; quantity: number }[];
  }): Observable<{
    is_valid: boolean;
    message: string;
    reserved_serials: {
      sku: string;
      serial_numbers: string[];
    }[];
  }>;
}

@Injectable()
export class CreateOrderService implements OnModuleInit {
  private inventoryGrpcService: InventoryGrpcService;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('INVENTORY_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    // Khởi tạo gRPC Service client từ INVENTORY_PACKAGE
    this.inventoryGrpcService =
      this.client.getService<InventoryGrpcService>('InventoryService');
  }

  async createOrder(dto: CreateOrderDto) {
    // ==========================================
    // 1. KIỂM TRA DANH SÁCH SẢN PHẨM
    // ==========================================
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Đơn hàng phải có ít nhất 1 sản phẩm');
    }

    // ==========================================
    // 2. GỌI gRPC SANG INVENTORY
    //    - Kiểm tra tồn kho
    //    - Trừ tồn kho
    //    - Reserve serial
    // ==========================================
    let reservedSerials: {
      sku: string;
      serial_numbers: string[];
    }[] = [];

    try {
      const branchId =
        dto.fulfillmentType === 'STORE_PICKUP' ? 2 : 1;

      console.log(
        '[gRPC] Gọi sang Inventory Service để kiểm tra, trừ kho và reserve serial...',
      );

      const checkStockRes = await firstValueFrom(
        this.inventoryGrpcService.checkStock({
          branch_id: branchId,
          items: dto.items.map((item) => ({
            sku: item.sku,
            quantity: Number(item.quantity) || 1,
          })),
        }),
      );

      console.log('[gRPC] Kết quả từ Inventory:', checkStockRes);
      console.log('is_valid:', checkStockRes.is_valid);
      console.log('reserved_serials:', checkStockRes.reserved_serials);

      if (!checkStockRes.is_valid) {
        throw new BadRequestException(
          checkStockRes.message || 'Sản phẩm trong kho không đủ',
        );
      }

      // Lưu danh sách serial Inventory đã RESERVED
      reservedSerials = checkStockRes.reserved_serials || [];

      console.log(
        '[gRPC] Serial đã được Inventory RESERVED:',
        reservedSerials,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error(
        'Lỗi khi gọi gRPC Inventory Service:',
        error,
      );

      throw new InternalServerErrorException(
        'Không thể kiểm tra tồn kho lúc này, vui lòng thử lại sau',
      );
    }

    // ==========================================
    // 3. XÁC ĐỊNH PHƯƠNG THỨC NHẬN HÀNG
    //    1: HOME_DELIVERY
    //    2: STORE_PICKUP
    // ==========================================
    let deliveryMethodId = 1;

    if (dto.deliveryMethodId) {
      deliveryMethodId = Number(dto.deliveryMethodId);
    } else if (dto.fulfillmentType === 'STORE_PICKUP') {
      deliveryMethodId = 2;
    }

    // ==========================================
    // 4. XÁC ĐỊNH PHƯƠNG THỨC THANH TOÁN
    //    1: COD
    //    2: MOMO
    //    3: VNPAY
    // ==========================================
    let paymentMethodId = 1;

    if (dto.paymentMethodId) {
      paymentMethodId = Number(dto.paymentMethodId);
    } else if (dto.paymentMethod?.toUpperCase() === 'MOMO') {
      paymentMethodId = 2;
    } else if (dto.paymentMethod?.toUpperCase() === 'VNPAY') {
      paymentMethodId = 3;
    }

    // ==========================================
    // 5. TÍNH TOÁN TIỀN HÀNG
    // ==========================================
    const calculatedSubtotal = dto.items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;

      return sum + price * qty;
    }, 0);

    const subtotal =
      Number(dto.subtotal) || calculatedSubtotal;

    const shippingFee =
      Number(dto.shippingFee) || 0;

    const discountAmount =
      Number(dto.discountAmount) || 0;

    const totalAmount =
      Number(dto.totalAmount) ||
      Math.max(
        0,
        subtotal + shippingFee - discountAmount,
      );

    // ==========================================
    // 6. SINH MÃ ĐƠN HÀNG DUY NHẤT
    // ==========================================
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);

    const orderCode = `ORD-${timestamp}-${random}`;

    // ==========================================
    // 7. TẠO ĐƠN HÀNG VÀO DATABASE
    // ==========================================
    let newOrder;

    try {
      newOrder = await this.prisma.order.create({
        data: {
          order_code: orderCode,
          order_user_id: Number(dto.userId) || 1,

          // Trạng thái khởi tạo:
          // Processing = 1
          // Payment = 1 (UNPAID)
          order_order_processing_status_id: 1,
          order_order_payment_status_id: 1,

          order_order_delivery_method_id:
            deliveryMethodId,

          order_order_payment_method_id:
            paymentMethodId,

          order_recipient_name:
            (dto.recipientName || 'Khách hàng').trim(),

          order_recipient_phone:
            (dto.recipientPhone || '').trim(),

          order_address_line:
            (dto.addressLine || 'Tại cửa hàng').trim(),

          order_ward:
            (dto.ward || '').trim(),

          order_province:
            (dto.province || '').trim(),

          order_subtotal: subtotal,
          order_shipping_fee: shippingFee,
          order_discount_amount: discountAmount,
          order_total_amount: totalAmount,

          // ==========================================
          // ORDER ITEMS
          // ==========================================
          order_item: {
            create: dto.items.map((item) => {
              const unitPrice =
                Number(item.price) || 0;

              const quantity =
                Number(item.quantity) || 1;

              const itemSubtotal =
                Number(item.subtotal) ||
                unitPrice * quantity;

              // Tìm serial mà Inventory đã RESERVED
              const reservedItem =
                reservedSerials.find(
                  (reserved) =>
                    reserved.sku === item.sku,
                );

              // Với thiết kế hiện tại:
              // OrderItem chỉ lưu 1 serial_number
              const serialNumber =
                reservedItem?.serial_numbers?.[0] ??
                null;

              console.log(
                `[ORDER ITEM] SKU=${item.sku}, Serial=${serialNumber}`,
              );

              return {
                order_item_sku: item.sku,

                order_item_product_name:
                  item.productName || item.sku,

                order_item_product_image:
                  item.imageUrl || '',

                order_item_unit_price:
                  unitPrice,

                order_item_quantity:
                  quantity,

                order_item_subtotal:
                  itemSubtotal,

                // KHÔNG lấy serial từ frontend nữa
                // Lấy serial do Inventory RESERVED
                order_item_serial_number:
                  serialNumber,
              };
            }),
          },
        },

        include: {
          order_item: true,
          order_processing_status: true,
          order_payment_status: true,
          order_delivery_method: true,
          order_payment_method: true,
        },
      });

      console.log(
        '✅ [ORDER CREATED] Tạo đơn hàng thành công, Code:',
        orderCode,
      );
    } catch (error: any) {
      console.error(
        '❌ Lỗi khi tạo đơn hàng trong database:',
        error,
      );

      throw new InternalServerErrorException(
        `Không thể tạo đơn hàng: ${
          error?.message || error
        }`,
      );
    }

    // ==========================================
    // 8. TỰ ĐỘNG XÓA GIỎ HÀNG (BEST-EFFORT)
    // ==========================================
    try {
      const clearRes = await fetch(
        `http://localhost:3004/api/v1/carts/clear?userId=${dto.userId}`,
        {
          method: 'DELETE',
        },
      );

      console.log(
        `[CLEAR CART] Xóa giỏ hàng userId=${dto.userId}, Status=${clearRes.status}`,
      );
    } catch (cartError) {
      console.warn(
        'Không thể tự động xóa giỏ hàng:',
        cartError,
      );
    }

    // ==========================================
    // 9. RETURN ORDER
    // ==========================================
    return newOrder;
  }
}

