import { Module } from '@nestjs/common';
import { FeeController } from './fee.controller';
import { FeeService } from './fee.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeePayment, FeePaymentMode, FeePaymentStatus } from './fee_payments.entity';
import { FeeStructure } from './fee_structure.entity';
import { FeePaymentDetail } from './fee_payment_details.entity';

@Module({
  imports:[TypeOrmModule.forFeature([FeeStructure , FeePayment , FeePaymentDetail])],
  controllers: [FeeController],
  providers: [FeeService]
})
export class FeeModule {}
