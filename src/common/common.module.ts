import { Global, Module } from '@nestjs/common';
import { GoogleDriveService } from './services/google-drive.services';
import { CloudinaryService } from './services/cloudinary.service';

@Global() 
@Module({
  providers: [GoogleDriveService, CloudinaryService],
  exports: [GoogleDriveService, CloudinaryService],
})
export class CommonModule {}