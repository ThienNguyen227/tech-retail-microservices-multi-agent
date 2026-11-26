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

interface UpdateWarrantyRequest {
  warranty_request_status_id: number;
}

@Injectable()
export class UpdateWarrantyRequestService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // ALLOWED STATUS TRANSITIONS
  // ======================================================

  private readonly allowedTransitions: Record<string, string[]> = {
    RECEIVED: ['INSPECTING', 'REJECTED'],

    INSPECTING: ['IN_REPAIR', 'COMPLETED', 'REJECTED'],

    IN_REPAIR: ['COMPLETED'],

    COMPLETED: [],

    REJECTED: [],
  };

  // 1. (PATCH) UPDATE WARRANTY REQUEST STATUS
  async updateWarrantyRequest(
    accessToken: string,
    warrantyRequestId: number,
    body: UpdateWarrantyRequest,
  ) {
    // ======================================================
    // 1. CHECK PERMISSION THROUGH USER-SERVICE
    // ======================================================

    const userServiceUrl = process.env.USER_SERVICE_URL;

    if (!userServiceUrl) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình địa chỉ user-service.',
      );
    }

    let allowed: boolean;

    try {
      const response = await axios.post<{ allowed: boolean }>(
        `${userServiceUrl.replace(/\/+$/, '')}/api/v1/admin-session/user-service/check-permission`,
        {
          permission_name: 'warranty-request-status:update',
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
        'Bạn không có quyền cập nhật yêu cầu bảo hành.',
      );
    }

    if (!Number.isInteger(warrantyRequestId) || warrantyRequestId <= 0) {
      throw new BadRequestException(
        'ID yêu cầu bảo hành không hợp lệ.',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // ======================================================
        // 2. LOCK WARRANTY REQUEST ROW
        // ======================================================

        const lockedWarrantyRequest = await tx.$queryRaw<
          Array<{ warranty_request_id: number }>
        >`
          SELECT warranty_request_id
          FROM warranty_requests
          WHERE warranty_request_id = ${warrantyRequestId}
          FOR UPDATE
        `;

        if (lockedWarrantyRequest.length === 0) {
          throw new NotFoundException(
            'Không tìm thấy yêu cầu bảo hành.',
          );
        }

        // ======================================================
        // 3. GET CURRENT WARRANTY REQUEST
        // ======================================================

        const warrantyRequest = await tx.warrantyRequest.findUnique({
          where: {
            warranty_request_id: warrantyRequestId,
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

        if (!warrantyRequest) {
          throw new NotFoundException(
            'Không tìm thấy yêu cầu bảo hành.',
          );
        }

        // ======================================================
        // 4. CHECK TARGET STATUS
        // ======================================================

        const targetStatus = await tx.warrantyRequestStatus.findUnique({
          where: {
            warranty_request_status_id:
              body.warranty_request_status_id,
          },
        });

        if (!targetStatus) {
          throw new NotFoundException(
            'Không tìm thấy trạng thái yêu cầu bảo hành.',
          );
        }

        // ======================================================
        // 5. GET CURRENT AND TARGET STATUS CODE
        // ======================================================

        const currentStatusCode =
          warrantyRequest.status.warranty_request_status_code;

        const targetStatusCode =
          targetStatus.warranty_request_status_code;

        // ======================================================
        // 6. CHECK DUPLICATE STATUS
        // ======================================================

        if (currentStatusCode === targetStatusCode) {
          return {
            success: true,
            message: 'Yêu cầu bảo hành đã ở trạng thái này.',
            data: warrantyRequest,
          };
        }

        // ======================================================
        // 7. VALIDATE STATUS TRANSITION
        // ======================================================

        const allowedStatuses =
          this.allowedTransitions[currentStatusCode] ?? [];

        if (!allowedStatuses.includes(targetStatusCode)) {
          throw new BadRequestException(
            `Không thể chuyển trạng thái yêu cầu bảo hành từ ` +
            `${warrantyRequest.status.warranty_request_status_name} ` +
            `sang ${targetStatus.warranty_request_status_name}.`,
          );
        }

        // ======================================================
        // 8. UPDATE WARRANTY REQUEST
        // ======================================================

        const data = await tx.warrantyRequest.update({
          where: {
            warranty_request_id: warrantyRequestId,
          },
          data: {
            warranty_request_status_id:
              targetStatus.warranty_request_status_id,

            warranty_request_completed_at:
              targetStatusCode === 'COMPLETED'
                ? new Date()
                : null,
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

        // ======================================================
        // 9. RETURN RESULT
        // ======================================================

        return {
          success: true,
          message:
            'Cập nhật trạng thái yêu cầu bảo hành thành công.',
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

      console.error('UPDATE WARRANTY REQUEST ERROR:', error);

      throw new InternalServerErrorException(
        'Không thể cập nhật trạng thái yêu cầu bảo hành.',
      );
    }
  }
}