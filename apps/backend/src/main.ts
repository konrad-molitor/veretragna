/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'reflect-metadata';
import express from 'express';
import * as path from 'path';
import cors from 'cors';
import dataSource from './config/database.config';
import apiVersionRouter from './api-version/api-version.controller';

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
      const frontendPath = path.join(__dirname, '..', 'frontend');
      app.use(express.static(frontendPath));

      // Handle all other routes by serving the index.html (for SPA routing)
      app.get('*', (req, res) => {
        // Only handle non-API routes
        if (!req.path.startsWith('/api')) {
          res.sendFile(path.join(frontendPath, 'index.html'));
        }
      });
    }

    const port = parseInt(process.env.PORT || '3333', 10);
    const server = app.listen(port, '0.0.0.0', () => {
      const address = server.address();
      if (address && typeof address !== 'string') {
        console.log(`Listening at http://${address.address}:${address.port}`);
      } else {
        console.log(`Listening on port ${port} (host 0.0.0.0)`);
      }
    });
    server.on('error', console.error);
  } catch (error) {
    console.error('Error during Data Source initialization', error);
  }
};

initializeApp();
