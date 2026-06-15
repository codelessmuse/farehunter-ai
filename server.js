import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'dist')));
app.get('/api/flights', async (req, res) => {
  try {
    const token = process.env.TRAVELPAYOUTS_TOKEN || process.env.VITE_TRAVELPAYOUTS_TOKEN;

    if (!token) {
      return res.status(500).json({ error: 'Travelpayouts token is missing' });
    }

    const url = new URL('https://api.travelpayouts.com/aviasales/v3/get_latest_prices');
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        url.searchParams.set(key, value);
      }
    }

    url.searchParams.set('token', token);

    const response = await fetch(url.toString());
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Unable to fetch flights',
    });
  }
});
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
app.listen(PORT, () => {
  console.log(`FareHunter API server running on http://localhost:${PORT}`);
});