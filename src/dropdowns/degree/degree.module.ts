import { Module } from '@nestjs/common';
import { DegreeController } from './degree.controller';
import { DegreeService } from './degree.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Degree } from './degreee.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Degree])],
  controllers: [DegreeController],
  providers: [DegreeService]
})
export class DegreeModule {}
