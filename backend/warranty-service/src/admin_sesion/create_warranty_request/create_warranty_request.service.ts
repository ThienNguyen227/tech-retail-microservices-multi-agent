import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

interface WarrantyRequest {
  warranty_request_description: string;
  warranty_id: number;
  warranty_request_type_id: number;
}

@Injectable()
export class CreateWarrantyRequestService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. (POST) CREATE WARRANTY REQUEST
  async createWarrantyRequest(
    accessToken: string,
    body: WarrantyRequest,
  ) {
    // ======================================================
    // 1. CHECK PERMISSION THROUGH USER-SERVICE
    // ======================================================
    const userServiceUrl = 'http://localhost:3001';

    let allowed: boolean;

    try {
      const response = await axios.post<{ allowed: boolean }>(
        `${userServiceUrl}/api/v1/admin-session/user-service/check-permission`,
        {
          permission_name: 'warranty-request:create',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000,
        },
      );

      allowed = response.data.allowed;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new UnauthorizedException(
            'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
          );
        }

        if (error.response?.status === 403) {
          throw new ForbiddenException(
            'Bạn không có quyền kiểm tra quyền truy cập.',
          );
        }
      }

      throw new ServiceUnavailableException(
        'Không thể xác minh quyền truy cập từ user-service.',
      );
    }

    if (allowed !== true) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo yêu cầu bảo hành.',
      );
    }
    
    try {
      return await this.prisma.$transaction(async (tx) => {
        // ======================================================
        // 1. LOCK WARRANTY ROW
        // ======================================================
        const lockedWarranty = await tx.$queryRaw<
          Array<{ warranty_id: number }>
        >`
          SELECT warranty_id
          FROM warranties
          WHERE warranty_id = ${body.warranty_id}
          FOR UPDATE
        `;

        if (lockedWarranty.length === 0) {
          throw new NotFoundException(
            'Không tìm thấy phiếu bảo hành.',
          );
        }

        // ======================================================
        // 2. CHECK WARRANTY
        // ======================================================
        const warranty = await tx.warranty.findUnique({
          where: {
            warranty_id: body.warranty_id,
          },
          include: {
            status: true,
          },
        });

        if (!warranty) {
          throw new NotFoundException(
            'Không tìm thấy phiếu bảo hành.',
          );
        }

        // ======================================================
        // 3. CHECK EXISTING ACTIVE REQUEST
        // ======================================================
        const activeRequest = await tx.warrantyRequest.findFirst({
          where: {
            warranty_id: body.warranty_id,
            status: {
              is: {
                warranty_request_status_code: {
                  in: ['RECEIVED', 'INSPECTING', 'IN_REPAIR'],
                },
              },
            },
          },
        });

        if (activeRequest) {
          throw new BadRequestException(
            `Sản phẩm đang trong quá trình xử lý bảo hành/sửa chữa. Mã yêu cầu: ${activeRequest.warranty_request_code}. Vui lòng chờ yêu cầu hiện tại hoàn tất.`,
          );
        }

        // ======================================================
        // 4. CHECK WARRANTY STATUS
        // ======================================================
        if (warranty.status.warranty_status_code !== 'ACTIVE') {
          throw new BadRequestException(
            'Phiếu bảo hành không còn hiệu lực, không thể tạo yêu cầu bảo hành!',
          );
        }

        // ======================================================
        // 5. CHECK REQUEST TYPE
        // ======================================================
        const requestType = await tx.warrantyRequestType.findUnique({
          where: {
            warranty_request_type_id: body.warranty_request_type_id,
          },
        });

        if (!requestType) {
          throw new NotFoundException(
            'Không tìm thấy loại yêu cầu bảo hành.',
          );
        }

        if (!['WARRANTY', 'REPAIR'].includes(
          requestType.warranty_request_type_code,
        )) {
          throw new BadRequestException(
            'Loại yêu cầu bảo hành không hợp lệ.',
          );
        }

        // ======================================================
        // 6. GET DEFAULT REQUEST STATUS
        // ======================================================
        const requestStatus =
          await tx.warrantyRequestStatus.findUnique({
            where: {
              warranty_request_status_code: 'RECEIVED',
            },
          });

        if (!requestStatus) {
          throw new NotFoundException(
            'Không tìm thấy trạng thái tiếp nhận yêu cầu bảo hành.',
          );
        }

        // ======================================================
        // 7. CREATE WARRANTY REQUEST
        // ======================================================
        const warrantyRequestCode = `WR-${Date.now()}`;

        // await new Promise((resolve) => setTimeout(resolve, 3000));

        const data = await tx.warrantyRequest.create({
          data: {
            warranty_request_code: warrantyRequestCode,

            warranty_request_description:
              body.warranty_request_description.trim(),

            warranty_id: body.warranty_id,

            warranty_request_type_id:
              body.warranty_request_type_id,

            warranty_request_status_id:
              requestStatus.warranty_request_status_id,

            warranty_request_received_at: new Date(),

            warranty_request_completed_at: null,
          },
          include: {
            warranty: {
              select: {
                warranty_id: true,
                warranty_code: true,
                warranty_product_name: true,
                warranty_sku: true,
                warranty_serial_number: true,
              },
            },
            type: true,
            status: true,
          },
        });

        return {
          success: true,
          message: 'Tạo yêu cầu bảo hành thành công.',
          data,
        };
        
      });
      
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('CREATE WARRANTY REQUEST ERROR:', error);

      throw new InternalServerErrorException(
        'Không thể tạo yêu cầu bảo hành.',
      );
    }
  }
}