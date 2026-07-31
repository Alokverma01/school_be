import { Module } from '@nestjs/common';
import { DocumentTypeController } from './document_types.controller';
import { DocumentTypeService } from './document_types.service';
import { DocumentType } from './document_types.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([DocumentType])],
  controllers: [DocumentTypeController],
  providers: [DocumentTypeService]
})
export class DocumentTypesModule {}
