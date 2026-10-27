import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
const port = Number(process.env.PORT || 3000);
app.use(express.static(path.join(root, 'public')));
app.get('/api/report', async (_req, res) => {
  try {
    const report = JSON.parse(await fs.readFile(path.join(root, 'reports/latest-report.json'), 'utf8'));
    res.json(report);
  } catch {
    res.json({ generatedAt: null, total: 0, passed: 0, failed: 0, results: [], message: 'No report yet. Start the demo API and run npm run test:guardian.' });
  }
});
app.listen(port, '0.0.0.0', () => console.log(`Dashboard running at http://localhost:${port}`));
