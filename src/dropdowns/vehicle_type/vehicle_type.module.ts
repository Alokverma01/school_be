import { Module } from '@nestjs/common';
import { VehicleTypeController } from './vehicle_type.controller';
import { VehicleTypeService } from './vehicle_type.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleTypes } from './vehicle_type.entity';

@Module({
  imports:[TypeOrmModule.forFeature([VehicleTypes])],
  controllers: [VehicleTypeController],
  providers: [VehicleTypeService]
})
export class VehicleTypeModule {}
