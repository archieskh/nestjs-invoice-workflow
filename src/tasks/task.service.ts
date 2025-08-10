import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task, TaskStatus } from './task.entity';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  private readonly MAX_RETRIES = 3;

  constructor(@InjectModel(Task) private taskModel: typeof Task) {}

  async createTask(type: string, payload: any): Promise<Task> {
    return this.taskModel.create({
      type,
      payload,
      status: TaskStatus.PENDING,
      retryCount: 0,
    });
  }

  async updateStatus(taskId: number, status: TaskStatus, errorMsg?: string) {
    const updateData: Partial<Task> = { status };
    if (errorMsg) {
      updateData.lastErrorMessage = errorMsg;
      updateData.lastErrorAt = new Date();
    }
    await this.taskModel.update(updateData, { where: { id: taskId } });
  }

  async incrementRetry(task: Task) {
    task.retryCount++;
    if (task.retryCount > this.MAX_RETRIES) {
      task.status = TaskStatus.FAILED;
    } else {
      task.status = TaskStatus.RETRYING;
    }
    await task.save();
  }

  // Simulate task execution logic
  async executeTask(task: Task): Promise<void> {
    this.logger.log(`Executing task ${task.id} of type ${task.type}`);

    try {
      // Simulate different task types:
      switch (task.type) {
        case 'FetchOrders':
          await this.fetchOrders(task.payload);
          break;
        case 'CreateInvoice':
          await this.createInvoice(task.payload);
          break;
        case 'GeneratePDF':
          await this.generatePDF(task.payload);
          break;
        case 'SendEmail':
          await this.sendEmail(task.payload);
          break;
        default:
          throw new Error('Unknown task type');
      }
      await this.updateStatus(task.id, TaskStatus.SUCCESS);
    } catch (error) {
      this.logger.error(`Task ${task.id} failed: ${error.message}`);
      await this.incrementRetry(task);
      throw error;
    }
  }

  // Dummy implementations of task functions
  private async fetchOrders(payload: any) {
    this.logger.debug(`Fetching orders for customerId=${payload.customerId}`);
    // Simulate delay
    await new Promise((res) => setTimeout(res, 500));
  }

  private async createInvoice(payload: any) {
    this.logger.debug(`Creating invoice for orders: ${JSON.stringify(payload.orders)}`);
    await new Promise((res) => setTimeout(res, 500));
  }

  private async generatePDF(payload: any) {
    this.logger.debug('Generating PDF for invoice');
    await new Promise((res) => setTimeout(res, 500));
  }

  private async sendEmail(payload: any) {
    this.logger.debug(`Sending email to: ${payload.email}`);
    await new Promise((res) => setTimeout(res, 500));
  }
}
