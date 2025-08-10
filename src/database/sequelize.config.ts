import { SequelizeOptions } from 'sequelize-typescript';
import { Task } from '../tasks/task.entity';

export const sequelizeConfig: SequelizeOptions = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
  database: process.env.DB_NAME || 'workflow_db',
  models: [Task], // add entities here
  logging: false,
};
