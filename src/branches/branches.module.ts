import { Module } from '@nestjs/common';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branches } from './branches.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Branches])],
  controllers: [BranchesController],
  providers: [BranchesService]
})
export class BranchesModule {}
