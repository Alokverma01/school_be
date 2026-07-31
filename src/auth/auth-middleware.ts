import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const token = req.cookies?.auth_token;
    console.log(req.cookies);
    console.log(req);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    const secret = process.env?.JWT_SECRET;
    console.log(secret);
    if (!secret) {
      throw new Error('JWT_SECRET is missing in environment variables.');
    }

    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
