import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from '../dto/create_order/create_order.dto';

@Injectable()
export class CreateOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    // 1. Kiểm tra danh sách sản phẩm
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Đơn hàng phải có ít nhất 1 sản phẩm');
    }

    // 2. Xác định phương thức nhận hàng (1: Giao hàng tận nơi, 2: Nhận tại cửa hàng)
    let deliveryMethodId = 1;
    if (dto.deliveryMethodId) {
      deliveryMethodId = Number(dto.deliveryMethodId);
    } else if (dto.fulfillmentType === 'STORE_PICKUP') {
      deliveryMethodId = 2;
    }

    // 3. Xác định phương thức thanh toán (1: COD, 2: MOMO, 3: VNPAY)
    let paymentMethodId = 1;
    if (dto.paymentMethodId) {
      paymentMethodId = Number(dto.paymentMethodId);
    } else if (dto.paymentMethod?.toUpperCase() === 'MOMO') {
      paymentMethodId = 2;
    } else if (dto.paymentMethod?.toUpperCase() === 'VNPAY') {
      paymentMethodId = 3;
    }

    // 4. Tính toán tiền hàng
    const calculatedSubtotal = dto.items.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);

    const subtotal =
      dto.subtotal !== undefined ? Number(dto.subtotal) : calculatedSubtotal;
    const shippingFee = Number(dto.shippingFee ?? 0);
    const discountAmount = Number(dto.discountAmount ?? 0);
    const totalAmount =
      dto.totalAmount !== undefined
        ? Number(dto.totalAmount)
        : Math.max(0, subtotal + shippingFee - discountAmount);

    // 5. Sinh mã đơn hàng duy nhất
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `ORD-${timestamp}-${random}`;

    // 6. Tạo đơn hàng và chi tiết sản phẩm vào Database
    let newOrder;
    try {
      newOrder = await this.prisma.order.create({
        data: {
          order_code: orderCode,
          order_user_id: Number(dto.userId),

          // Trạng thái mặc định: 1 (PENDING - Chờ xác nhận / Chưa thanh toán)
          order_order_processing_status_id: 1,
          order_order_payment_status_id: 1,

          order_order_delivery_method_id: deliveryMethodId,
          order_order_payment_method_id: paymentMethodId,

          order_recipient_name: dto.recipientName.trim(),
          order_recipient_phone: dto.recipientPhone.trim(),
          order_address_line: dto.addressLine.trim(),
          order_ward: dto.ward.trim(),
          order_province: dto.province.trim(),

          order_subtotal: subtotal,
          order_shipping_fee: shippingFee,
          order_discount_amount: discountAmount,
          order_total_amount: totalAmount,

          order_item: {
            create: dto.items.map((item) => ({
              order_item_sku: item.sku,
              order_item_product_name: item.productName,
              order_item_product_image: item.imageUrl || '',
              order_item_unit_price: Number(item.price),
              order_item_quantity: Number(item.quantity),
              order_item_subtotal: Number(
                item.subtotal ?? Number(item.price) * Number(item.quantity),
              ),
              order_item_serial_number: item.serialNumber ?? null,
            })),
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
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng trong database:', error);
      throw new InternalServerErrorException('Không thể tạo đơn hàng');
    }

    // 7. Thử xóa giỏ hàng (nếu cart service đang chạy, không làm gián đoạn nếu lỗi)
    try {
      await fetch(
        `http://localhost:3004/api/v1/carts/clear?userId=${dto.userId}`,
        {
          method: 'DELETE',
        },
      );
    } catch (cartError) {
      console.warn('Không thể tự động xóa giỏ hàng:', cartError);
    }

    return newOrder;
  }
}