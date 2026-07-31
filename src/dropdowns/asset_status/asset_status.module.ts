import { Module } from '@nestjs/common';
import { AssetStatusController } from './asset_status.controller';
import { AssetStatusService } from './asset_status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetStatus } from './asset_status.entity';

@Module({
  imports:[TypeOrmModule.forFeature([AssetStatus])],
  controllers: [AssetStatusController],
  providers: [AssetStatusService]
})
export class AssetStatusModule {}
