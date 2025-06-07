// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import matchRoutes from './src/routes/matchRoutes.js';




dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// -======================= API ROUTING======================================
app.use('/matches', matchRoutes);



//========================= Middleware======================================
app.use(cors());
app.use(express.json());

//====================== Basic test route====================================
app.get('/', (req, res) => {
  res.send('Welcome to 24FBLIVESCORE API');
});

//====================== Start the server====================================
connectDB();
app.listen(PORT, () => {
  console.log(`24FBLIVESCORE backend running on port ${PORT}`);
});
