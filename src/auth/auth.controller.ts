import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; fullName?: string }) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Get('google')
  @AuthGuard('google')
  async googleAuth(@Req() req) {
    // Guard handles the redirection to Google
  }

  @Get('google/callback')
  @AuthGuard('google')
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);

    // In a real app, you'd redirect to frontend with the token.
    // For now, we return the JSON response for verification.
    res.json(result);
  }
}
