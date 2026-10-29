import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

interface OrderWarrantyItem {
  orderItemId: number;
  sku: string;
  serialNumber: string | null;
  productName: string;
  productImage: string;
  quantity: number;
}

interface OrderWarrantyData {
  orderId: number;
  orderCode: string;
  userId: number;
  items: OrderWarrantyItem[];
}

@Injectable()
export class CreateWarrantyService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Có thể thay đổi theo chính sách bảo hành của hệ thống
  private readonly warrantyDurationMonths = 12;

  async handleOrderWarrantyEligible(
    eventId: number,
    eventType: string,
    data: OrderWarrantyData,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // ======================================================
          // 1. KIỂM TRA EVENT ĐÃ XỬ LÝ CHƯA
          // ======================================================

          const processedEvent =
            await tx.processedEvent.findUnique({
              where: {
                processed_event_event_id: eventId,
              },
            });

          if (processedEvent) {
            return {
              success: true,
              alreadyProcessed: true,
              message: 'Event đã được xử lý trước đó',
            };
          }

          // ======================================================
          // 2. KIỂM TRA DỮ LIỆU ĐƠN HÀNG
          // ======================================================

          if (
            !data ||
            !data.orderId ||
            !data.orderCode ||
            !data.userId ||
            !Array.isArray(data.items) ||
            data.items.length === 0
          ) {
            throw new BadRequestException(
              'Dữ liệu đơn hàng không hợp lệ',
            );
          }

          for (const item of data.items) {
            if (
              !item.orderItemId ||
              !item.sku ||
              !Number.isInteger(item.quantity) ||
              item.quantity <= 0
            ) {
              throw new BadRequestException(
                'Thông tin sản phẩm trong đơn hàng không hợp lệ',
              );
            }
          }

          // ======================================================
          // 3. LẤY TRẠNG THÁI BẢO HÀNH ACTIVE
          // ======================================================

          const activeStatus =
            await tx.warrantyStatus.findUnique({
              where: {
                warranty_status_code: 'ACTIVE',
              },
            });

          if (!activeStatus) {
            throw new BadRequestException(
              'Không tìm thấy trạng thái bảo hành ACTIVE',
            );
          }

          // ======================================================
          // 4. TẠO PHIẾU BẢO HÀNH
          // ======================================================

          const createdWarranties = [];

          for (const item of data.items) {
            const warrantyStartDate = new Date();

            const warrantyEndDate = new Date(
              warrantyStartDate,
            );

            warrantyEndDate.setMonth(
              warrantyEndDate.getMonth() +
                this.warrantyDurationMonths,
            );

            const warranty =
              await tx.warranty.create({
                data: {
                  warranty_code: `WAR-${randomUUID()}`,

                  user_id: data.userId,
                  order_id: data.orderId,
                  order_code: data.orderCode,
                  order_item_id: item.orderItemId,
                  warranty_product_name: item.productName,
                  warranty_product_image: item.productImage,
                  warranty_sku: item.sku,
                  warranty_serial_number:item.serialNumber,
                  warranty_start_date: warrantyStartDate,
                  warranty_end_date: warrantyEndDate,
                  warranty_duration_months: this.warrantyDurationMonths,
                  warranty_status_id: activeStatus.warranty_status_id,
                },
              });

            createdWarranties.push(warranty);
          }

          // ======================================================
          // 5. ĐÁNH DẤU EVENT ĐÃ XỬ LÝ
          // ======================================================

          await tx.processedEvent.create({
            data: {
              processed_event_event_id: eventId,
              processed_event_event_type: eventType,
            },
          });

          // ======================================================
          // 6. TRANSACTION COMMIT
          // ======================================================

          return {
            success: true,
            alreadyProcessed: false,
            message: 'Tạo phiếu bảo hành thành công',
            count: createdWarranties.length,
            warranties: createdWarranties,
          };
        },
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error(
        'CREATE WARRANTY ERROR:',
        error instanceof Error
          ? error.stack
          : error,
      );

      throw new InternalServerErrorException(
        'Không thể tạo phiếu bảo hành',
      );
    }
  }
}