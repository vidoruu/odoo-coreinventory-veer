import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import locationRoutes from './routes/locations.js';
import operationRoutes from './routes/operations.js';
import moveRoutes from './routes/moves.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// --- Routes (mounted per phase) ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/moves', moveRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CoreInventory API is running ✅' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 CoreInventory API running on http://localhost:${PORT}`);
});
