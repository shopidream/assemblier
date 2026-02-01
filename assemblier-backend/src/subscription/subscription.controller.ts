import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionPlan } from './entities/subscription.entity';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Post('create')
  async create(@Req() req: Request, @Body() body: { plan: SubscriptionPlan }) {
    const user = req.user as any;
    const subscription = await this.subscriptionService.create(
      user,
      body.plan,
    );

    return {
      subscriptionId: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  @Delete('cancel')
  async cancel(@Req() req: Request) {
    const user = req.user as any;
    const subscription = await this.subscriptionService.cancel(user.id);

    return {
      status: 'CANCELED',
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  @Get('status')
  async getStatus(@Req() req: Request) {
    const user = req.user as any;
    const subscription =
      await this.subscriptionService.findByUserId(user.id);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }
}
