import fs from 'node:fs';
import axios from 'axios';
import https from 'node:https';

let lcuConfig: { port: string, token: string } | null = null;
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export function discoverLCU() {
    const lockfilePath = 'C:\\Riot Games\\League of Legends\\lockfile';
    if (fs.existsSync(lockfilePath)) {
        const content = fs.readFileSync(lockfilePath, 'utf8');
        const [, , port, token] = content.split(':');
        lcuConfig = { port, token };
        return true;
    }
    return false;
}

export async function lcuRequest(method: string, endpoint: string, data?: any) {
    if (!lcuConfig) discoverLCU();
    if (!lcuConfig) return null;
    try {
        const response = await axios({
            method,
            url: `https://127.0.0.1:${lcuConfig.port}${endpoint}`,
            data,
            headers: {
                'Authorization': `Basic ${Buffer.from(`riot:${lcuConfig.token}`).toString('base64')}`,
                'Accept': 'application/json'
            },
            httpsAgent: httpsAgent
        });
        return response.data;
    } catch (err) {
        return null;
    }
}
