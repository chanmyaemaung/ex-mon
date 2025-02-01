import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CurrencyPriceSign } from '../enums';
import { Currency } from './currency.entity';

@Entity()
export class CurrencyTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'varchar', length: 255 })
  time: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  buyValue: number;

  @Column({
    type: 'enum',
    enum: CurrencyPriceSign,
    default: CurrencyPriceSign.NONE,
  })
  buySign: CurrencyPriceSign;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  sellValue: number;

  @Column({
    type: 'enum',
    enum: CurrencyPriceSign,
    default: CurrencyPriceSign.NONE,
  })
  sellSign: CurrencyPriceSign;

  @ManyToOne(() => Currency, (currency) => currency.transactions, {
    onDelete: 'CASCADE',
  })
  currency: Currency;
}
