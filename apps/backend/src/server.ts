import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Database connection successfully established.');

    const server = app.listen(env.BACKEND_PORT, () => {
      console.log(`Backend server running on http://localhost:${env.BACKEND_PORT}`);
      console.log(`Health check at: http://localhost:${env.BACKEND_PORT}/health`);
      console.log(`API Base URL: http://localhost:${env.BACKEND_PORT}/api/v1`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Database disconnected. Process exited.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

