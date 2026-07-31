import { Module } from '@nestjs/common';
import { MasterClassesController } from './master_classes.controller';
import { MasterClassesService } from './master_classes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterClass } from './master_classes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MasterClass])],
  controllers: [MasterClassesController],
  providers: [MasterClassesService]
})
export class MasterClassesModule { }
