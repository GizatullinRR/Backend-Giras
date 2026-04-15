import { Controller, Post, Body, Res, Req, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly refreshExpiresDays: number;
  private readonly refreshCookieSecure: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.refreshExpiresDays = this.configService.get<number>('JWT_REFRESH_EXPIRES_DAYS', 30);
    this.refreshCookieSecure =
      this.configService.get<string>('REFRESH_COOKIE_SECURE', 'false') === 'true';
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@CurrentUser() user: { id: string; role: string }) {
    return this.authService.getMe(user.id);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    const tokens = await this.authService.register(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return res.json({ accessToken: tokens.accessToken });
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const tokens = await this.authService.login(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return res.json({ accessToken: tokens.accessToken });
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Refresh token не найден',
      });
    }

    const tokens = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return res.json({ accessToken: tokens.accessToken });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.refreshCookieSecure,
      sameSite: 'lax',
    });
    return res.json({ message: 'Выход выполнен успешно' });
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: this.refreshCookieSecure,
      sameSite: 'lax',
      maxAge: this.refreshExpiresDays * 24 * 60 * 60 * 1000,
    });
  }
}
