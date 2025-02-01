import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CurrencyPrice } from './currency-price.entity';
import { CurrencyTransaction } from './currency-transaction.entity';

@Entity()
export class Currency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string; // USD, EUR, etc.

  @Column({ type: 'varchar', length: 10 })
  unit: string; // "1$", "1€", "1฿" etc.

  @OneToMany(() => CurrencyPrice, (currencyPrice) => currencyPrice.currency, {
    cascade: true,
  })
  currentPrices: CurrencyPrice[]; // Latest prices (buy/sell) for this currency

  @OneToMany(
    () => CurrencyTransaction,
    (currencyTransaction) => currencyTransaction.currency,
    { cascade: true },
  )
  transactions: CurrencyTransaction[]; // Historical transactions for this currency

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
