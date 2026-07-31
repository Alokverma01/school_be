import { Module } from '@nestjs/common';
import { ShopController } from './school-shop.controller';
import { ShopService } from './school-shop.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem, Product } from './school-shop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order, OrderItem])],
  controllers: [ShopController],
  providers: [ShopService],
})
export class SchoolShopModule {}
