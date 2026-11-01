import { Body, Controller, Delete, Get, Param, Post, Put, Query, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartItem } from './schemas/cart.schema';
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { JwtPayload } from "jsonwebtoken";

@Controller('api/v1/customer-session/cart-service')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // 1. (GET) CART
  @UseGuards(JwtAuthGuard)
  @Get("cart")
  async getCart(@Req() req: { user: JwtPayload }) {
    const userId = req.user.sub as string;
    return this.cartService.getCartByUserId(userId);
  }

  // 2. (POST) ITEM
  @UseGuards(JwtAuthGuard)
  @Post('item')
  async addToCart(@Req() req: { user: JwtPayload }, @Body('item') item: CartItem) {
    const userId = req.user.sub as string;
    if (!userId) {
      throw new BadRequestException('userId không được để trống');
    }

    if (!item || !item.sku || !item.variantSlug) {
      throw new BadRequestException('Thông tin sản phẩm (sku, variantSlug) không hợp lệ');
    }

    return this.cartService.addItemToCart(userId, item);
  }

  // 3. (PUT) ITEM QUANTITY
  @UseGuards(JwtAuthGuard)
  @Put('item/quantity')
  async updateQuantity(@Req() req: { user: JwtPayload }, @Body('sku') sku: string, @Body('action') action: string) {
    const userId = req.user.sub as string;
    if (!userId) throw new BadRequestException('userId không được để trống');
    if (!sku) throw new BadRequestException('sku không được để trống');
    if (action !== 'increase' && action !== 'decrease') {
      throw new BadRequestException("action phải là 'increase' hoặc 'decrease'");
    }
    return this.cartService.updateItemQuantity(userId, sku, action);
  }

  // 4. (DELETE) REMOVE ITEM
  @UseGuards(JwtAuthGuard)
  @Delete('item')
  async removeItem(@Req() req: { user: JwtPayload }, @Query('sku') sku: string) {
    const userId = req.user.sub as string;

    if (!userId) {
      throw new BadRequestException('userId không được để trống');
    }

    if (!sku) {
      throw new BadRequestException('sku không được để trống');
    }

    return this.cartService.removeItemFromCart(userId, sku);
}

  // 5. (DELETE) CLEAR CART
  @UseGuards(JwtAuthGuard)
  @Delete('all-items')
  async clearCart(@Req() req: { user: JwtPayload }) {
    const userId = req.user.sub as string;

    if (!userId) {
      throw new BadRequestException('userId không được để trống');
    }

    return this.cartService.clearCart(userId);
  }
}