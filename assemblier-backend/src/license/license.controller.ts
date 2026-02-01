import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { LicenseService } from './license.service';

@Controller('license')
export class LicenseController {
  constructor(private licenseService: LicenseService) {}

  @Get('status')
  async getStatus(@Query('shopDomain') shopDomain: string) {
    if (!shopDomain) {
      throw new HttpException(
        'shopDomain query parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.licenseService.getLicenseStatus(shopDomain);
    } catch (error) {
      if (error.status === 404) {
        // Shop not found - return EXPIRED status
        return {
          shopDomain,
          status: 'EXPIRED',
          layout: 'ecommerce',
          expiresAt: new Date().toISOString(),
        };
      }
      throw error;
    }
  }
}
