import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createOrder(data: any) {
    // =========================
    // 1. VALIDATE DỮ LIỆU
    // =========================

    if (!data.userId) {
      throw new BadRequestException('Thiếu userId');
    }

    if (!data.fulfillmentType) {
      throw new BadRequestException('Thiếu hình thức nhận hàng');
    }

    if (
      data.fulfillmentType !== 'HOME_DELIVERY' &&
      data.fulfillmentType !== 'STORE_PICKUP'
    ) {
      throw new BadRequestException(
        'Hình thức nhận hàng không hợp lệ',
      );
    }

    if (!data.recipientName?.trim()) {
      throw new BadRequestException('Thiếu tên người nhận');
    }

    if (!data.recipientPhone?.trim()) {
      throw new BadRequestException(
        'Thiếu số điện thoại người nhận',
      );
    }

    if (!data.addressLine?.trim()) {
      throw new BadRequestException('Thiếu địa chỉ');
    }

    if (!data.ward?.trim()) {
      throw new BadRequestException('Thiếu phường/xã');
    }

    if (!data.province?.trim()) {
      throw new BadRequestException('Thiếu tỉnh/thành phố');
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new BadRequestException('Đơn hàng không có sản phẩm');
    }

    // =========================
    // 2. VALIDATE SẢN PHẨM
    // =========================

    for (const item of data.items) {
      if (!item.sku?.trim()) {
        throw new BadRequestException('Sản phẩm thiếu SKU');
      }

      if (!item.productName?.trim()) {
        throw new BadRequestException(
          `Sản phẩm ${item.sku} thiếu tên`,
        );
      }

      if (!item.imageUrl?.trim()) {
        throw new BadRequestException(
          `Sản phẩm ${item.sku} thiếu hình ảnh`,
        );
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestException(
          `Số lượng sản phẩm ${item.sku} không hợp lệ`,
        );
      }

      if (item.price === undefined || item.price < 0) {
        throw new BadRequestException(
          `Giá sản phẩm ${item.sku} không hợp lệ`,
        );
      }
    }

    // =========================
    // 3. TÍNH LẠI TIỀN
    // =========================

    const subtotal = data.items.reduce(
      (total: number, item: any) => {
        return (
          total +
          Number(item.price) * Number(item.quantity)
        );
      },
      0,
    );

    const shippingFee = Number(data.shippingFee ?? 0);
    const discountAmount = Number(data.discountAmount ?? 0);

    const totalAmount =
      subtotal + shippingFee - discountAmount;

    // =========================
    // 4. GỌI INVENTORY SERVICE
    //    KIỂM TRA + TRỪ TỒN KHO
    // =========================

    try {
      const inventoryResponse = await fetch(
        'http://localhost:3006/api/v1/inventories/reserve',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            branchId: 1,
            items: data.items.map((item: any) => ({
              sku: item.sku,
              quantity: Number(item.quantity),
            })),
          }),
        },
      );

      const inventoryData = await inventoryResponse.json();

      if (!inventoryResponse.ok) {
        throw new BadRequestException(
          inventoryData.message ||
            'Không đủ tồn kho',
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Không thể kết nối Inventory Service',
      );
    }

    // =========================
    // 5. TẠO ORDER
    // =========================

    const orderCode = `ORD-${Date.now()}`;

    let order;

    try {
      order = await this.prisma.order.create({
        data: {
          order_code: orderCode,

          order_user_id: BigInt(data.userId),

          order_fulfillment_type:
            data.fulfillmentType,

          order_recipient_name:
            data.recipientName.trim(),

          order_recipient_phone:
            data.recipientPhone.trim(),

          order_address_line:
            data.addressLine.trim(),

          order_ward:
            data.ward.trim(),

          order_province:
            data.province.trim(),

          order_subtotal: subtotal,

          order_shipping_fee: shippingFee,

          order_discount_amount: discountAmount,

          order_total_amount: totalAmount,

          order_items: {
            create: data.items.map((item: any) => ({
              order_item_sku: item.sku,

              order_item_product_name:
                item.productName,

              order_item_product_image:
                item.imageUrl,

              order_item_unit_price:
                Number(item.price),

              order_item_quantity:
                Number(item.quantity),

              order_item_subtotal:
                Number(item.price) *
                Number(item.quantity),
            })),
          },
        },

        include: {
          order_items: true,
        },
      });
    } catch (error) {
      // TODO:
      // Nếu tạo Order thất bại thì sau này
      // gọi Inventory Service để hoàn tồn kho.

      throw new InternalServerErrorException(
        'Không thể tạo đơn hàng',
      );
    }

    // =========================
    // 6. GỌI CART SERVICE
    //    XÓA GIỎ HÀNG
    // =========================

    try {
      const cartResponse = await fetch(
        `http://localhost:3004/api/v1/carts/clear?userId=${data.userId}`,
        {
          method: 'DELETE',
        },
      );

      if (!cartResponse.ok) {
        const cartData = await cartResponse.json();

        throw new Error(
          cartData.message ||
            'Không thể xóa giỏ hàng',
        );
      }
    } catch (error) {
      // Order đã tạo thành công.
      // Không xóa Order chỉ vì Cart lỗi.
      console.error(
        'CLEAR CART ERROR:',
        error,
      );
    }

    // =========================
    // 7. RETURN ORDER
    // =========================

    return this.serialize(order);
  }

  private serialize(data: any): any {
    return JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === 'bigint'
          ? value.toString()
          : value,
      ),
    );
  }

  async getOrders(userId?: string) {
    const orders = await this.prisma.order.findMany({
      where: userId
        ? {
            order_user_id: BigInt(userId),
          }
        : undefined,

      include: {
        order_items: true,
      },

      orderBy: {
        order_created_at: 'desc',
      },
    });

    return this.serialize(orders);
  }
}