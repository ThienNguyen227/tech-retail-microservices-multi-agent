import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
export class StorageOption {
  @Prop({ required: true })
  storage: string;

  @Prop()
  slug?: string;

  @Prop({ required: true })
  price: number;
}

@Schema({ _id: false })
export class ProductSpecifications {
  @Prop()
  chip?: string;

  @Prop()
  ram?: string;

  @Prop()
  storage?: string;

  @Prop()
  rearCamera?: string;

  @Prop()
  frontCamera?: string;

  @Prop()
  battery?: string;
}

@Schema({ collection: 'products' })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true, type: String })
  brandId: string;

  @Prop({ required: true, type: String })
  categoryId: string;

  @Prop()
  screenTech?: string;

  @Prop()
  screenSize?: string;

  @Prop({ type: [StorageOption], default: [] })
  storageOptions: StorageOption[];

  @Prop({ type: ProductSpecifications, default: {} })
  specifications: ProductSpecifications;
}

export const ProductSchema = SchemaFactory.createForClass(Product);