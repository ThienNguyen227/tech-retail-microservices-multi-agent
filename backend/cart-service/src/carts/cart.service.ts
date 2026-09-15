import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument, CartItem } from './schemas/cart.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
  ) {}

  // Helper tính lại tổng tiền
  private calculateTotalPrice(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  // 1. Lấy giỏ hàng theo userId (nếu chưa có thì tự tạo giỏ trống)
  async getCartByUserId(userId: string): Promise<Cart> {
    let cart = await this.cartModel.findOne({ userId }).lean().exec();

    if (!cart) {
      cart = await this.cartModel.create({
        userId,
        items: [],
        totalPrice: 0,
      });
    }

    return cart;
  }

  // 2. Thêm sản phẩm vào giỏ hàng
  async addItemToCart(userId: string, item: CartItem): Promise<Cart> {
    let cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      cart = new this.cartModel({
        userId,
        items: [item],
        totalPrice: item.price * item.quantity,
      });
      return cart.save();
    }

    // Tìm xem variant này đã có trong giỏ chưa
    const existingItemIndex = cart.items.findIndex(
      (i) => i.variantSlug === item.variantSlug,
    );

    if (existingItemIndex > -1) {
      // Đã có -> cộng dồn số lượng
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      // Chưa có -> push vào mảng
      cart.items.push(item);
    }

    cart.totalPrice = this.calculateTotalPrice(cart.items);
    return cart.save();
  }

  // 3. Cập nhật số lượng của một sản phẩm
  async updateItemQuantity(
    userId: string,
    variantSlug: string,
    quantity: number,
  ): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      throw new NotFoundException(`Không tìm thấy giỏ hàng của user '${userId}'`);
    }

    const itemIndex = cart.items.findIndex((i) => i.variantSlug === variantSlug);
    if (itemIndex === -1) {
      throw new NotFoundException(`Không tìm thấy sản phẩm trong giỏ hàng`);
    }

    if (quantity <= 0) {
      // Nếu số lượng <= 0 thì xóa khỏi giỏ
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    cart.totalPrice = this.calculateTotalPrice(cart.items);
    return cart.save();
  }

  // 4. Xóa 1 sản phẩm khỏi giỏ hàng
  async removeItemFromCart(userId: string, variantSlug: string): Promise<Cart> {
    const cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      throw new NotFoundException(`Không tìm thấy giỏ hàng của user '${userId}'`);
    }

    cart.items = cart.items.filter((i) => i.variantSlug !== variantSlug);
    cart.totalPrice = this.calculateTotalPrice(cart.items);

    return cart.save();
  }

  // 5. Xóa sạch giỏ hàng (khi checkout xong)
  async clearCart(userId: string): Promise<{ message: string }> {
    const cart = await this.cartModel.findOne({ userId }).exec();
    if (!cart) {
      throw new NotFoundException(`Không tìm thấy giỏ hàng của user '${userId}'`);
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    return { message: 'Giỏ hàng đã được làm trống' };
  }
}