import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({ collection: 'brands' })
export class Brand {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  categoryId: string[];
}

export const BrandSchema = SchemaFactory.createForClass(Brand);