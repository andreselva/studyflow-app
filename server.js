import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/flow', (req, res) => {
    const filePath = path.join(__dirname, 'flow.json');
    if (!fs.existsSync(filePath)) {
        return res.json({ nodes: [], edges: [] });
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(data));
})

app.post('/flow', (req, res) => {
    const filePath = path.join(__dirname, 'flow.json');
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
    res.json({ ok: true })
})

app.listen(3001, () => console.log('SERVER RUNNING ON PORT 3001'))