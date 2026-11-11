import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

export type ReadinessProbe = () => boolean;

function sendJson(
  response: ServerResponse,
  status: number,
  body: Readonly<Record<string, string>>,
) {
  const text = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    'cache-control': 'no-store',
  });
  response.end(text);
}

/**
 * Minimal HTTP skeleton: liveness and readiness only. No WebSocket upgrade,
 * publishing or statistics endpoints exist at this phase.
 */
export function createHttpServer(isReady: ReadinessProbe): Server {
  return createServer((request: IncomingMessage, response: ServerResponse) => {
    const path = (request.url ?? '/').split('?')[0];

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendJson(response, 405, { error: 'method_not_allowed' });
      return;
    }
    if (path === '/health') {
      sendJson(response, 200, { status: 'ok' });
      return;
    }
    if (path === '/ready') {
      if (isReady()) {
        sendJson(response, 200, { status: 'ready' });
      } else {
        sendJson(response, 503, { status: 'not_ready' });
      }
      return;
    }
    sendJson(response, 404, { error: 'not_found' });
  });
}
