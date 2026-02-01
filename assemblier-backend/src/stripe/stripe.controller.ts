import { Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { SubscriptionStatus } from '../subscription/entities/subscription.entity';

@Controller('stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private subscriptionService: SubscriptionService,
  ) {}

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['stripe-signature'] as string;

    try {
      const event = this.stripeService.constructWebhookEvent(
        req.body,
        signature,
      );

      switch (event.type) {
        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          await this.subscriptionService.updateStatusByStripeSubId(
            subscription.id,
            subscription.status === 'active'
              ? SubscriptionStatus.ACTIVE
              : subscription.status === 'past_due'
                ? SubscriptionStatus.PAST_DUE
                : SubscriptionStatus.CANCELED,
            new Date(subscription.current_period_end * 1000),
          );
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          await this.subscriptionService.updateStatusByStripeSubId(
            subscription.id,
            SubscriptionStatus.CANCELED,
            new Date(subscription.current_period_end * 1000),
          );
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          if (invoice.subscription) {
            await this.subscriptionService.updateStatusByStripeSubId(
              invoice.subscription,
              SubscriptionStatus.PAST_DUE,
              null,
            );
          }
          break;
        }
      }

      res.status(HttpStatus.OK).json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err.message);
      res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }
  }
}
