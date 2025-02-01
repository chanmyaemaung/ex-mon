import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CurrencyBuySell, CurrencyPriceSign } from '../enums';
import { Currency } from './currency.entity';

@Entity()
export class CurrencyPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number; // e.g., "4,460.00"

  @Column()
  sign: CurrencyPriceSign;

  @Column({
    type: 'enum',
    enum: CurrencyBuySell,
  })
  type: CurrencyBuySell;

  @ManyToOne(() => Currency, (currency) => currency.currentPrices, {
    onDelete: 'CASCADE',
  })
  currency: Currency;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
