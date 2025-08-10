import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';

import { Task } from './tasks/task.entity';
import { TaskService } from './tasks/task.service';
import { TaskProcessor } from './tasks/task.processor';

import { RabbitMQProvider } from './queue/rabbitmq.provider';
import { QueueService } from './queue/queue.service';

import { CoordinatorService } from './coordinator/coordinator.service';
import { sequelizeConfig } from './database/sequelize.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot(sequelizeConfig),
    SequelizeModule.forFeature([Task]),
  ],
  controllers: [AppController],
  providers: [AppService,
    RabbitMQProvider,
    QueueService,
    TaskService,
    TaskProcessor,
    CoordinatorService,
  ],
})
export class AppModule {}
