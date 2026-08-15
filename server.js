const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'submissions.json');

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function ensureData(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if(!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({}));
}

function loadAll(){ ensureData(); return JSON.parse(fs.readFileSync(FILE)); }
function saveAll(obj){ fs.writeFileSync(FILE, JSON.stringify(obj, null, 2)); }

app.post('/api/submit/:project', (req, res) => {
  try{
    const project = req.params.project || 'generic';
    const all = loadAll();
    all[project] = all[project] || [];
    all[project].push({ts: Date.now(), data: req.body});
    saveAll(all);
    res.json({ok:true});
  }catch(err){ res.status(500).json({error: err.message}); }
});

app.get('/api/submissions/:project', (req, res) => {
  try{
    const project = req.params.project || 'generic';
    const all = loadAll();
    res.json(all[project] || []);
  }catch(err){ res.status(500).json({error: err.message}); }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
