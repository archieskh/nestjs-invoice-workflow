import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQProvider } from './rabbitmq.provider';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly rabbitMQ: RabbitMQProvider) {}

  async enqueueTask(taskType: string, payload: any) {
    const queueName = this.getQueueName(taskType);
    await this.rabbitMQ.assertQueue(queueName);
    await this.rabbitMQ.sendToQueue(queueName, Buffer.from(JSON.stringify({ taskType, payload })));
    this.logger.log(`Enqueued task to ${queueName}`);
  }

  private getQueueName(taskType: string): string {
    // Simple mapping, in real can be more sophisticated
    return `task_queue_${taskType.toLowerCase()}`;
  }
}
