// src/queue/rabbitmq.provider.ts
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel, Options } from 'amqplib';

@Injectable()
export class RabbitMQProvider implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQProvider.name);
  private connection!: amqp.AmqpConnectionManager;
  private channelWrapper!: ChannelWrapper;
  private readonly url = process.env.RABBITMQ_URL || 'amqp://localhost';

  async onModuleInit() {
    this.logger.log(`Connecting to RabbitMQ at ${this.url}`);
    // create connection manager; it will auto-reconnect
    this.connection = amqp.connect([this.url]);

    // create a channel wrapper; setup will be called when a channel is (re)created
    this.channelWrapper = this.connection.createChannel({
      json: false,
      setup: async (channel: ConfirmChannel) => {
        // noop here; queues will be asserted on demand via assertQueue()
        this.logger.log('RabbitMQ channel (re)created and ready');
      },
    });

    // handle connection events (optional, useful for debugging)
    this.connection.on('connect', () => this.logger.log('RabbitMQ connected'));
    this.connection.on('disconnect', (err) =>
      this.logger.warn('RabbitMQ disconnected, will attempt reconnect', err?.err),
    );
  }

  async onModuleDestroy() {
    try {
      if (this.channelWrapper) await this.channelWrapper.close();
      if (this.connection) await this.connection.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (err) {
      this.logger.error('Error closing RabbitMQ connection', err as any);
    }
  }

  // convenience: ensure queue exists
  async assertQueue(queueName: string, options?: Options.AssertQueue) {
    // create a temporary single-use channel to assert queue (the wrapper can also do it via sendToQueue)
    await this.channelWrapper.addSetup((channel: ConfirmChannel) =>
      channel.assertQueue(queueName, { durable: true, ...(options || {}) }),
    );
    this.logger.debug(`Asserted queue ${queueName}`);
  }

  // accepts object or Buffer; automatically serializes objects to Buffer(JSON)
  async sendToQueue(queueName: string, message: any) {
    // ensure queue is present
    await this.assertQueue(queueName);

    let buffer: Buffer;
    if (Buffer.isBuffer(message)) {
      buffer = message;
    } else if (typeof message === 'string') {
      buffer = Buffer.from(message);
    } else {
      buffer = Buffer.from(JSON.stringify(message));
    }

    // ChannelWrapper#sendToQueue has signature (queue, content, options)
    await this.channelWrapper.sendToQueue(queueName, buffer, { persistent: true } as any);
    this.logger.log(`Enqueued message to ${queueName}`);
  }

  // register a consumer; handler receives raw message object (from amqplib)
  async consume(
    queueName: string,
    onMessage: (msg: import('amqplib').ConsumeMessage, ack: () => void, nack: (requeue?: boolean) => void) => Promise<void>,
  ) {
    await this.assertQueue(queueName);

    // We call addSetup to register a consumer each time the channel is (re)created.
    await this.channelWrapper.addSetup((channel: ConfirmChannel) =>
      channel.consume(
        queueName,
        async (msg) => {
          if (!msg) return;
          const ack = () => channel.ack(msg);
          const nack = (requeue = true) => channel.nack(msg, false, requeue);
          try {
            await onMessage(msg, ack, nack);
          } catch (err) {
            // If handler throws, nack the message for requeue (or dead-lettering).
            this.logger.error('Consumer handler threw an error', err as any);
            nack(true);
          }
        },
        { noAck: false },
      ),
    );

    this.logger.log(`Consumer registered for ${queueName}`);
  }
}
