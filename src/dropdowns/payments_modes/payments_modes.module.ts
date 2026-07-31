import { Module } from '@nestjs/common';
import { PaymentsModesController } from './payments_modes.controller';
import { PaymentsModesService } from './payments_modes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMode } from './payments_modes.entity';

@Module({
  imports:[TypeOrmModule.forFeature([PaymentMode])],
  controllers: [PaymentsModesController],
  providers: [PaymentsModesService]
})
export class PaymentsModesModule {}
