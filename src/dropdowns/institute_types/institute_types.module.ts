import { Module } from '@nestjs/common';
import { InstituteTypesService } from './institute_types.service';
import { InstituteTypesController } from './institute_types.controller';
import { InstituteType } from './institute_types.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([InstituteType])],
  providers: [InstituteTypesService],
  controllers: [InstituteTypesController]
})
export class InstituteTypesModule {}
