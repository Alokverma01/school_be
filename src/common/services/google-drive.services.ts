import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleDriveService {
    private drive;
    private readonly PARENT_FOLDER_ID: string | null;

    constructor() {
        const rawFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || null;
        this.PARENT_FOLDER_ID = this.extractFolderId(rawFolderId);

        const keyFilePath = path.join(process.cwd(), 'google-service-account.json'); // Place your JSON file in project root

        // if (!fs.existsSync(keyFilePath)) {
        //     throw new Error('Google service account JSON file not found!');
        // }

        if (!fs.existsSync(keyFilePath)) {
            console.warn('Google Drive disabled: google-service-account.json not found.');
            this.drive = null;
            return;
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        this.drive = google.drive({ version: 'v3', auth });
    }

    private extractFolderId(input: string | null): string | null {
        if (!input) return null;
        // If it's a URL, extract the ID after /folders/
        const match = input.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        if (match) return match[1];

        // Otherwise, trim and remove any trailing special characters like dots
        return input.trim().replace(/[.\s]+$/, '');
    }

    /**
     * Upload a file to Google Drive and return the shareable link
     * @param file Multer file object
     * @param folderId Optional specific folder ID (overrides global one)
     */
    async uploadFile(
        file: Express.Multer.File,
        folderId?: string,
    ): Promise<{ shareLink: string; fileId: string; originalName: string }> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        try {
            const finalFolderId = this.extractFolderId(folderId || this.PARENT_FOLDER_ID);
            console.log('Final Folder ID for Upload:', finalFolderId || 'root');

            const fileMetadata = {
                name: `${Date.now()}-${file.originalname}`,
                parents: finalFolderId ? [finalFolderId] : undefined,
            };

            const { Readable } = require('stream');
            console.log('Preparing media for upload (Resumable)...');

            const media = {
                mimeType: file.mimetype,
                body: file.path ? fs.createReadStream(file.path) : Readable.from(file.buffer),
            };

            console.log('Sending file to Google Drive...');
            const uploadRes = await this.drive.files.create({
                requestBody: fileMetadata,
                media,
                fields: 'id',
                // Using resumable can be more stable on some networks
                options: {
                    retry: true,
                    retryConfig: {
                        retry: 3,
                        statusCodesToRetry: [[100, 199], [429, 429], [500, 599]],
                    }
                }
            });

            console.log('File successfully uploaded, ID:', uploadRes.data.id);
            const fileId = uploadRes.data.id;

            try {
                console.log('Setting file permissions...');
                // Make file publicly viewable (anyone with link)
                await this.drive.permissions.create({
                    fileId,
                    requestBody: {
                        role: 'reader',
                        type: 'anyone',
                    },
                });
            } catch (permError) {
                console.warn('Failed to set file permissions, it might not be publicly viewable:', permError.message);
            }

            console.log('Fetching webViewLink...');
            const linkRes = await this.drive.files.get({
                fileId,
                fields: 'webViewLink',
            });

            // Clean up temporary file ONLY if it was saved to disk
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            return {
                shareLink: linkRes.data.webViewLink as string,
                fileId,
                originalName: file.originalname,
            };
        } catch (error) {
            console.error('Google Drive upload failed. Full Error:', error);
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw new InternalServerErrorException(`Failed to upload file to Google Drive: ${error.message}`);
        }
    }
}