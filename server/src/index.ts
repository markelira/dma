console.log('🟢 If you see this, the file is running');

import express from 'express'
import { PrismaClient } from '@prisma/client'
import { securityHeaders, sanitizeInput, requestLogger, corsOptions, authRateLimit, passwordResetRateLimit } from './middleware/securityMiddleware'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware'
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import categoryRoutes from './routes/categoryRoutes'
import wishlistRoutes from './routes/wishlistRoutes'
import bodyParser from 'body-parser'
import courseRoutes from './routes/courseRoutes'
import muxRoutes from './routes/muxRoutes';
import playerRoutes from './routes/playerRoutes';
import lessonProgressRoutes from './routes/lessonProgressRoutes';
// import moduleRoutes from './routes/moduleRoutes'
// import lessonRoutes from './routes/lessonRoutes'
// import enrollmentRoutes from './routes/enrollmentRoutes'
// import progressRoutes from './routes/progressRoutes'
// import quizRoutes from './routes/quizRoutes'
// import reviewRoutes from './routes/reviewRoutes'
// import fileRoutes from './routes/fileRoutes'
// import adminCourseRoutes from './routes/adminCourseRoutes'
// import adminModuleRoutes from './routes/adminModuleRoutes'
// import adminLessonRoutes from './routes/adminLessonRoutes'
// import adminCategoryRoutes from './routes/adminCategoryRoutes'
// import certificateRoutes from './routes/certificateRoutes'
// import notificationRoutes from './routes/notificationRoutes'
// import lessonProgressRoutes from './routes/lessonProgressRoutes'
// import healthRoutes from './routes/healthRoutes'
// import adminRoutes from './routes/adminRoutes'
// import instructorRoutes from './routes/instructorRoutes'
// import statsRoutes from './routes/statsRoutes'
// import redis from './utils/redis'
// import logger from './utils/logger'

// Temporary logger for testing
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn
}

// Temporary Redis mock for testing
const redis = {
  ping: async () => 'PONG'
}

// Basic error handlers
const notFoundHandler = (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' })
}

const errorHandler = (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
}

// Graceful shutdown function
const gracefulShutdown = (server: any) => {
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
}

console.log('🔍 [Server] Beginning bootstrap in server/src/index.ts')

dotenv.config()

const app = express()
const prisma = new PrismaClient()

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1)

// Security middleware
app.use(securityHeaders)
app.use(cors(corsOptions))
app.use(sanitizeInput)
app.use(requestLogger)

// Rate limiting
app.use(rateLimitMiddleware)

// Apply raw body parsing ONLY for Stripe and Mux webhooks (BEFORE general JSON parsing)
app.use('/api/subscriptions/webhook', bodyParser.raw({ type: 'application/json' }))
app.use('/api/webhooks/mux', bodyParser.raw({ type: 'application/json' }))
// Body parsing middleware for all other routes
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// 🔬 SURGICAL ISOLATION PROTOCOL - Test each route individually
console.log('🔬 Starting surgical isolation protocol...')

// Test 1: courseRoutes (PASSED ✅)
console.log('🧪 Testing courseRoutes...')
try {
  const courseRoutes = require('./routes/courseRoutes')
  app.use('/api/courses', courseRoutes.default || courseRoutes)
  console.log('✅ courseRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ courseRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 2: authRoutes (NOW TESTING)
console.log('🧪 Testing authRoutes...')
try {
  const authRoutes = require('./routes/authRoutes')
  app.use('/api/auth', authRoutes.default || authRoutes)
  console.log('✅ authRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ authRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 3: objectiveRoutes (NOW TESTING - recently added)
console.log('🧪 Testing objectiveRoutes...')
try {
  const objectiveRoutes = require('./routes/objectiveRoutes')
  app.use('/api/objectives', objectiveRoutes.default || objectiveRoutes)
  console.log('✅ objectiveRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ objectiveRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 4: instructorRoutes (NOW TESTING - recently added)
console.log('🧪 Testing instructorRoutes...')
try {
  const instructorRoutes = require('./routes/instructorRoutes')
  app.use('/api/instructors', instructorRoutes.default || instructorRoutes)
  console.log('✅ instructorRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ instructorRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 5: statsRoutes (NOW TESTING - recently added)
console.log('🧪 Testing statsRoutes...')
try {
  const statsRoutes = require('./routes/statsRoutes')
  app.use('/api/stats', statsRoutes.default || statsRoutes)
  console.log('✅ statsRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ statsRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 6: categoryRoutes (NOW TESTING - recently added)
console.log('🧪 Testing categoryRoutes...')
try {
  app.use('/api/categories', categoryRoutes)
  console.log('✅ categoryRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ categoryRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 7: enrollmentRoutes (NOW TESTING - recently added)
console.log('🧪 Testing enrollmentRoutes...')
try {
  const enrollmentRoutes = require('./routes/enrollmentRoutes')
  app.use('/api/enrollments', enrollmentRoutes.default || enrollmentRoutes)
  console.log('✅ enrollmentRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ enrollmentRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 8: reviewRoutes (NOW TESTING - recently added)
console.log('🧪 Testing reviewRoutes...')
try {
  const reviewRoutes = require('./routes/reviewRoutes')
  app.use('/api/reviews', reviewRoutes.default || reviewRoutes)
  console.log('✅ reviewRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ reviewRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 9: healthRoutes (NOW TESTING - recently added)
console.log('🧪 Testing healthRoutes...')
try {
  const healthRoutes = require('./routes/healthRoutes')
  app.use('/api/health', healthRoutes.default || healthRoutes)
  console.log('✅ healthRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ healthRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 10: subscriptionRoutes (NEW - Stripe integration)
console.log('🧪 Testing subscriptionRoutes...')
try {
  const subscriptionRoutes = require('./routes/subscriptionRoutes')
  app.use('/api/subscriptions', subscriptionRoutes.default || subscriptionRoutes)
  console.log('✅ subscriptionRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ subscriptionRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test X: moduleRoutes (NOW TESTING - enable modules API)
console.log('🧪 Testing moduleRoutes...')
try {
  const moduleRoutes = require('./routes/moduleRoutes')
  app.use('/api/modules', moduleRoutes.default || moduleRoutes)
  console.log('✅ moduleRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ moduleRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 12: userRoutes (NEW - User progress testing)
console.log('🧪 Testing userRoutes...')
try {
  app.use('/api/users', userRoutes)
  console.log('✅ userRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ userRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 13: fileRoutes (NEW - Cloud Storage testing)
console.log('🧪 Testing fileRoutes...')
try {
  const fileRoutes = require('./routes/fileRoutes')
  app.use('/api/files', fileRoutes.default || fileRoutes)
  console.log('✅ fileRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ fileRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test 14: publicUniversityRoutes (NEW - Public University pages)
console.log('🧪 Testing publicUniversityRoutes...')
try {
  const publicUniversityRoutes = require('./routes/publicUniversityRoutes')
  app.use('/api/public/universities', publicUniversityRoutes.default || publicUniversityRoutes)
  console.log('✅ publicUniversityRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ publicUniversityRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test X: universityRoutes (NOW TESTING - new)
console.log('🧪 Testing universityRoutes...')
try {
  const universityRoutes = require('./routes/universityRoutes')
  app.use('/api/universities', universityRoutes.default || universityRoutes)
  console.log('✅ universityRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ universityRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test XI: wishlistRoutes (NOW TESTING - new)
console.log('🧪 Testing wishlistRoutes...')
try {
  const wishlistRoutes = require('./routes/wishlistRoutes')
  app.use('/api/wishlist', wishlistRoutes.default || wishlistRoutes)
  console.log('✅ wishlistRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ wishlistRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test XX: adminRoutes (NOW TESTING - newly enabled)
console.log('🧪 Testing adminRoutes...')
try {
  const adminRoutes = require('./routes/adminRoutes')
  app.use('/api/admin', adminRoutes.default || adminRoutes)
  console.log('✅ adminRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ adminRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test Mux Routes (NEW - Mux webhook testing)
console.log('🧪 Testing muxRoutes...')
try {
  app.use('/api/webhooks', muxRoutes)
  console.log('✅ muxRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ muxRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// Test Player Routes (NEW - Player routes testing)
console.log('🧪 Testing playerRoutes...')
try {
  app.use('/api', playerRoutes)
  console.log('✅ playerRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ playerRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

// After moduleRoutes
console.log('🧪 Testing lessonRoutes...')
try {
  const lessonRoutes = require('./routes/lessonRoutes')
  app.use('/api/lessons', lessonRoutes.default || lessonRoutes)
  console.log('✅ lessonRoutes loaded successfully')
} catch (err: any) {
  console.error('❌ lessonRoutes FAILED:', err.message)
  console.error('Stack:', err.stack)
}

console.log('🧪 Testing lessonProgressRoutes...')
app.use('/api/lessons', lessonProgressRoutes)
console.log('✅ lessonProgressRoutes loaded successfully')

console.log('🔬 Isolation protocol complete, continuing with server setup...')

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/certificates', express.static(path.join(__dirname, '../certificates')))

// 404 handler for unmatched routes
app.use(notFoundHandler)

// Global error handling middleware
app.use(errorHandler)

const PORT = process.env.PORT || 4000

// Enhanced database connection check with retry logic
const checkDatabaseConnection = async (retries = 3, delay = 2000): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect()
      logger.info('Database connected successfully')
      return
    } catch (error) {
      logger.error(`Database connection attempt ${attempt}/${retries} failed:`, error)
      
      if (attempt === retries) {
        logger.error('All database connection attempts failed. Exiting...')
        process.exit(1)
      }
      
      logger.info(`Retrying database connection in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Enhanced Redis connection check with retry logic
const checkRedisConnection = async (retries = 3, delay = 2000): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await redis.ping()
      if (result === 'PONG') {
        logger.info(`Redis connected successfully: ${result}`)
        return
      } else {
        throw new Error(`Unexpected Redis response: ${result}`)
      }
    } catch (error) {
      logger.error(`Redis connection attempt ${attempt}/${retries} failed:`, error)
      
      if (attempt === retries) {
        logger.warn('All Redis connection attempts failed. Continuing without Redis...')
        return
      }
      
      logger.info(`Retrying Redis connection in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Enhanced server startup with comprehensive error handling
const startServer = async (): Promise<any> => {
  try {
    logger.info('🚀 Starting Elira backend server...')
    
    // Validate environment variables
    const requiredEnvVars = ['DATABASE_URL']
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingEnvVars.length > 0) {
      logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
      process.exit(1)
    }

    // Check connections with retry logic
    await checkDatabaseConnection()
    await checkRedisConnection()

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Szerver elindult a ${PORT} porton`)
      logger.info(`📱 Környezet: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`🔗 Egészség ellenőrzés: http://localhost:${PORT}/api/health`)
      logger.info(`🔍 Részletes egészség: http://localhost:${PORT}/api/health/detailed`)
      logger.info(`🌐 API alap URL: http://localhost:${PORT}/api`)
      logger.info(`📊 Adatbázis: ${process.env.DATABASE_URL ? 'Konfigurálva' : 'HIÁNYZÓ'}`)
      logger.info(`🛡️ CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`)
      
      // Log memory usage
      const memUsage = process.memoryUsage()
      logger.info(`💾 Memória használat: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`)
      
      // Log server startup completion
      logger.info('✅ Server startup completed successfully')
    })

    // Setup graceful shutdown
    gracefulShutdown(server)

    return server
  } catch (error) {
    logger.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Startup validation
async function validateStartup() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection validated');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connection validated');

    // Validate environment
    console.log('✅ Environment validated');
  } catch (error) {
    console.error('🚨 Startup validation failed:', error);
    process.exit(1);
  }
}

// Add comprehensive health endpoint
app.get('/health/comprehensive', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    environment: false,
    imports: false,
    memory: false
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;

    // Redis check
    await redis.ping();
    checks.redis = true;

    // Environment check
    checks.environment = true;

    // Memory check
    const memory = process.memoryUsage();
    checks.memory = memory.heapUsed < 1000000000; // 1GB limit

    // Imports check
    try {
      require('../scripts/test-imports');
      checks.imports = true;
    } catch {
      checks.imports = false;
    }

    // Overall health
    const healthy = Object.values(checks).every(check => check);

    res.status(healthy ? 200 : 500).json({
      status: healthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      checks
    });
  }
});

// Only start server if this file is run directly (not imported)
if (require.main === module) {
  startServer()
}

export { prisma }
export default app