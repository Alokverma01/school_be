import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: any, @Res() res: Response) {
    const response = await this.authService.login(
      body.username,
      body.password,
      res,
    );
    return res.json(response);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res() res: Response) {
    res.clearCookie('auth_token');

    return res.json({
      status: true,
      message: 'Logged out successfully',
    });
  }
}
