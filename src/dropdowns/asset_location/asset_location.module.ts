import { Module } from '@nestjs/common';
import { AssetLocationController } from './asset_location.controller';
import { AssetLocationService } from './asset_location.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetLocation } from './asse_location.entity';

@Module({
  imports:[TypeOrmModule.forFeature([AssetLocation])],
  controllers: [AssetLocationController],
  providers: [AssetLocationService]
})
export class AssetLocationModule {}
