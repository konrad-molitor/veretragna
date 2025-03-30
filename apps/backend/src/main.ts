/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'reflect-metadata';
import express from 'express';
import * as path from 'path';
import dataSource from './config/database.config';
import apiVersionRouter from './api-version/api-version.controller';

// Инициализация TypeORM
const initializeApp = async () => {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized!');
    
    const app = express();

    app.use('/assets', express.static(path.join(__dirname, 'assets')));
    app.use(express.json());

    app.get('/api', (req, res) => {
      res.send({ message: 'Welcome to backend!' });
    });

    app.get('/api/healthcheck', (req, res) => {
      res.send({ backend: true, database: dataSource.isInitialized });
    });

    // API роуты
    app.use('/api/versions', apiVersionRouter);

    const port = process.env.PORT || 3333;
    const server = app.listen(port, () => {
      console.log(`Listening at http://localhost:${port}/api`);
    });
    server.on('error', console.error);
  } catch (error) {
    console.error('Error during Data Source initialization', error);
  }
};

initializeApp();
