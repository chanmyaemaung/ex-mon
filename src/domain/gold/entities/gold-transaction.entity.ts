import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GoldType } from '../enums';
import { GoldPrice } from './gold-price.entity';

@Entity()
export class GoldTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: GoldType })
  @Index()
  type: GoldType;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({ type: 'varchar', length: 10 })
  time: string;

  @Column({ type: 'varchar', length: 10, default: '1' })
  unit: string;

  @OneToMany(() => GoldPrice, (price) => price.transaction, { cascade: true })
  prices: GoldPrice[];
}
