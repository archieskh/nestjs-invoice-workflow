// src/tasks/task.processor.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQProvider } from '../queue/rabbitmq.provider';
import { TaskService } from './task.service';
import { Task, TaskStatus } from './task.entity';
import { ConsumeMessage } from 'amqplib';

@Injectable()
export class TaskProcessor implements OnModuleInit {
  private readonly logger = new Logger(TaskProcessor.name);
  // Define the list of task types your worker will process
  private readonly taskTypes = ['FetchOrders', 'CreateInvoice', 'GeneratePDF', 'SendEmail'];

  constructor(private readonly rabbitMQ: RabbitMQProvider, private readonly taskService: TaskService) {}

  async onModuleInit() {
    // For each task type, register a consumer
    for (const type of this.taskTypes) {
      const queueName = this.queueName(type);
      // register consumer. callback gets msg, ack, nack
      await this.rabbitMQ.consume(queueName, async (msg: ConsumeMessage, ack: () => void, nack: (requeue?: boolean) => void) => {
        const raw = msg.content.toString();
        const content = JSON.parse(raw);
        this.logger.log(`Worker received message from ${queueName}: ${raw}`);

        // Create task record
        const task: Task = await this.taskService.createTask(content.taskType, content.payload);
        try {
          await this.taskService.updateStatus(task.id, TaskStatus.IN_PROGRESS);
          await this.taskService.executeTask(task);
          // ack message only after success
          ack();
        } catch (err) {
          this.logger.error(`Error executing task ${task.id}: ${(err as any)?.message || err}`);
          // increment retry count and mark accordingly
          await this.taskService.incrementRetry(task);
          // nack -> requeue the message for retry (or dead-letter depending on broker config)
          nack(true);
        }
      });
    }
  }

  private queueName(type: string) {
    return `task_queue_${type.toLowerCase()}`;
  }
}
