import http from 'node:http';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {validate} from './coach.js';
import {generatePlan, CoachError, DEFAULT_MODEL} from './ai-coach.js';
const root = dirname(fileURLToPath(import.meta.url));
const files = {'/':['index.html','text/html'],'/style.css':['style.css','text/css'],'/script.js':['script.js','text/javascript'],'/match-rules.js':['match-rules.js','text/javascript']};
const json = (res,status,data) => {
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
};
export function createServer({apiKey = process.env.GROQ_API_KEY || '', model = process.env.GROQ_MODEL || DEFAULT_MODEL, fetchImpl = fetch} = {}) {
  return http.createServer(async(req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'");
    const url = new URL(req.url,'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/status') return json(res,200,{aiConfigured:Boolean(apiKey),provider:'groq',model:apiKey?model:null});
    if (req.method === 'POST' && url.pathname === '/api/coach') {
      if (req.headers.origin && ![`http://${req.headers.host}`,`https://${req.headers.host}`].includes(req.headers.origin)) return json(res,403,{error:'Неприпустиме джерело запиту.'});
      let s;
      try {
        const chunks = []; let length = 0;
        for await (const chunk of req) {
          length += chunk.length;
          if (length > 10000) return json(res,413,{error:'Завеликий запит.'});
          chunks.push(chunk);
        }
        const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error();
        s = validate(input);
      } catch { return json(res,400,{error:'Перевір поля форми: гроші 0–16000, раунд 1–120, серія поразок 0–5.'}); }
      try { return json(res,200,await generatePlan(s,{apiKey,model,fetchImpl})); }
      catch (error) { return json(res,error instanceof CoachError ? error.status : 502,{error:error instanceof CoachError ? error.message : 'Не вдалося скласти план.'}); }
    }
    if (req.method === 'GET' && files[url.pathname]) {
      const [file,type] = files[url.pathname];
      res.writeHead(200,{'Content-Type':`${type}; charset=utf-8`});
      res.end(readFileSync(resolve(root,file))); return;
    }
    json(res,404,{error:'Сторінку не знайдено.'});
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (existsSync(resolve(root,'.env'))) process.loadEnvFile(resolve(root,'.env'));
  const server = createServer();
  server.listen(Number(process.env.PORT || 3000),process.env.HOST || '127.0.0.1',() => console.log(`RoundCoach: port ${server.address().port} | ${process.env.GROQ_API_KEY ? 'Groq configured' : 'Set GROQ_API_KEY in .env'}`));
  server.on('error',error => {console.error(error.code === 'EADDRINUSE' ? 'Порт зайнятий. Укажи інший PORT у .env.' : error.message);process.exitCode = 1;});
}
