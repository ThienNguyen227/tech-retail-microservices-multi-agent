import { Body, Controller, Delete, Get, Param, Post, Put, Query, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartItem } from './schemas/cart.schema';

@Controller('api/v1/carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // 1. Thêm item vào giỏ hàng
  // POST http://localhost:3004/api/v1/carts/add
  @Post('add')
  async addToCart(@Body('userId') userId: string, @Body('item') item: CartItem) {
    if (!userId) {
      throw new BadRequestException('userId không được để trống');
    }

    if (!item || !item.sku || !item.variantSlug) {
      throw new BadRequestException('Thông tin sản phẩm (sku, variantSlug) không hợp lệ');
    }

    return this.cartService.addItemToCart(userId, item);
  }

  // 2. Lấy giỏ hàng của người dùng
  @Get()
  async getCart(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId không được để trống');
    }
    return this.cartService.getCartByUserId(userId);
  }

  // 3. Cập nhật số lượng sản phẩm
  // PATCH http://localhost:3004/api/v1/carts/update-quantity
  // Body: { userId, sku, action: "increase" | "decrease" }
  @Put('update-quantity')
  async updateQuantity(
    @Body('userId') userId: string,
    @Body('sku') sku: string,
    @Body('action') action: string,
  ) {
    if (!userId) throw new BadRequestException('userId không được để trống');
    if (!sku) throw new BadRequestException('sku không được để trống');
    if (action !== 'increase' && action !== 'decrease') {
      throw new BadRequestException("action phải là 'increase' hoặc 'decrease'");
    }
    return this.cartService.updateItemQuantity(userId, sku, action);
  }

  // 4. Xóa một item khỏi giỏ hàng
  // DELETE http://localhost:3004/api/v1/carts/remove-item?userId=19&sku=IP17PM-256-CAM-VU-TRU
  @Delete('remove-item')
  async removeItem(@Query('userId') userId: string, @Query('sku') sku: string) {
    if (!userId) {
      throw new BadRequestException('userId không được để trống');
    }
    if (!sku) {
      throw new BadRequestException('sku không được để trống');
    }
    return this.cartService.removeItemFromCart(userId, sku);
  }

  // 4. Xóa toàn bộ giỏ hàng
  // DELETE http://localhost:3004/api/v1/carts/clear?userId=19
  @Delete('clear')
  async clearCart(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId không được để trống');
    }
    return this.cartService.clearCart(userId);
  }
}