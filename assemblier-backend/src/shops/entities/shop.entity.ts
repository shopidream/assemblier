import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ShopStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum GenerationStep {
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  shopifyDomain: string;

  @Column({ unique: true })
  shopifyId: string;

  @Column({ type: 'enum', enum: ShopStatus, default: ShopStatus.ACTIVE })
  status: ShopStatus;

  @Column({ type: 'text', nullable: true })
  adminToken: string;

  @Column({
    type: 'enum',
    enum: GenerationStep,
    default: GenerationStep.GENERATING,
  })
  generationStep: GenerationStep;

  @Column({ type: 'int', default: 0 })
  generationProgress: number;

  @Column({ type: 'text', nullable: true })
  generationError: string;

  @Column({ type: 'text', nullable: true })
  currentStep: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.shops)
  @JoinColumn({ name: 'userId' })
  user: User;
}
