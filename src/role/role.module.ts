import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity';
//import { Department } from 'src/department/department.entity';
import { Department } from '../department/department.entity';

@Module({
  imports : [TypeOrmModule.forFeature([Role , Department])
  ],
  providers: [RoleService],
  controllers: [RoleController]
})
export class RoleModule {}
