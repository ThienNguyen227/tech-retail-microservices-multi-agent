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
  async addItemToCart(userId: string, item: CartItem): Promise<Cart> 
  {
    let cart = await this.cartModel.findOne({ userId }).exec();
    
    /// Chưa có giỏ > Bấm thêm -> tạo giỏ với (sản phẩm + số lượng 1)
    if (!cart) {
      cart = await this.cartModel.create({
        userId,
        items: [{ ...item, quantity: 1}],
        totalPrice: item.price,
      });
      return cart;
    }

    /// Nếu đã có giỏ -> Kiểm tra sku
    const existingItemIndex = cart.items.findIndex((i) => i.sku === item.sku);

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += 1;
      cart.items[existingItemIndex].price = item.price; // Cập nhật đơn giá mới nếu có thay đổi
    } else {
      // push vào cuối array
      cart.items.push({ ...item, quantity: 1 });
    }
    cart.totalPrice = this.calculateTotalPrice(cart.items);

    return cart.save();
  }

  // 2. Lấy giỏ hàng của người dùng
  async getCartByUserId(userId: string): Promise<Cart> 
  {
    let cart = await this.cartModel.findOne({ userId }).lean().exec();

    if (!cart) {
      cart = await this.cartModel.create({userId, items: [], totalPrice: 0});
    }

    return cart;
  }
}