import { Module } from '@nestjs/common';
import { InventoryController } from './inventory-store.controller';
import { InventoryService } from './inventory-store.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './inventory-store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryStoreModule {}
