import { Module } from '@nestjs/common';
import { FeesTypesController } from './fees_types.controller';
import { FeesTypesService } from './fees_types.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesTypes } from './fees_type.entity';

@Module({
  imports:[TypeOrmModule.forFeature([FeesTypes])],
  controllers: [FeesTypesController],
  providers: [FeesTypesService]
})
export class FeesTypesModule {}
