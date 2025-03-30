/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'reflect-metadata';
import express from 'express';
import * as path from 'path';
import dataSource from './config/database.config';
import apiVersionRouter from './api-version/api-version.controller';
import cors from 'cors';

const initializeApp = async () => {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized!');
    
    const app = express();

    // CORS configuration
    const corsOptions = {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || true 
        : 'http://localhost:4200',
      credentials: true,
    };
    
    app.use(cors(corsOptions));
    app.use(express.json());

    app.get('/api', (req, res) => {
      res.send({ message: 'Welcome to backend!' });
    });

    app.get('/api/healthcheck', (req, res) => {
      res.send({ backend: true, database: dataSource.isInitialized });
    });

    // API routes
    app.use('/api/versions', apiVersionRouter);

    // Serve static files from backend assets directory
    app.use('/assets', express.static(path.join(__dirname, 'assets')));
    
    // In production, serve the frontend static files
    if (process.env.NODE_ENV === 'production') {
      // Serve frontend static files
      const frontendPath = path.join(__dirname, '..', '..', 'frontend');
      app.use(express.static(frontendPath));
      
      // Handle all other routes by serving the index.html (for SPA routing)
      app.get('*', (req, res) => {
        // Only handle non-API routes
        if (!req.path.startsWith('/api')) {
          res.sendFile(path.join(frontendPath, 'index.html'));
        }
      });
    }

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
