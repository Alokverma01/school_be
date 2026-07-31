import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserDetails } from './user_details.entity';
import { Role } from '../role/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserDetails , Role])],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
