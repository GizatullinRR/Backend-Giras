import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { WorkwearSize } from './enums/size.enum';
import { WorkwearSeason } from './enums/season.enum';
import { WorkwearItemSet } from './enums/set.enum';
import { WorkwearCategory } from './enums/category.enum';

@Entity()
export class Workwear {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: WorkwearCategory })
  category: WorkwearCategory;

  @Column({ type: 'enum', enum: WorkwearSize, array: true })
  size: WorkwearSize[];

  @Column({ type: 'text' })
  color: string;

  @Column({ type: 'enum', enum: WorkwearSeason })
  season: WorkwearSeason;

  @Column({ type: 'enum', enum: WorkwearItemSet })
  set: WorkwearItemSet;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text' })
  sku: string;

  @Column()
  isCertified: boolean;

  @Column('simple-array', { nullable: true })
  images?: string[];

  @Column({ type: 'text' })
  material: string;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
