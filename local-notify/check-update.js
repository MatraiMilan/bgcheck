import { spawn } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO = 'MatraiMilan/bgcheck';
const DASHBOARD_URL = 'https://matraimilan.github.io/bgcheck/';
const SHA_FILE = join(__dirname, '.bgcheck_last_sha');
const BEER_ICON = join(__dirname, '..', 'assets', 'beer.png');
const NOTIFY_SCRIPT = join(__dirname, 'notify.py');

const envPath = join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    });
}

const token = process.env.BGCHECK_GITHUB_TOKEN;
if (!token) {
    console.error('BGCHECK_GITHUB_TOKEN not set');
    process.exit(1);
}

const response = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=1`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
    }
});

if (!response.ok) {
    console.error(`GitHub API error: ${response.status}`);
    process.exit(1);
}

const [latestCommit] = await response.json();
const latestSha = latestCommit.sha;
const latestAuthor = latestCommit.author?.login;

const lastSha = fs.existsSync(SHA_FILE) ? fs.readFileSync(SHA_FILE, 'utf8').trim() : '';

if (latestAuthor === 'github-actions[bot]' && latestSha !== lastSha) {
    fs.writeFileSync(SHA_FILE, latestSha);
    await new Promise((resolve) => {
        const proc = spawn('/usr/bin/python3', [NOTIFY_SCRIPT, BEER_ICON, DASHBOARD_URL], {
            stdio: 'ignore'
        });
        proc.on('error', (err) => console.error('Notification error:', err));
        proc.on('close', resolve);
    });
}
