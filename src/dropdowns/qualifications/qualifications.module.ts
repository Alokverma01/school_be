import { Module } from '@nestjs/common';
import { QualificationsController } from './qualifications.controller';
import { QualificationsService } from './qualifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualificationType } from './qualifications.entity';

@Module({
  imports:[TypeOrmModule.forFeature([QualificationType])],
  controllers: [QualificationsController],
  providers: [QualificationsService]
})
export class QualificationsModule {}
