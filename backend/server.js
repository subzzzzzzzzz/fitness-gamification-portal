const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DB_PATH = path.join(__dirname, 'db.json');

// Start json-server on port 3001
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const jsonServerProc = spawn(npxCmd, ['json-server', '--port', '3001', DB_PATH], {
  stdio: 'inherit',
  shell: true
});

jsonServerProc.on('error', (err) => {
  console.error('Failed to start json-server child process:', err);
});

process.on('exit', () => {
  jsonServerProc.kill();
});

function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const proxyServer = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle custom routes
  if (req.url === '/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name, email, password, phone, city, region } = JSON.parse(body);
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        
        if (!name || !email || !password) {
          setCorsHeaders(req, res);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Missing required fields' }));
          return;
        }

        const existingUser = db.users.find(u => u.email === email);
        if (existingUser) {
          setCorsHeaders(req, res);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Email already registered' }));
          return;
        }

        const newUser = {
          id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
          name,
          email,
          password,
          role: 'ROLE_USER',
          points: 0,
          milestone: 'Novice',
          region: region || 'APAC',
          phone: phone || '',
          city: city || '',
          streak: 0
        };

        db.users.push(newUser);
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

        const token = Buffer.from(JSON.stringify({ id: newUser.id, email: newUser.email, role: newUser.role })).toString('base64');
        setCorsHeaders(req, res);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            points: newUser.points,
            milestone: newUser.milestone,
            region: newUser.region
          }
        }));
      } catch (err) {
        setCorsHeaders(req, res);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });
  } else if (req.url === '/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        
        const user = db.users.find(u => u.email === email && u.password === password);
        if (!user) {
          setCorsHeaders(req, res);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid email or password' }));
          return;
        }

        const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role })).toString('base64');
        setCorsHeaders(req, res);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            points: user.points,
            milestone: user.milestone,
            region: user.region
          }
        }));
      } catch (err) {
        setCorsHeaders(req, res);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });
  } else if (req.url === '/rank' && req.method === 'GET') {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const activeUsersCount = db.users.filter(u => u.role === 'ROLE_USER').length;
    setCorsHeaders(req, res);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: `Rankings computed successfully. ${activeUsersCount} records updated.`
    }));
  } else if (req.url === '/game' && req.method === 'GET') {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const badgeCount = db.badges.length;
    setCorsHeaders(req, res);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: `Badges and milestones calculated. ${badgeCount} badges checked/awarded.`
    }));
  } else {
    // Proxy other requests to json-server on port 3001
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    req.pipe(proxyReq, { end: true });

    proxyReq.on('error', (err) => {
      setCorsHeaders(req, res);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Bad Gateway - json-server is not running' }));
    });
  }
});

proxyServer.listen(3000, () => {
  console.log('SmartFit Platform Mock Backend is running on http://localhost:3000');
});
