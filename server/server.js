import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import env from './config/env.js';
import errorHandler from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import assetRoutes from './routes/assets.js';
import credentialRoutes from './routes/credentials.js';
import correlationRoutes from './routes/correlations.js';
import attackPathRoutes from './routes/attackPaths.js';
import threatPersonaRoutes from './routes/threatPersonas.js';
import narrativeRoutes from './routes/narratives.js';
import alertRoutes from './routes/alerts.js';
import monitoringRoutes from './routes/monitoring.js';
import reportRoutes from './routes/reports.js';
import infrastructureRoutes from './routes/infrastructure.js';
import adminRoutes from './routes/admin.js';
import tiRoutes from './routes/ti.js';
import searchRoutes from './routes/search.js';
import { startScanScheduler } from './services/scanScheduler.js';

const app = express();

// Security & parsing middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/correlations', correlationRoutes);
app.use('/api/attack-paths', attackPathRoutes);
app.use('/api/threat-personas', threatPersonaRoutes);
app.use('/api/narratives', narrativeRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/exposure', alertRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ti', tiRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Global error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', error_code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` });
});

// Start server
const start = async () => {
  await connectDB();
  startScanScheduler();
  app.listen(env.PORT, () => {
    console.log(`\n🛡️  ShadowNet AI Backend running on port ${env.PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   API Base: http://localhost:${env.PORT}/api`);
    console.log(`   Health: http://localhost:${env.PORT}/api/health`);
    console.log(`   Continuous TI scanning: enabled\n`);
  });
};

start().catch(err => { console.error('Failed to start server:', err); process.exit(1); });

export default app;
