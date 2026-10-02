import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    // await this.initMasterData();
  }

  // /**
  //  * Tự động khởi tạo dữ liệu danh mục (Masterdata) nếu database chưa có
  //  * Tránh lỗi Foreign Key Constraint khi tạo đơn hàng
  //  */
  // private async initMasterData() {
  //   try {
  //     // 1. Trạng thái xử lý (Order Processing Status)
  //     const processingStatuses = [
  //       { id: 1, code: 'PENDING', name: 'Chờ xác nhận' },
  //       { id: 2, code: 'CONFIRMED', name: 'Đã xác nhận' },
  //       { id: 3, code: 'PROCESSING', name: 'Đang xử lý' },
  //       { id: 4, code: 'READY_FOR_PICKUP', name: 'Sẵn sàng nhận hàng' },
  //       { id: 5, code: 'SHIPPING', name: 'Đang giao hàng' },
  //       { id: 6, code: 'DELIVERED', name: 'Đã giao hàng' },
  //       { id: 7, code: 'COMPLETED', name: 'Hoàn thành' },
  //       { id: 8, code: 'CANCELLED', name: 'Đã hủy' },
  //       { id: 9, code: 'FAILED', name: 'Thất bại' },
  //     ];
  //     for (const s of processingStatuses) {
  //       await this.orderProcessingStatus.upsert({
  //         where: { order_processing_status_code: s.code },
  //         update: {},
  //         create: {
  //           order_processing_status_id: s.id,
  //           order_processing_status_code: s.code,
  //           order_processing_status_name: s.name,
  //         },
  //       });
  //     }

  //     // 2. Trạng thái thanh toán (Order Payment Status)
  //     const paymentStatuses = [
  //       { id: 1, code: 'PENDING', name: 'Chưa thanh toán' },
  //       { id: 2, code: 'PAID', name: 'Đã thanh toán' },
  //       { id: 3, code: 'FAILED', name: 'Thanh toán thất bại' },
  //       { id: 4, code: 'REFUNDED', name: 'Đã hoàn tiền' },
  //     ];
  //     for (const s of paymentStatuses) {
  //       await this.orderPaymentStatus.upsert({
  //         where: { order_payment_status_code: s.code },
  //         update: {},
  //         create: {
  //           order_payment_status_id: s.id,
  //           order_payment_status_code: s.code,
  //           order_payment_status_name: s.name,
  //         },
  //       });
  //     }

  //     // 3. Phương thức nhận hàng (Order Delivery Method)
  //     const deliveryMethods = [
  //       { id: 1, code: 'HOME_DELIVERY', name: 'Giao hàng tận nơi' },
  //       { id: 2, code: 'STORE_PICKUP', name: 'Nhận tại cửa hàng' },
  //     ];
  //     for (const d of deliveryMethods) {
  //       await this.orderDeliveryMethod.upsert({
  //         where: { delivery_method_code: d.code },
  //         update: {},
  //         create: {
  //           delivery_method_id: d.id,
  //           delivery_method_code: d.code,
  //           delivery_method_name: d.name,
  //         },
  //       });
  //     }

  //     // 4. Phương thức thanh toán (Order Payment Method)
  //     const paymentMethods = [
  //       { id: 1, code: 'COD', name: 'Thanh toán khi nhận hàng' },
  //       { id: 2, code: 'MOMO', name: 'Thanh toán qua MOMO' },
  //       { id: 3, code: 'VNPAY', name: 'Thanh toán qua VNPAY' },
  //     ];
  //     for (const p of paymentMethods) {
  //       await this.orderPaymentMethod.upsert({
  //         where: { payment_method_code: p.code },
  //         update: {},
  //         create: {
  //           payment_method_id: p.id,
  //           payment_method_code: p.code,
  //           payment_method_name: p.name,
  //           payment_method_status: true,
  //         },
  //       });
  //     }
  //   } catch (e) {
  //     console.warn('Lưu ý khi khởi tạo Master Data:', e);
  //   }
  // }
}