import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

type KeepAliveResponse = {
  success: boolean;
  message: string;
  timestamp: string;
};

const getEnv = (name: string) => process.env[name]?.trim() || '';

const sendJson = (res: any, status: number, payload: KeepAliveResponse) => {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const getRequestToken = (req: any) => {
  const headerToken = req.headers?.['x-keepalive-token'];
  if (typeof headerToken === 'string') return headerToken.trim();

  const host = req.headers?.host || 'localhost';
  const url = new URL(req.url || '/api/keepalive', `http://${host}`);
  return url.searchParams.get('token')?.trim() || '';
};

export default async function handler(req: any, res: any) {
  const timestamp = new Date().toISOString();

  if (req.method !== 'GET') {
    sendJson(res, 405, {
      success: false,
      message: 'Metodo nao permitido',
      timestamp,
    });
    return;
  }

  const expectedToken = getEnv('KEEPALIVE_TOKEN');
  if (!expectedToken || getRequestToken(req) !== expectedToken) {
    sendJson(res, 401, {
      success: false,
      message: 'Unauthorized',
      timestamp,
    });
    return;
  }

  const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    sendJson(res, 500, {
      success: false,
      message: 'Keep Alive nao configurado',
      timestamp,
    });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const sourceHeader = req.headers?.['x-keepalive-source'];
  const source = typeof sourceHeader === 'string' && sourceHeader.trim()
    ? sourceHeader.trim().slice(0, 80)
    : 'cron-job.org';

  const { error } = await supabase
    .from('keep_alive_logs')
    .insert({
      id: randomUUID(),
      executed_at: timestamp,
      source,
      status: 'success',
    });

  if (error) {
    console.error('Keep Alive failed:', error.message);
    sendJson(res, 500, {
      success: false,
      message: 'Falha ao executar Keep Alive',
      timestamp,
    });
    return;
  }

  sendJson(res, 200, {
    success: true,
    message: 'Keep Alive executado',
    timestamp,
  });
}
