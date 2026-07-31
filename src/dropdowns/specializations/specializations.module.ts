import { Module } from '@nestjs/common';
import { SpecializationsController } from './specializations.controller';
import { SpecializationsService } from './specializations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Specialization } from './specializations.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Specialization])],
  controllers: [SpecializationsController],
  providers: [SpecializationsService]
})
export class SpecializationsModule {}
