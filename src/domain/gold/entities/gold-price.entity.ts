import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PriceSign } from '../enums/price-sign.enum';
import { GoldTransaction } from './gold-transaction.entity';
import { Gold } from './gold.entity';

@Entity()
export class GoldPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 5 })
  title: string;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  value: number;

  @Column({ type: 'enum', enum: PriceSign, default: PriceSign.NONE })
  sign: PriceSign;

  @ManyToOne(() => Gold, (gold) => gold.prices, { onDelete: 'CASCADE' })
  gold: Gold;

  @ManyToOne(() => GoldTransaction, (transaction) => transaction.prices, {
    onDelete: 'CASCADE',
  })
  transaction: GoldTransaction;
}
