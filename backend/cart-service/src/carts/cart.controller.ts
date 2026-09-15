import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartItem } from './schemas/cart.schema';

@Controller('api/v1/carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // 1. GET giỏ hàng theo userId
  // GET http://localhost:3004/api/v1/carts?userId=123
  @Get()
  async getCart(@Query('userId') userId: string) {
    return this.cartService.getCartByUserId(userId);
  }

  // 2. Thêm item vào giỏ hàng
  // POST http://localhost:3004/api/v1/carts/add
  @Post('add')
  async addToCart(
    @Body('userId') userId: string,
    @Body('item') item: CartItem,
  ) {
    return this.cartService.addItemToCart(userId, item);
  }

  // 3. Cập nhật số lượng item
  // PUT http://localhost:3004/api/v1/carts/update-item
  @Put('update-item')
  async updateItemQuantity(
    @Body('userId') userId: string,
    @Body('variantSlug') variantSlug: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItemQuantity(userId, variantSlug, quantity);
  }

  // 4. Xóa một item khỏi giỏ
  // DELETE http://localhost:3004/api/v1/carts/remove-item?userId=123&variantSlug=slug-1
  @Delete('remove-item')
  async removeItem(
    @Query('userId') userId: string,
    @Query('variantSlug') variantSlug: string,
  ) {
    return this.cartService.removeItemFromCart(userId, variantSlug);
  }

  // 5. Xóa toàn bộ giỏ hàng
  // DELETE http://localhost:3004/api/v1/carts/clear?userId=123
  @Delete('clear')
  async clearCart(@Query('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}