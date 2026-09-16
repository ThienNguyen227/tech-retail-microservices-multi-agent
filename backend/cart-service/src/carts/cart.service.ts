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

  // 1. Thêm sản phẩm vào giỏ hàng
  async addItemToCart(userId: string, item: CartItem): Promise<Cart> {
    let cart = await this.cartModel.findOne({ userId }).exec();
    // Đảm bảo số lượng thêm tối thiểu là 1
    const quantityToAdd = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    if (!cart) {
      cart = new this.cartModel({
        userId,
        items: [{ ...item, quantity: quantityToAdd }],
        totalPrice: item.price * quantityToAdd,
      });
      return cart.save();
    }
    // Tìm xem SKU hoặc variantSlug này đã có trong giỏ chưa
    const existingItemIndex = cart.items.findIndex(
      (i) => i.sku === item.sku || i.variantSlug === item.variantSlug,
    );
    if (existingItemIndex > -1) {
      // Đã có -> cộng dồn số lượng và cập nhật giá mới nhất
      cart.items[existingItemIndex].quantity += quantityToAdd;
      cart.items[existingItemIndex].price = item.price; // Cập nhật đơn giá mới nếu có thay đổi
    } else {
      // Chưa có -> push vào mảng
      cart.items.push({ ...item, quantity: quantityToAdd });
    }
    cart.totalPrice = this.calculateTotalPrice(cart.items);
    return cart.save();
  }

  // 2. Lấy giỏ hàng của người dùng
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
}