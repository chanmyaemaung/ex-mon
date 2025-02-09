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
export class Gold {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: GoldType })
  @Index({ unique: true })
  type: GoldType;

  @Column({ type: 'varchar', length: 20 })
  unit: string; // "1 oz" or "1 ကျပ်သား"

  @Column({ type: 'timestamp' })
  time: Date;

  @OneToMany(() => GoldPrice, (price) => price.gold, { cascade: true })
  prices: GoldPrice[];
}
