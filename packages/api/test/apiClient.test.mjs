import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError, createApiClient, paginate } from '../dist/index.js';

const jsonResponse = (body, status = 200, headers = {}) =>
     new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/jsonResponse', ...headers },
     });
const tokens = tokenIndex => ({
     sessionId: `session-${tokenIndex}`,
     sessionToken: `access-${tokenIndex}`,
     refreshToken: 'refresh-token',
     idleExpiresAt: '2030-01-01T00:00:00Z',
     absoluteExpiresAt: '2030-02-01T00:00:00Z',
});
const logger = { info() { }, error() { } };

test('uses base URL, deduplicates in-flight GETs, caches, and invalidates', async () => {
     let calls = 0;
     const client = createApiClient({
          baseUrl: '/api',
          cacheTtlMs: 1_000,
          logger,
          fetch: async url => {
               calls++;
               assert.equal(url, '/api/');
               return jsonResponse({ ok: 'ok', path: '/' });
          },
     });
     await Promise.all([client.request('system.health.get'), client.request('system.health.get')]);
     await client.request('system.health.get');
     assert.equal(calls, 1);
     assert.equal(client.cache.invalidate('system.health.get'), 1);
     await client.request('system.health.get');
     assert.equal(calls, 2);
});

test('refreshes every protected call and coalesces concurrent refreshes', async () => {
     let refreshes = 0;
     const authHeaders = [];
     const saved = { refreshToken: 'refresh-token' };
     const client = createApiClient({
          baseUrl: 'https://music.test',
          logger,
          tokens: {
               getRefreshToken: () => saved.refreshToken,
               setTokens: value => Object.assign(saved, value),
          },
          fetch: async (url, init) => {
               if (url.endsWith('/auth/refresh')) {
                    refreshes++;
                    await new Promise(resolve => setTimeout(resolve, 2));
                    return jsonResponse(tokens(refreshes));
               }
               authHeaders.push(new Headers(init.headers).get('authorization'));
               return url.endsWith('/auth/me')
                    ? jsonResponse({ public_id: 'a'.repeat(32), identities: [] })
                    : jsonResponse({ mfa: { value: false, policy: 'inherited' } });
          },
     });
     const [user, config] = await Promise.all([client.request('auth.session.me'), client.request('auth.config.get')]);
     assert.equal(user.publicId, 'a'.repeat(32));
     assert.equal(config.mfa.policy, 'inherited');
     assert.equal(refreshes, 1);
     assert.deepEqual(authHeaders, ['Bearer access-1', 'Bearer access-1']);
     await client.request('auth.session.me');
     assert.equal(refreshes, 2);
});

test('validates login wire data, converts dates, and saves returned tokens', async () => {
     let saved;
     const client = createApiClient({
          baseUrl: 'https://music.test',
          logger,
          tokens: {
               getRefreshToken: () => saved?.refreshToken,
               setTokens: value => {
                    saved = value;
               },
          },
          fetch: async () => jsonResponse(tokens(1)),
     });
     const result = await client.request('auth.login.continue', {
          params: { id: 'attempt' },
          body: { method: 'password', value: 'secret' },
     });
     assert.ok(result.idleExpiresAt instanceof Date);
     assert.equal(saved.refreshToken, 'refresh-token');
});

test('maps audit filters and converts audit timestamps', async () => {
     let auditUrl;
     const client = createApiClient({
          baseUrl: 'https://music.test',
          logger,
          tokens: { getRefreshToken: () => 'refresh-token', setTokens() { } },
          fetch: async url => {
               if (url.endsWith('/auth/refresh')) return jsonResponse(tokens(1));
               auditUrl = url;
               return jsonResponse({
                    entries: [
                         {
                              id: 1,
                              action: 'auth.login.success',
                              actorType: 'user',
                              actorUserPublicId: null,
                              targetType: null,
                              targetId: null,
                              success: true,
                              oldValue: null,
                              newValue: null,
                              ip: null,
                              userAgent: null,
                              createdAt: '2025-01-02T03:04:05Z',
                         },
                    ],
                    nextCursor: null,
               });
          },
     });
     const page = await client.request('security.audit.list', {
          query: { actorPublicId: 'b'.repeat(32) },
     });
     assert.equal(new URL(auditUrl).searchParams.get('actor'), 'b'.repeat(32));
     assert.ok(page.entries[0].createdAt instanceof Date);
});

test('retries eligible GETs and reports typed HTTP failures', async () => {
     let calls = 0;
     const attempts = [];
     const retryClient = createApiClient({
          baseUrl: 'https://music.test',
          logger,
          retryAttempts: 1,
          hooks: { onRequest: context => attempts.push(context.attempt) },
          fetch: async () => (++calls === 1 ? jsonResponse({ error: 'retry' }, 503) : jsonResponse({ ok: 'ok', path: '/' })),
     });
     await retryClient.request('system.health.get');
     assert.equal(calls, 2);
     assert.deepEqual(attempts, [1, 2]);

     const errorClient = createApiClient({
          baseUrl: 'https://music.test',
          logger,
          fetch: async () => jsonResponse({ error: 'denied' }, 403, { 'x-test': 'present' }),
     });
     await assert.rejects(errorClient.request('system.health.get'), error => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 403);
          assert.equal(error.headers.get('x-test'), 'present');
          assert.deepEqual(error.body, { error: 'denied' });
          return true;
     });
});

test('supports abortable timeouts and cursor pagination', async () => {
     const timeoutClient = createApiClient({
          baseUrl: 'https://music.test',
          logger,
          timeoutMs: 2,
          retryAttempts: 0,
          fetch: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })),
     });
     await assert.rejects(timeoutClient.request('system.health.get'), error => error.code === 'aborted');

     const pages = [
          { items: [1, 2], next: 2 },
          { items: [3], next: null },
     ];
     const items = [];
     for await (const item of paginate(
          async () => pages.shift(),
          page => page.items,
          page => page.next,
     ))
          items.push(item);
     assert.deepEqual(items, [1, 2, 3]);
});
