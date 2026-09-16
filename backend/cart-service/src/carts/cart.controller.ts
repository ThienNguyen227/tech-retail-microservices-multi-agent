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
}