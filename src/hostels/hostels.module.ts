import { Module } from '@nestjs/common';
import { HostelsController } from './hostels.controller';
import { HostelsService } from './hostels.service';
import { Hostel } from './hostel.entity';
import { HostelRoom } from './hostel-room.entity';
import { HostelAllocation } from './hostel-allocation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Hostel, HostelRoom, HostelAllocation])],
  controllers: [HostelsController],
  providers: [HostelsService]
})
export class HostelsModule {}
