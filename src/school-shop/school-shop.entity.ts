import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  product_id: number;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ type: 'float' })
  price: number;

  @Column()
  stock: number;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

  @Entity('orders')
  export class Order {
    @PrimaryGeneratedColumn()
    order_id: number;
    
    @Column()
    branch_id: number;

    @Column()
    class_id: number;

    @Column()
    section_id: number;

    @Column()
    student_id: number;

    @Column({ type: 'float' })
    total_amount: number;

    @Column({ default: 1 })
    status: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
  }

  @Entity('order_items')
  export class OrderItem {
    @PrimaryGeneratedColumn()
    order_item_id: number;

    @Column()
    order_id: number;

    @Column()
    product_id: number;

    @Column()
    quantity: number;

    @Column({ default: 1 })
    status: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
  }
