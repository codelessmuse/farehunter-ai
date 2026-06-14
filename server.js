import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
const PORT = 3001;

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

app.listen(PORT, () => {
  console.log(`FareHunter API server running on http://localhost:${PORT}`);
});