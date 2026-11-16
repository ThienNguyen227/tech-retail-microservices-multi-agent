import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

interface CreateCustomerEventData {
  user_id: number | string;
}

@Injectable()
export class CreateCustomerService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // CREATE-CUSTOMER
  async createCustomer(
    eventId: number,
    eventType: string,
    data: CreateCustomerEventData,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {

          // ======================================================
          // 1. KIỂM TRA EVENT ĐÃ XỬ LÝ CHƯA
          // ======================================================

          const processedEvent = await tx.processedEvent.findUnique({
            where: {
              processed_event_event_id: eventId,
            },
            select: {
              processed_event_id: true,
            },
          });

          if (processedEvent) {
            return {
              success: true,
              alreadyProcessed: true,
              message: 'Event đã được xử lý trước đó!',
            };
          }

          // ======================================================
          // 2. VALIDATE DATA
          // ======================================================

          if (
            !Number.isInteger(eventId) ||
            eventId <= 0
          ) {
            throw new BadRequestException(
              'Event ID không hợp lệ!',
            );
          }

          if (eventType !== 'user.created') {
            throw new BadRequestException(
              'Event type không hợp lệ!',
            );
          }

          if (
            !data ||
            data.user_id === undefined ||
            data.user_id === null
          ) {
            throw new BadRequestException(
              'Không tìm thấy user_id!',
            );
          }

          const userIdString = String(data.user_id);

          if (!/^[1-9]\d*$/.test(userIdString)) {
            throw new BadRequestException(
              'User ID không hợp lệ!',
            );
          }

          const customerUserId = BigInt(userIdString);

          // ======================================================
          // 3. KIỂM TRA CUSTOMER ĐÃ TỒN TẠI CHƯA
          // ======================================================

          const existedCustomer = await tx.customer.findUnique({
            where: {
              customer_user_id: customerUserId,
            },
            select: {
              customer_id: true,
            },
          });

          // ======================================================
          // 4. CREATE CUSTOMER
          // ======================================================

          if (!existedCustomer) {

            await tx.customer.create({
              data: {
                customer_user_id: customerUserId,

                customer_code:
                  `CUS${userIdString.padStart(6, '0')}`,

                customer_status: 'ACTIVE',
              },
            });

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
            message: existedCustomer
              ? 'Customer đã tồn tại, event được ghi nhận thành công!'
              : 'Tạo Customer thành công!',
          };

        },
      );

    } catch (error) {

      // ======================================================
      // BAD REQUEST
      // ======================================================

      if (error instanceof BadRequestException) {
        throw error;
      }

      // ======================================================
      // INTERNAL ERROR
      // ======================================================

      console.error(
        'CREATE CUSTOMER ERROR:',
        error,
      );

      throw new InternalServerErrorException(
        'Không thể tạo Customer',
      );
    }
  }
}