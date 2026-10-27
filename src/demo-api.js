import express from 'express';

const app = express();
const port = Number(process.env.API_PORT || 4000);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/v1/products', (_req, res) => {
  const products = [
    { id: 101, name: 'Notebook', price: 50 },
    { id: 102, name: 'Pen', price: 10 }
  ];
  // Demo switch: BREAK_API=true simulates a backend change that breaks old clients.
  const output = process.env.BREAK_API === 'true'
    ? products.map(({ price, ...product }) => product)
    : products;
  res.json({ version: 1, products: output });
});

app.get('/api/v1/profile', (_req, res) => {
  res.json({ id: 7, name: 'Asha', membership: 'standard' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Demo API listening at http://127.0.0.1:${port}`);
});
