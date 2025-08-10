import { Table, Column, Model, DataType } from 'sequelize-typescript';

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

@Table({ tableName: 'tasks' })
export class Task extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING })
  type: string; // e.g., 'FetchOrders', 'CreateInvoice', 'SendEmail'

  @Column({ type: DataType.JSONB })
  payload: any;

  @Column({ type: DataType.STRING })
  status: TaskStatus;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  retryCount: number;

  @Column({ type: DataType.DATE, allowNull: true })
  lastErrorAt: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  lastErrorMessage: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare updatedAt: Date;
}
