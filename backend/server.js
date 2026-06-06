import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { getDb } from './database.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

let db;

async function queryAll(sql, params = []) {
  const result = await db.query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function runSql(sql, params = []) {
  await db.query(sql, params);
}

app.get('/api/saidas', async (req, res) => {
  try {
    db = await getDb();
    const { status } = req.query;
    let rows;

    if (status === 'pendente') {
      rows = await queryAll(`
        SELECT s.*, COUNT(d.id)::int as qtd_docs
        FROM saidas s LEFT JOIN documentos d ON d.saida_id = s.id
        GROUP BY s.id HAVING COUNT(d.id) = 0
        ORDER BY s.data DESC
      `);
    } else if (status === 'ok') {
      rows = await queryAll(`
        SELECT s.*, COUNT(d.id)::int as qtd_docs
        FROM saidas s LEFT JOIN documentos d ON d.saida_id = s.id
        GROUP BY s.id HAVING COUNT(d.id) > 0
        ORDER BY s.data DESC
      `);
    } else {
      rows = await queryAll(`
        SELECT s.*, COUNT(d.id)::int as qtd_docs
        FROM saidas s LEFT JOIN documentos d ON d.saida_id = s.id
        GROUP BY s.id ORDER BY s.data DESC
      `);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/saidas/status', async (req, res) => {
  try {
    db = await getDb();
    const total = (await queryOne('SELECT COUNT(*)::int as count FROM saidas'))?.count || 0;
    const pendentes = (await queryAll(`
      SELECT s.id FROM saidas s
      LEFT JOIN documentos d ON d.saida_id = s.id
      GROUP BY s.id HAVING COUNT(d.id) = 0
    `)).length;
    res.json({ total, pendentes, ok: total - pendentes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/saidas/:id', async (req, res) => {
  try {
    db = await getDb();
    const saida = await queryOne('SELECT * FROM saidas WHERE id = $1', [req.params.id]);
    if (!saida) return res.status(404).json({ error: 'Saída não encontrada' });
    saida.documentos = await queryAll('SELECT * FROM documentos WHERE saida_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json(saida);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/saidas', async (req, res) => {
  try {
    db = await getDb();
    const { destinatario, valor, data, origem, descricao } = req.body;
    if (!destinatario || valor == null || !data || !origem) {
      return res.status(400).json({ error: 'Campos obrigatórios: destinatario, valor, data, origem' });
    }
    const result = await db.query(
      'INSERT INTO saidas (destinatario, valor, data, origem, descricao) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [destinatario, Number(valor), data, origem, descricao || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/saidas/:id', async (req, res) => {
  try {
    db = await getDb();
    const existing = await queryOne('SELECT * FROM saidas WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Saída não encontrada' });

    const { destinatario, valor, data, origem, descricao } = req.body;
    const result = await db.query(
      `UPDATE saidas SET destinatario = $1, valor = $2, data = $3, origem = $4, descricao = $5, updated_at = NOW() WHERE id = $6 RETURNING *`,
      [
        destinatario ?? existing.destinatario,
        valor != null ? Number(valor) : existing.valor,
        data ?? existing.data,
        origem ?? existing.origem,
        descricao ?? existing.descricao,
        req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/saidas/:id', async (req, res) => {
  try {
    db = await getDb();
    const existing = await queryOne('SELECT * FROM saidas WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Saída não encontrada' });

    const docs = await queryAll('SELECT * FROM documentos WHERE saida_id = $1', [req.params.id]);
    for (const doc of docs) {
      if (doc.nome_arquivo) {
        await cloudinary.uploader.destroy(doc.nome_arquivo, { resource_type: 'raw' }).catch(() => {});
      }
    }

    await runSql('DELETE FROM saidas WHERE id = $1', [req.params.id]);
    res.json({ message: 'Saída removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/saidas/:id/documentos', upload.single('arquivo'), async (req, res) => {
  try {
    db = await getDb();
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const saida = await queryOne('SELECT * FROM saidas WHERE id = $1', [req.params.id]);
    if (!saida) {
      return res.status(404).json({ error: 'Saída não encontrada' });
    }

    const uniqueId = `savedoc/${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', public_id: uniqueId },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const result = await db.query(
      `INSERT INTO documentos (saida_id, nome_original, nome_arquivo, url, tipo, tamanho) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, req.file.originalname, uploadResult.public_id, uploadResult.secure_url, req.file.mimetype, req.file.size]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documentos/:id', async (req, res) => {
  try {
    db = await getDb();
    const doc = await queryOne('SELECT * FROM documentos WHERE id = $1', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Documento não encontrado' });

    if (doc.nome_arquivo) {
      await cloudinary.uploader.destroy(doc.nome_arquivo, { resource_type: 'raw' }).catch(() => {});
    }

    await runSql('DELETE FROM documentos WHERE id = $1', [req.params.id]);
    res.json({ message: 'Documento removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/relatorio', async (req, res) => {
  try {
    db = await getDb();
    const { data_inicio, data_fim } = req.query;

    let sql = `
      SELECT s.*, COUNT(d.id)::int as qtd_docs
      FROM saidas s LEFT JOIN documentos d ON d.saida_id = s.id
    `;
    const params = [];

    if (data_inicio && data_fim) {
      sql += ` WHERE s.data BETWEEN $1 AND $2`;
      params.push(data_inicio, data_fim);
    }

    sql += ` GROUP BY s.id ORDER BY s.data DESC`;

    const saidas = await queryAll(sql, params);
    const totalValor = saidas.reduce((acc, s) => acc + Number(s.valor), 0);
    const pendentes = saidas.filter(s => s.qtd_docs === 0).length;

    res.json({
      periodo: { inicio: data_inicio || 'Todas', fim: data_fim || 'Todas' },
      resumo: {
        total_saidas: saidas.length,
        total_valor: totalValor.toFixed(2),
        pendentes,
        documentadas: saidas.length - pendentes
      },
      saidas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
const start = async () => {
  db = await getDb();
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
};
start();
