import { Module } from '@nestjs/common';
import { CertificateTypeController } from './certificate_type.controller';
import { CertificateTypeService } from './certificate_type.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateType } from './certificate_type.entity';

@Module({
  imports:[TypeOrmModule.forFeature([CertificateType])],
  controllers: [CertificateTypeController],
  providers: [CertificateTypeService]
})
export class CertificateTypeModule {}
