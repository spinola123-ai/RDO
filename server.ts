import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3001;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Helper to read reports from disk safely
function loadReports(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading reports file:', err);
  }
  return [];
}

// Helper to write reports to disk safely
function saveReports(reports: any[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(reports, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('Error saving reports to file:', err);
  }
}

async function startServer() {
  const app = express();

  // Increase payload size to 50MB to support high-resolution construction field photos
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers for flexibility
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. GET all reports
  app.get('/api/reports', (req, res) => {
    try {
      const reports = loadReports();
      // Sort by reportNumber descending
      reports.sort((a, b) => (b.reportNumber || 0) - (a.reportNumber || 0));
      res.json(reports);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao obter relatórios', message: err?.message });
    }
  });

  // 3. GET single report by id
  app.get('/api/reports/:id', (req, res) => {
    try {
      const reports = loadReports();
      const found = reports.find((r) => r.id === req.params.id);
      if (!found) {
        return res.status(404).json({ error: 'Relatório não encontrado' });
      }
      res.json(found);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao buscar relatório', message: err?.message });
    }
  });

  // 4. POST create or update single report
  app.post('/api/reports', (req, res) => {
    try {
      const report = req.body;
      if (!report || !report.id) {
        return res.status(400).json({ error: 'Relatório inválido. ID obrigatório.' });
      }

      const reports = loadReports();
      const index = reports.findIndex((r) => r.id === report.id);

      const serverTimestamp = new Date().toISOString();
      const updatedReport = {
        ...report,
        syncStatus: 'synced',
        syncedAt: serverTimestamp,
        updatedAt: report.updatedAt || serverTimestamp,
      };

      if (index >= 0) {
        reports[index] = updatedReport;
      } else {
        reports.push(updatedReport);
      }

      saveReports(reports);
      res.json({ success: true, report: updatedReport });
    } catch (err: any) {
      console.error('Error saving report:', err);
      res.status(500).json({ error: 'Erro ao salvar relatório no servidor', message: err?.message });
    }
  });

  // 5. PUT update report
  app.put('/api/reports/:id', (req, res) => {
    try {
      const report = req.body;
      const reports = loadReports();
      const index = reports.findIndex((r) => r.id === req.params.id);

      const serverTimestamp = new Date().toISOString();
      const updatedReport = {
        ...report,
        id: req.params.id,
        syncStatus: 'synced',
        syncedAt: serverTimestamp,
        updatedAt: report.updatedAt || serverTimestamp,
      };

      if (index >= 0) {
        reports[index] = updatedReport;
      } else {
        reports.push(updatedReport);
      }

      saveReports(reports);
      res.json({ success: true, report: updatedReport });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao atualizar relatório', message: err?.message });
    }
  });

  // 6. POST sync batch (from offline client)
  app.post('/api/reports/sync', (req, res) => {
    try {
      const incomingReports: any[] = req.body.reports || [];
      const currentReports = loadReports();
      let syncedCount = 0;

      const serverTimestamp = new Date().toISOString();

      for (const incoming of incomingReports) {
        if (!incoming.id) continue;
        const index = currentReports.findIndex((r) => r.id === incoming.id);

        const markedSynced = {
          ...incoming,
          syncStatus: 'synced',
          syncedAt: serverTimestamp,
          updatedAt: incoming.updatedAt || serverTimestamp,
        };

        if (index >= 0) {
          // If already exists, compare updatedAt to keep newest version
          const existing = currentReports[index];
          const incomingTime = new Date(incoming.updatedAt || 0).getTime();
          const existingTime = new Date(existing.updatedAt || 0).getTime();

          if (incomingTime >= existingTime) {
            currentReports[index] = markedSynced;
            syncedCount++;
          }
        } else {
          currentReports.push(markedSynced);
          syncedCount++;
        }
      }

      saveReports(currentReports);

      // Return all reports so client has complete mirror of server
      currentReports.sort((a, b) => (b.reportNumber || 0) - (a.reportNumber || 0));
      res.json({
        success: true,
        syncedCount,
        reports: currentReports,
        serverTime: serverTimestamp,
      });
    } catch (err: any) {
      console.error('Sync batch error:', err);
      res.status(500).json({ error: 'Falha no processamento da sincronização', message: err?.message });
    }
  });

  // 7. DELETE report
  app.delete('/api/reports/:id', (req, res) => {
    try {
      const reports = loadReports();
      const filtered = reports.filter((r) => r.id !== req.params.id);
      saveReports(filtered);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao excluir relatório', message: err?.message });
    }
  });

  // Mount Vite middleware in development; serve static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RDO Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
