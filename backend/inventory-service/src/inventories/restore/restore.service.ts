// import {
//   BadRequestException,
//   Injectable,
//   InternalServerErrorException,
// } from '@nestjs/common';

// import { PrismaService } from '../../prisma/prisma.service';

// interface RestoreItem {
//   sku: string;
//   quantity: number;
//   serialNumber: string | null;
// }

// @Injectable()
// export class RestoreService {
//   constructor(private readonly prisma: PrismaService) {}

//   async restore(items: RestoreItem[]) {
//     try {
//       return await this.prisma.$transaction(async (tx) => {
//         // Lấy status AVAILABLE
//         const availableStatus =
//           await tx.inventorySkuSerialStatus.findUnique({
//             where: {
//               inventory_sku_serial_status_code: 'AVAILABLE',
//             },
//           });

//         // Lấy status RESERVED
//         const reservedStatus =
//           await tx.inventorySkuSerialStatus.findUnique({
//             where: {
//               inventory_sku_serial_status_code: 'RESERVED',
//             },
//           });

//         if (!availableStatus || !reservedStatus) {
//           throw new BadRequestException(
//             'Không tìm thấy trạng thái AVAILABLE hoặc RESERVED',
//           );
//         }

//         for (const item of items) {
//           // 1. Tìm SKU
//           const skuRecord = await tx.inventorySku.findUnique({
//             where: {
//               inventory_sku_code: item.sku,
//             },
//           });

//           if (!skuRecord) {
//             throw new BadRequestException(
//               `SKU ${item.sku} không tồn tại trong kho`,
//             );
//           }

//           // 2. Tìm InventoryStock
//           const stock = await tx.inventoryStock.findFirst({
//             where: {
//               inventory_sku_id: skuRecord.inventory_sku_id,
//             },
//           });

//           if (!stock) {
//             throw new BadRequestException(
//               `Không tìm thấy tồn kho của SKU ${item.sku}`,
//             );
//           }

//           // 3. Cộng lại số lượng tồn kho
//           await tx.inventoryStock.update({
//             where: {
//               inventory_id_inventory_sku_id: {
//                 inventory_id: stock.inventory_id,
//                 inventory_sku_id: stock.inventory_sku_id,
//               },
//             },
//             data: {
//               inventory_stock_quantity: {
//                 increment: item.quantity,
//               },
//             },
//           });

//           // 4. Nếu có serial thì RESERVED -> AVAILABLE
//           if (item.serialNumber) {
//             const serial =
//               await tx.inventorySkuSerial.findUnique({
//                 where: {
//                   inventory_sku_serial_number:
//                     item.serialNumber,
//                 },
//               });

//             if (!serial) {
//               throw new BadRequestException(
//                 `Không tìm thấy serial ${item.serialNumber}`,
//               );
//             }

//             // Chỉ cho phép hoàn serial đang RESERVED
//             if (
//               serial.inventory_sku_serial_status_id !==
//               reservedStatus.inventory_sku_serial_status_id
//             ) {
//               throw new BadRequestException(
//                 `Serial ${item.serialNumber} không ở trạng thái RESERVED`,
//               );
//             }

//             await tx.inventorySkuSerial.update({
//               where: {
//                 inventory_sku_serial_id:
//                   serial.inventory_sku_serial_id,
//               },
//               data: {
//                 inventory_sku_serial_status_id:
//                   availableStatus.inventory_sku_serial_status_id,
//               },
//             });
//           }
//         }

//         return {
//           success: true,
//           message: 'Đã hoàn tồn kho thành công',
//         };
//       });
//     } catch (error) {
//       if (error instanceof BadRequestException) {
//         throw error;
//       }

//       console.error('RESTORE INVENTORY ERROR:', error);

//       throw new InternalServerErrorException(
//         'Không thể hoàn tồn kho',
//       );
//     }
//   }
// }

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

interface RestoreItem {
  sku: string;
  quantity: number;
  serialNumber: string | null;
}

@Injectable()
export class RestoreService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async restore(
    eventId: number,
    eventType: string,
    items: RestoreItem[],
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

          // ======================================================
          // EVENT ĐÃ XỬ LÝ
          // ======================================================

          if (processedEvent) {
            return {
              success: true,
              alreadyProcessed: true,
              message:
                'Event đã được xử lý trước đó',
            };
          }

          // ======================================================
          // 2. LẤY STATUS
          // ======================================================

          const availableStatus =
            await tx.inventorySkuSerialStatus.findUnique({
              where: {
                inventory_sku_serial_status_code:
                  'AVAILABLE',
              },
            });

          const reservedStatus =
            await tx.inventorySkuSerialStatus.findUnique({
              where: {
                inventory_sku_serial_status_code:
                  'RESERVED',
              },
            });

          if (
            !availableStatus ||
            !reservedStatus
          ) {
            throw new BadRequestException(
              'Không tìm thấy trạng thái AVAILABLE hoặc RESERVED',
            );
          }

          // ======================================================
          // 3. RESTORE INVENTORY
          // ======================================================

          for (const item of items) {
            // --------------------------------------------------
            // Tìm SKU
            // --------------------------------------------------

            const skuRecord =
              await tx.inventorySku.findUnique({
                where: {
                  inventory_sku_code: item.sku,
                },
              });

            if (!skuRecord) {
              throw new BadRequestException(
                `SKU ${item.sku} không tồn tại trong kho`,
              );
            }

            // --------------------------------------------------
            // Tìm InventoryStock
            // --------------------------------------------------

            const stock =
              await tx.inventoryStock.findFirst({
                where: {
                  inventory_sku_id:
                    skuRecord.inventory_sku_id,
                },
              });

            if (!stock) {
              throw new BadRequestException(
                `Không tìm thấy tồn kho của SKU ${item.sku}`,
              );
            }

            // --------------------------------------------------
            // Cộng lại quantity
            // --------------------------------------------------

            await tx.inventoryStock.update({
              where: {
                inventory_id_inventory_sku_id: {
                  inventory_id:
                    stock.inventory_id,
                  inventory_sku_id:
                    stock.inventory_sku_id,
                },
              },
              data: {
                inventory_stock_quantity: {
                  increment: item.quantity,
                },
              },
            });

            // --------------------------------------------------
            // RESERVED → AVAILABLE
            // --------------------------------------------------

            if (item.serialNumber) {
              const serial =
                await tx.inventorySkuSerial.findUnique({
                  where: {
                    inventory_sku_serial_number:
                      item.serialNumber,
                  },
                });

              if (!serial) {
                throw new BadRequestException(
                  `Không tìm thấy serial ${item.serialNumber}`,
                );
              }

              // Chỉ cho phép RESERVED → AVAILABLE
              if (
                serial.inventory_sku_serial_status_id !==
                reservedStatus.inventory_sku_serial_status_id
              ) {
                throw new BadRequestException(
                  `Serial ${item.serialNumber} không ở trạng thái RESERVED`,
                );
              }

              await tx.inventorySkuSerial.update({
                where: {
                  inventory_sku_serial_id:
                    serial.inventory_sku_serial_id,
                },
                data: {
                  inventory_sku_serial_status_id:
                    availableStatus.inventory_sku_serial_status_id,
                },
              });
            }
          }

          // ======================================================
          // 4. ĐÁNH DẤU EVENT ĐÃ XỬ LÝ
          // ======================================================

          await tx.processedEvent.create({
            data: {
              processed_event_event_id:
                eventId,

              processed_event_event_type:
                eventType,
            },
          });

          // ======================================================
          // 5. TRANSACTION COMMIT
          // ======================================================

          return {
            success: true,
            alreadyProcessed: false,
            message:
              'Đã hoàn tồn kho thành công',
          };
        },
      );
    } catch (error) {
      // ======================================================
      // BAD REQUEST
      // ======================================================

      if (
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // ======================================================
      // INTERNAL ERROR
      // ======================================================

      console.error(
        'RESTORE INVENTORY ERROR:',
        error,
      );

      throw new InternalServerErrorException(
        'Không thể hoàn tồn kho',
      );
    }
  }
}