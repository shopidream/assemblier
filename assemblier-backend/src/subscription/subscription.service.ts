import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private stripeService: StripeService,
  ) {}

  async create(user: User, plan: SubscriptionPlan): Promise<Subscription> {
    const existing = await this.findByUserId(user.id);
    if (existing) {
      throw new ConflictException('User already has a subscription');
    }

    let stripeCustomerId: string;
    const existingCustomer = await this.subscriptionRepository.findOne({
      where: { userId: user.id },
    });

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripeCustomerId;
    } else {
      const customer = await this.stripeService.createCustomer(user.email);
      stripeCustomerId = customer.id;
    }

    const priceId =
      plan === SubscriptionPlan.STARTER
        ? process.env.STRIPE_PRICE_STARTER
        : process.env.STRIPE_PRICE_PRO;

    const stripeSub = await this.stripeService.createSubscription(
      stripeCustomerId,
      priceId || '',
    );

    const subscription = this.subscriptionRepository.create({
      userId: user.id,
      stripeCustomerId,
      stripeSubId: stripeSub.id,
      plan,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
    });

    return this.subscriptionRepository.save(subscription);
  }

  async cancel(userId: string): Promise<Subscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.stripeService.cancelSubscription(subscription.stripeSubId);

    return subscription;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({ where: { userId } });
  }

  async updateStatusByStripeSubId(
    stripeSubId: string,
    status: SubscriptionStatus,
    currentPeriodEnd: Date | null,
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubId },
    });

    if (subscription) {
      subscription.status = status;
      if (currentPeriodEnd) {
        subscription.currentPeriodEnd = currentPeriodEnd;
      }
      await this.subscriptionRepository.save(subscription);
    }
  }
}
