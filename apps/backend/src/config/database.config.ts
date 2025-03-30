import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { ApiVersion } from '../api-version/api-version.entity';

// Load environment variables from .env file
dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'veretragna',
  entities: [ApiVersion],
  synchronize: true, // Should be false in production
  logging: process.env.NODE_ENV !== 'production',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource; 