import { Module } from '@nestjs/common';
import { CertificateController } from './certificates.controller';
import { CertificateService} from './certificates.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './certificate.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Certificate])],
  controllers: [CertificateController],
  providers: [CertificateService]
})
export class CertificatesModule {}
