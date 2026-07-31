import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './vehicle.entity';
import { Route } from './route.entity';
import { StudentTransportAssignment } from './student_transport_assignment';
import { Driver } from './driver.entity';


@Module({
  imports:[TypeOrmModule.forFeature([Driver, Vehicle , Route , StudentTransportAssignment])],
  controllers: [TransportController],
  providers: [TransportService]
})
export class TransportModule {}
