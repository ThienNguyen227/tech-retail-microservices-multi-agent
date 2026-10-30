
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GetWarrantyService {
  constructor(private readonly prisma: PrismaService) {}

  async getWarrantyInfomation(
    userId: string,
    search?: string,
    status?: string,
  ) {
    try {
      const warranties = await this.prisma.warranty.findMany({
        where: {
          user_id: Number(userId),

          ...(search?.trim()
            ? {
                OR: [
                  {
                    warranty_code: {
                      contains: search.trim(),
                      mode: 'insensitive',
                    },
                  },
                  {
                    order_code: {
                      contains: search.trim(),
                      mode: 'insensitive',
                    },
                  },
                  {
                    warranty_product_name: {
                      contains: search.trim(),
                      mode: 'insensitive',
                    },
                  },
                  {
                    warranty_sku: {
                      contains: search.trim(),
                      mode: 'insensitive',
                    },
                  },
                  {
                    warranty_serial_number: {
                      contains: search.trim(),
                      mode: 'insensitive',
                    },
                  },
                ],
              }
            : {}),

          ...(status
            ? {
                status: {
                  warranty_status_code: status,
                },
              }
            : {}),
        },

        select: {
          // ==================================================
          // 1. WARRANTY INFORMATION
          // ==================================================
          warranty_id: true,
          warranty_code: true,

          user_id: true,
          order_id: true,
          order_code: true,
          order_item_id: true,

          warranty_product_name: true,
          warranty_product_image: true,
          warranty_sku: true,
          warranty_serial_number: true,

          warranty_start_date: true,
          warranty_end_date: true,
          warranty_duration_months: true,

          warranty_created_at: true,
          warranty_updated_at: true,

          warranty_status_id: true,

          // ==================================================
          // 2. WARRANTY STATUS
          // ==================================================
          status: {
            select: {
              warranty_status_id: true,
              warranty_status_code: true,
              warranty_status_name: true,
            },
          },

          // ==================================================
          // 3. WARRANTY REQUEST HISTORY
          // ==================================================
          requests: {
            select: {
              warranty_request_id: true,
              warranty_request_code: true,
              warranty_request_description: true,

              warranty_request_received_at: true,
              warranty_request_completed_at: true,

              warranty_request_created_at: true,
              warranty_request_updated_at: true,

              warranty_id: true,

              warranty_request_type_id: true,
              warranty_request_status_id: true,

              // ----------------------------------------------
              // 3.1. REQUEST TYPE
              // ----------------------------------------------
              type: {
                select: {
                  warranty_request_type_id: true,
                  warranty_request_type_code: true,
                  warranty_request_type_name: true,
                },
              },

              // ----------------------------------------------
              // 3.2. REQUEST STATUS
              // ----------------------------------------------
              status: {
                select: {
                  warranty_request_status_id: true,
                  warranty_request_status_code: true,
                  warranty_request_status_name: true,
                },
              },
            },

            orderBy: {
              warranty_request_created_at: 'desc',
            },
          },
        },

        orderBy: {
          warranty_created_at: 'desc',
        },
      });

      return {
        success: true,
        message: 'Lấy danh sách bảo hành thành công!',
        total: warranties.length,
        data: warranties,
      };
    } catch (error) {
      console.error(
        'GET WARRANTY INFORMATION ERROR:',
        error instanceof Error ? error.stack : error,
      );

      throw new InternalServerErrorException(
        'Không thể lấy thông tin bảo hành',
      );
    }
  }
}
