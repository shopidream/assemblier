import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GenerateStoreDto } from './dto/generate-store.dto';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private storesService: StoresService) {}

  @Post('generate')
  async generate(@Req() req: Request, @Body() dto: GenerateStoreDto) {
    const user = req.user as any;
    return this.storesService.generateStore(user, dto);
  }

  @Get('status/:shopId')
  async getStatus(@Param('shopId') shopId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.storesService.getStatus(shopId, user.id);
  }
}
