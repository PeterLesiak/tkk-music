export * from './types/permissions.js';
export * from './types/auditLog.js';

import type { AuditLogEntry, AuditLogFilters } from './types/auditLog.js';
import type { Permission, Role } from './types/permissions.js';

export type AuthMethod = 'password' | 'webauthn' | 'totp' | 'oauth_google' | 'recovery_code';
export type CredentialMethod = 'password' | 'totp' | 'recovery_code';
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type WeekDayParameter = WeekDay | 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface LoginMethodChoice {
     code: AuthMethod;
     name: string;
}

export interface SessionTokens {
     sessionId: string;
     sessionToken: string;
     refreshToken: string;
     idleExpiresAt: Date;
     absoluteExpiresAt: Date;
}

export interface StaticScheduleBlock {
     id: number;
     dayOfWeek: WeekDay;
     startTime: string;
     endTime: string;
     label: string;
     description: string | null;
     genre: Record<string, unknown>;
     isActive: boolean;
     createdAt: Date;
     updatedAt: Date;
}

export interface DynamicScheduleEntry {
     id: number;
     staticScheduleBlock: StaticScheduleBlock;
     scheduleDate: Date;
     status: { id: number; code: string };
     createdAt: Date;
     updatedAt: Date;
}

export interface CurrentUser {
     publicId: string;
     identities: { type: 'username' | 'email' | 'phone'; value: string }[];
}

export type LoginResult = { methods: LoginMethodChoice[] } | SessionTokens;

export interface AuditPage {
     entries: AuditLogEntry[];
     nextCursor: number | null;
}

export type AuditQuery = Omit<AuditLogFilters, 'from' | 'to'> & {
     from?: Date | string;
     to?: Date | string;
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type EndpointAuthMode = 'none' | 'session' | 'refresh';
export type WireValue<DomainType> = DomainType extends Date
     ? string
     : DomainType extends string | number | boolean | null
     ? DomainType
     : DomainType extends readonly (infer ArrayItem)[]
     ? WireValue<ArrayItem>[]
     : DomainType extends object
     ? { [PropertyKey in keyof DomainType]: WireValue<DomainType[PropertyKey]> }
     : DomainType;

type ApiEndpointContract<
     EndpointMethod extends HttpMethod,
     RoutePath extends string,
     ResponseType,
     RequestBodyType = never,
     PathParameters = never,
     QueryParameters = never,
     EndpointAuthorization extends EndpointAuthMode = 'none',
> = {
     method: EndpointMethod;
     path: RoutePath;
     response: ResponseType;
     wireResponse: WireValue<ResponseType>;
     body: RequestBodyType;
     params: PathParameters;
     query: QueryParameters;
     auth: EndpointAuthorization;
};

export interface ApiEndpointMap {
     'system.health.get': ApiEndpointContract<'GET', '/', { ok: string; path: string }>;
     'auth.register': ApiEndpointContract<
          'POST',
          '/auth/register',
          { refreshToken: string },
          ({ username: string } | { email: string } | { phone: string }) & {
               password: string;
               deviceToken?: string;
          }
     >;
     'auth.login.start': ApiEndpointContract<
          'POST',
          '/auth/login',
          { id: string; methods: LoginMethodChoice[] },
          ({ username: string } | { email: string } | { phone: string }) & {
               nonce: string;
          }
     >;
     'auth.login.continue': ApiEndpointContract<'POST', '/auth/login/next/:id', LoginResult, { method: CredentialMethod; value: string; deviceToken?: string }, { id: string }>;
     'auth.session.me': ApiEndpointContract<'GET', '/auth/me', CurrentUser, never, never, never, 'session'>;
     'auth.session.refresh': ApiEndpointContract<'GET', '/auth/refresh', SessionTokens, never, never, never, 'refresh'>;
     'auth.session.rotate': ApiEndpointContract<'GET', '/auth/rotate', { sessionToken: string; refreshToken: string; expiresAt: Date }, never, never, never, 'refresh'>;
     'auth.session.logout': ApiEndpointContract<'POST', '/auth/logout', Record<string, never>, never, never, never, 'session'>;
     'auth.config.get': ApiEndpointContract<'GET', '/auth/config', { mfa: { value: boolean; policy: 'user' | 'inherited' } }, never, never, never, 'session'>;
     'scheduling.static.list': ApiEndpointContract<'GET', '/scheduler/static', StaticScheduleBlock[], never, never, never, 'session'>;
     'scheduling.static.getById': ApiEndpointContract<'GET', '/scheduler/static/:id', StaticScheduleBlock | null, never, { id: number }, never, 'session'>;
     'scheduling.static.create': ApiEndpointContract<
          'PUT',
          '/scheduler/static/:weekDay',
          { status: 'ok' },
          { startTime: string; endTime: string; label: string; description?: string },
          { weekDay: WeekDayParameter },
          never,
          'session'
     >;
     'scheduling.static.update': ApiEndpointContract<
          'PATCH',
          '/scheduler/static/:id',
          { status: 'Ok' },
          {
               startTime?: string;
               endTime?: string;
               label?: string;
               description?: string;
               isActive?: boolean;
          },
          { id: number },
          never,
          'session'
     >;
     'scheduling.static.delete': ApiEndpointContract<'DELETE', '/scheduler/static/:id', { status: 'Ok' }, never, { id: number }, never, 'session'>;
     'scheduling.dynamic.list': ApiEndpointContract<'GET', '/scheduler/dynamic', DynamicScheduleEntry[], never, never, never, 'session'>;
     'security.permissions.me': ApiEndpointContract<'GET', '/security/@me/permissions', Permission[], never, never, never, 'session'>;
     'security.roles.me': ApiEndpointContract<'GET', '/security/@me/roles', Role[] | null, never, never, never, 'session'>;
     'security.audit.list': ApiEndpointContract<'GET', '/security/audit', AuditPage, never, never, AuditQuery, 'session'>;
}

export type EndpointName = keyof ApiEndpointMap;
export type EndpointResponse<EndpointKey extends EndpointName> = ApiEndpointMap[EndpointKey]['response'];
type EndpointRequestFields<EndpointKey extends EndpointName> = (ApiEndpointMap[EndpointKey]['params'] extends never ? {} : { params: ApiEndpointMap[EndpointKey]['params'] }) &
     (ApiEndpointMap[EndpointKey]['query'] extends never ? {} : { query?: ApiEndpointMap[EndpointKey]['query'] }) &
     (ApiEndpointMap[EndpointKey]['body'] extends never ? {} : { body: ApiEndpointMap[EndpointKey]['body'] });
export interface RequestControls {
     signal?: AbortSignal;
     timeoutMs?: number;
     headers?: Readonly<Record<string, string>>;
     retry?: boolean;
     cache?: boolean;
     deduplicate?: boolean;
}
export type RequestOptions<EndpointKey extends EndpointName> = EndpointRequestFields<EndpointKey> & RequestControls;
type RequiredKeys<ObjectType> = {
     [PropertyKey in keyof ObjectType]-?: {} extends Pick<ObjectType, PropertyKey> ? never : PropertyKey;
}[keyof ObjectType];
export type RequestArguments<EndpointKey extends EndpointName> =
     RequiredKeys<RequestOptions<EndpointKey>> extends never ? [options?: RequestOptions<EndpointKey>] : [options: RequestOptions<EndpointKey>];

export interface TokenCallbacks {
     getRefreshToken: () => string | undefined | Promise<string | undefined>;
     setTokens: (tokens: TokenUpdate) => void | Promise<void>;
}
export type TokenUpdate = {
     [Key in keyof SessionTokens]?: SessionTokens[Key] | undefined;
};
export interface ApiLogger {
     info: (message: string, context?: Record<string, unknown>) => void;
     error: (message: string, context?: Record<string, unknown>) => void;
}
export interface ApiHooks {
     onRequest?: (context: { endpoint: EndpointName; url: string; attempt: number }) => void | Promise<void>;
     onResponse?: (context: { endpoint: EndpointName; url: string; status: number }) => void | Promise<void>;
     onError?: (context: { endpoint: EndpointName; url: string; error: unknown }) => void | Promise<void>;
}
export interface ApiClientOptions {
     baseUrl: string;
     fetch?: typeof fetch;
     tokens?: TokenCallbacks;
     logger?: ApiLogger;
     hooks?: ApiHooks;
     timeoutMs?: number;
     retryAttempts?: number;
     cacheTtlMs?: number;
}

export class ApiError extends Error {
     constructor(
          message: string,
          readonly status: number | null,
          readonly headers: Headers | null,
          readonly body: unknown,
          readonly endpoint: EndpointName | undefined,
          readonly code: 'http' | 'network' | 'aborted' | 'validation' | 'auth',
          options?: ErrorOptions,
     ) {
          super(message, options);
          this.name = 'ApiError';
     }
}

type EndpointRuntime<EndpointKey extends EndpointName> = {
     method: ApiEndpointMap[EndpointKey]['method'];
     path: ApiEndpointMap[EndpointKey]['path'];
     auth: ApiEndpointMap[EndpointKey]['auth'];
     parse: (value: unknown) => EndpointResponse<EndpointKey>;
     validate?: (input: unknown) => void;
};
const asRecord = (value: unknown, name = 'value'): Record<string, unknown> => {
     if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new TypeError(`Expected ${name} to be an object`);
     }
     return value as Record<string, unknown>;
};
const asString = (value: unknown, name: string): string => {
     if (typeof value !== 'string') throw new TypeError(`Expected ${name} to be a string`);
     return value;
};
const asNumber = (value: unknown, name: string): number => {
     if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`Expected ${name} to be a number`);
     return value;
};
const asDate = (value: unknown, name: string): Date => {
     const result = value instanceof Date ? new Date(value) : new Date(asString(value, name));
     if (Number.isNaN(result.getTime())) throw new TypeError(`Expected ${name} to be a valid date`);
     return result;
};
const asArray = <ArrayItem>(value: unknown, name: string, parse: (item: unknown) => ArrayItem): ArrayItem[] => {
     if (!Array.isArray(value)) throw new TypeError(`Expected ${name} to be an array`);
     return value.map(parse);
};
const asBoolean = (value: unknown, name: string): boolean => {
     if (typeof value !== 'boolean') throw new TypeError(`Expected ${name} to be boolean`);
     return value;
};
const asNullableString = (value: unknown, name: string): string | null => (value === null ? null : asString(value, name));
const weekday = (value: unknown): WeekDay => {
     const day = asString(value, 'dayOfWeek');
     if (!['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(day)) {
          throw new TypeError(`Unknown weekday: ${day}`);
     }
     return day as WeekDay;
};
const parseBlock = (value: unknown): StaticScheduleBlock => {
     const block = asRecord(value, 'schedule block');
     return {
          id: asNumber(block['id'], 'id'),
          dayOfWeek: weekday(block['dayOfWeek']),
          startTime: asString(block['startTime'], 'startTime'),
          endTime: asString(block['endTime'], 'endTime'),
          label: asString(block['label'], 'label'),
          description: asNullableString(block['description'], 'description'),
          genre: asRecord(block['genre'], 'genre'),
          isActive: asBoolean(block['isActive'], 'isActive'),
          createdAt: asDate(block['createdAt'], 'createdAt'),
          updatedAt: asDate(block['updatedAt'], 'updatedAt'),
     };
};
const parseTokens = (value: unknown): SessionTokens => {
     const result = asRecord(value, 'session tokens');
     return {
          sessionId: asString(result['sessionId'], 'sessionId'),
          sessionToken: asString(result['sessionToken'], 'sessionToken'),
          refreshToken: asString(result['refreshToken'], 'refreshToken'),
          idleExpiresAt: asDate(result['idleExpiresAt'], 'idleExpiresAt'),
          absoluteExpiresAt: asDate(result['absoluteExpiresAt'], 'absoluteExpiresAt'),
     };
};
const parseMethods = (value: unknown): LoginMethodChoice[] =>
     asArray(value, 'methods', item => {
          const method = asRecord(item, 'method');
          const code = asString(method['code'], 'method code');
          if (!['password', 'webauthn', 'totp', 'oauth_google', 'recovery_code'].includes(code)) {
               throw new TypeError(`Unknown auth method: ${code}`);
          }
          return { code: code as AuthMethod, name: asString(method['name'], 'method name') };
     });
const parseAuditEntry = (value: unknown): AuditLogEntry => {
     const item = asRecord(value, 'audit entry');
     return {
          id: asNumber(item['id'], 'id'),
          action: asString(item['action'], 'action'),
          actorType: asString(item['actorType'], 'actorType'),
          actorUserPublicId: asNullableString(item['actorUserPublicId'], 'actorUserPublicId'),
          targetType: asNullableString(item['targetType'], 'targetType'),
          targetId: asNullableString(item['targetId'], 'targetId'),
          success: asBoolean(item['success'], 'success'),
          oldValue: item['oldValue'],
          newValue: item['newValue'],
          ip: asNullableString(item['ip'], 'ip'),
          userAgent: asNullableString(item['userAgent'], 'userAgent'),
          createdAt: asDate(item['createdAt'], 'createdAt'),
     };
};
const parsePermission = (value: unknown): Permission => {
     const item = asRecord(value, 'permission');
     const category = asRecord(item['category'], 'category');
     const codes = [
          'music.artists.manage',
          'music.audio_files.manage',
          'music.songs.create',
          'music.songs.delete',
          'music.songs.edit',
          'music.songs.view',
          'permissions.roles.manage',
          'queue.view',
          'queue.manage',
          'scheduling.static.view',
          'scheduling.static.manage',
          'scheduling.dynamic.view',
          'scheduling.dynamic.manage',
          'system.audit_log.view',
          'users.manage',
          'users.view',
     ];
     const name = asString(item['name'], 'permission name');
     if (!codes.includes(name)) throw new TypeError(`Unknown permission: ${name}`);
     return {
          id: asNumber(item['id'], 'id'),
          name: name as Permission['name'],
          category: { id: asNumber(category['id'], 'category id'), name: asString(category['name'], 'category name') },
     };
};
const parseRole = (value: unknown): Role => {
     const item = asRecord(value, 'role');
     const description = item['description'];
     return {
          id: asNumber(item['id'], 'id'),
          code: asString(item['code'], 'code'),
          displayName: asString(item['displayName'], 'displayName'),
          ...(description == null ? {} : { description: asString(description, 'description') }),
          isSystemRole: asBoolean(item['isSystemRole'], 'isSystemRole'),
          createdAt: asDate(item['createdAt'], 'createdAt'),
     };
};
const parseAuditPage = (value: unknown): AuditPage => {
     const page = asRecord(value, 'audit page');
     return {
          entries: asArray(page['entries'], 'entries', parseAuditEntry),
          nextCursor: page['nextCursor'] === null ? null : asNumber(page['nextCursor'], 'nextCursor'),
     };
};
const parseStatus = <ExpectedStatus extends 'ok' | 'Ok'>(value: unknown, expected: ExpectedStatus): { status: ExpectedStatus } => {
     const status = asString(asRecord(value)['status'], 'status');
     if (status !== expected) throw new TypeError(`Unexpected status: ${status}`);
     return { status: expected };
};
const parseEmpty = (value: unknown): Record<string, never> => {
     if (Object.keys(asRecord(value)).length !== 0) throw new TypeError('Expected an empty object');
     return {};
};
const checkIdentity = (body: Record<string, unknown>): void => {
     const identities = ['username', 'email', 'phone'].filter(key => typeof body[key] === 'string' && body[key] !== '');
     if (identities.length !== 1) throw new TypeError('Provide exactly one username, email, or phone');
};
const bodyOf = (input: unknown): Record<string, unknown> => asRecord(asRecord(input ?? {})['body'], 'body');
const validateRegister = (input: unknown): void => {
     const body = bodyOf(input);
     checkIdentity(body);
     if (!asString(body['password'], 'password')) throw new TypeError('password is required');
};
const validateLogin = (input: unknown): void => {
     const body = bodyOf(input);
     checkIdentity(body);
     if (!asString(body['nonce'], 'nonce')) throw new TypeError('nonce is required');
};
const validateLoginNext = (input: unknown): void => {
     const request = asRecord(input, 'request options');
     asString(asRecord(request['params'], 'params')['id'], 'id');
     const body = bodyOf(input);
     if (!['password', 'totp', 'recovery_code'].includes(asString(body['method'], 'method'))) {
          throw new TypeError('Unsupported login method');
     }
     asString(body['value'], 'value');
};
const validateId = (input: unknown): void => {
     const id = asNumber(asRecord(asRecord(input)['params'], 'params')['id'], 'id');
     if (!Number.isInteger(id) || id <= 0) throw new TypeError('id must be a positive integer');
};
const validateAuditQuery = (input: unknown): void => {
     const query = asRecord(input ?? {})['query'];
     if (query === undefined) return;
     const fields = asRecord(query, 'query');
     const actor = fields['actorPublicId'];
     if (actor !== undefined && (typeof actor !== 'string' || !/^[0-9a-f]{32}$/i.test(actor))) {
          throw new TypeError('actorPublicId must be 32 hexadecimal characters');
     }
     for (const key of ['from', 'to']) {
          const value = fields[key];
          if (value !== undefined && !(value instanceof Date || typeof value === 'string')) throw new TypeError(`${key} must be a date`);
          if (value !== undefined && Number.isNaN(new Date(value as string | Date).getTime())) throw new TypeError(`${key} must be a valid date`);
     }
};

const routes = {
     'system.health.get': {
          method: 'GET',
          path: '/',
          auth: 'none',
          parse: responseValue => ({ ok: asString(asRecord(responseValue)['ok'], 'ok'), path: asString(asRecord(responseValue)['path'], 'path') }),
     },
     'auth.register': {
          method: 'POST',
          path: '/auth/register',
          auth: 'none',
          validate: validateRegister,
          parse: responseValue => ({ refreshToken: asString(asRecord(responseValue)['refreshToken'], 'refreshToken') }),
     },
     'auth.login.start': {
          method: 'POST',
          path: '/auth/login',
          auth: 'none',
          validate: validateLogin,
          parse: responseValue => ({ id: asString(asRecord(responseValue)['id'], 'id'), methods: parseMethods(asRecord(responseValue)['methods']) }),
     },
     'auth.login.continue': {
          method: 'POST',
          path: '/auth/login/next/:id',
          auth: 'none',
          validate: validateLoginNext,
          parse: responseValue => ('methods' in asRecord(responseValue) ? { methods: parseMethods(asRecord(responseValue)['methods']) } : parseTokens(responseValue)),
     },
     'auth.session.me': {
          method: 'GET',
          path: '/auth/me',
          auth: 'session',
          parse: responseValue => {
               const user = asRecord(responseValue);
               return {
                    publicId: asString(user['public_id'], 'public_id'),
                    identities: asArray(user['identities'], 'identities', identityValue => {
                         const identity = asRecord(identityValue);
                         const type = asString(identity['type'], 'identity type');
                         if (!['username', 'email', 'phone'].includes(type)) throw new TypeError(`Unknown identity type: ${type}`);
                         return { type: type as CurrentUser['identities'][number]['type'], value: asString(identity['value'], 'identity value') };
                    }),
               };
          },
     },
     'auth.session.refresh': { method: 'GET', path: '/auth/refresh', auth: 'refresh', parse: parseTokens },
     'auth.session.rotate': {
          method: 'GET',
          path: '/auth/rotate',
          auth: 'refresh',
          parse: responseValue => {
               const tokens = asRecord(responseValue);
               return {
                    sessionToken: asString(tokens['sessionToken'], 'sessionToken'),
                    refreshToken: asString(tokens['refreshToken'], 'refreshToken'),
                    expiresAt: asDate(tokens['expiresAt'], 'expiresAt'),
               };
          },
     },
     'auth.session.logout': { method: 'POST', path: '/auth/logout', auth: 'session', parse: parseEmpty },
     'auth.config.get': {
          method: 'GET',
          path: '/auth/config',
          auth: 'session',
          parse: responseValue => {
               const mfa = asRecord(asRecord(responseValue)['mfa'], 'mfa');
               const policy = asString(mfa['policy'], 'policy');
               if (policy !== 'user' && policy !== 'inherited') throw new TypeError(`Unknown MFA policy: ${policy}`);
               return { mfa: { value: asBoolean(mfa['value'], 'value'), policy } };
          },
     },
     'scheduling.static.list': {
          method: 'GET',
          path: '/scheduler/static',
          auth: 'session',
          parse: responseValue => asArray(responseValue, 'schedule', parseBlock),
     },
     'scheduling.static.getById': {
          method: 'GET',
          path: '/scheduler/static/:id',
          auth: 'session',
          validate: validateId,
          parse: responseValue => (responseValue === null ? null : parseBlock(responseValue)),
     },
     'scheduling.static.create': { method: 'PUT', path: '/scheduler/static/:weekDay', auth: 'session', parse: responseValue => parseStatus(responseValue, 'ok') },
     'scheduling.static.update': {
          method: 'PATCH',
          path: '/scheduler/static/:id',
          auth: 'session',
          validate: validateId,
          parse: responseValue => parseStatus(responseValue, 'Ok'),
     },
     'scheduling.static.delete': {
          method: 'DELETE',
          path: '/scheduler/static/:id',
          auth: 'session',
          validate: validateId,
          parse: responseValue => parseStatus(responseValue, 'Ok'),
     },
     'scheduling.dynamic.list': {
          method: 'GET',
          path: '/scheduler/dynamic',
          auth: 'session',
          parse: responseValue =>
               asArray(responseValue, 'dynamic schedule', item => {
                    const entry = asRecord(item, 'dynamic entry');
                    const status = asRecord(entry['status'], 'status');
                    return {
                         id: asNumber(entry['id'], 'id'),
                         staticScheduleBlock: parseBlock(entry['staticScheduleBlock']),
                         scheduleDate: asDate(entry['scheduleDate'], 'scheduleDate'),
                         status: { id: asNumber(status['id'], 'status id'), code: asString(status['code'], 'status code') },
                         createdAt: asDate(entry['createdAt'], 'createdAt'),
                         updatedAt: asDate(entry['updatedAt'], 'updatedAt'),
                    };
               }),
     },
     'security.permissions.me': {
          method: 'GET',
          path: '/security/@me/permissions',
          auth: 'session',
          parse: responseValue => asArray(responseValue, 'permissions', parsePermission),
     },
     'security.roles.me': {
          method: 'GET',
          path: '/security/@me/roles',
          auth: 'session',
          parse: responseValue => (responseValue === null ? null : asArray(responseValue, 'roles', parseRole)),
     },
     'security.audit.list': { method: 'GET', path: '/security/audit', auth: 'session', validate: validateAuditQuery, parse: parseAuditPage },
} satisfies { [EndpointKey in EndpointName]: EndpointRuntime<EndpointKey> };

export interface ClientCache {
     clear: () => void;
     invalidate: (endpoint?: EndpointName) => number;
}
export interface ApiClient {
     request<EndpointKey extends EndpointName>(endpoint: EndpointKey, ...args: RequestArguments<EndpointKey>): Promise<EndpointResponse<EndpointKey>>;
     cache: ClientCache;
     iterateAuditLog: (query?: Omit<AuditQuery, 'before'>) => AsyncGenerator<AuditLogEntry>;
}
export interface ApiErrorOptions {
     code: 'http' | 'network' | 'aborted' | 'validation' | 'auth';
     status: number | null;
     headers: Headers | null;
     body: unknown;
     endpoint?: EndpointName;
     cause?: unknown;
}

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
const cloneResponseValue = <CloneType>(value: CloneType): CloneType => (typeof structuredClone === 'function' ? structuredClone(value) : value);
const readBody = async (response: Response): Promise<unknown> => {
     if (response.status === 204 || response.headers.get('content-length') === '0') return undefined;
     const text = await response.text();
     if (!text) return undefined;
     try {
          return JSON.parse(text) as unknown;
     } catch {
          return text;
     }
};

export const paginate = async function* <Page, Item, Cursor extends string | number>(
     fetchPage: (cursor: Cursor | undefined) => Promise<Page>,
     getItems: (page: Page) => readonly Item[],
     getNextCursor: (page: Page) => Cursor | null | undefined,
): AsyncGenerator<Item> {
     let cursor: Cursor | undefined;
     const seen = new Set<Cursor>();
     while (true) {
          const page = await fetchPage(cursor);
          for (const item of getItems(page)) yield item;
          const next = getNextCursor(page);
          if (next == null || seen.has(next)) return;
          seen.add(next);
          cursor = next;
     }
};

export const createApiClient = (options: ApiClientOptions): ApiClient => {
     if (!options.baseUrl) throw new TypeError('baseUrl is required');
     const fetcher = options.fetch ?? globalThis.fetch;
     if (typeof fetcher !== 'function') throw new TypeError('A fetch implementation is required');
     const logger = options.logger ?? {
          info: (message: string, context?: Record<string, unknown>) => console.info(message, context ?? ''),
          error: (message: string, context?: Record<string, unknown>) => console.error(message, context ?? ''),
     };
     const cache = new Map<string, { endpoint: EndpointName; expiresAt: number; value: unknown }>();
     const pending = new Map<string, Promise<unknown>>();
     const ttl = Math.max(0, options.cacheTtlMs ?? 0);
     let tokenScope: string | undefined;
     let refreshPromise: Promise<SessionTokens> | undefined;
     const clearCache = () => cache.clear();
     const cacheApi: ClientCache = {
          clear: clearCache,
          invalidate(endpoint) {
               if (endpoint === undefined) {
                    const count = cache.size;
                    cache.clear();
                    return count;
               }
               let count = 0;
               for (const [key, entry] of cache)
                    if (entry.endpoint === endpoint) {
                         cache.delete(key);
                         count++;
                    }
               return count;
          },
     };
     const syncScope = (token: string | undefined) => {
          if (token !== tokenScope) {
               cache.clear();
               tokenScope = token;
          }
     };
     const saveTokens = async (tokens: TokenUpdate) => {
          if (!options.tokens) return;
          await options.tokens.setTokens(tokens);
          syncScope(tokens.refreshToken === undefined ? await options.tokens.getRefreshToken() : tokens.refreshToken);
     };
     const refreshToken = async (endpoint: EndpointName): Promise<string> => {
          const token = await options.tokens?.getRefreshToken();
          syncScope(token);
          if (!token) throw new ApiError('Refresh token required', null, null, undefined, endpoint, 'auth');
          return token;
     };
     const buildUrl = (endpoint: EndpointName, input: unknown): string => {
          const route = routes[endpoint] as EndpointRuntime<EndpointName>;
          const request = asRecord(input ?? {}, 'request options');
          const params = asRecord(request['params'] ?? {}, 'path parameters');
          const path = route.path.replace(/:([A-Za-z0-9_]+)/g, (_matchedRouteSegment, parameterName: string) => {
               const value = params[parameterName];
               if (value === undefined || value === null) throw new TypeError(`Missing path parameter ${parameterName}`);
               return encodeURIComponent(String(value));
          });
          let query: unknown = request['query'];
          if (endpoint === 'security.audit.list' && query !== undefined) {
               const { actorPublicId, ...rest } = asRecord(query, 'query');
               query = actorPublicId === undefined ? rest : { ...rest, actor: actorPublicId };
          }
          const search = new URLSearchParams();
          if (query !== undefined)
               for (const [key, raw] of Object.entries(asRecord(query, 'query'))) {
                    for (const value of Array.isArray(raw) ? raw : [raw]) {
                         if (value == null) continue;
                         search.append(key, value instanceof Date ? value.toISOString() : String(value));
                    }
               }
          const base = options.baseUrl.replace(/\/+$/, '');
          const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
          return search.size === 0 ? url : `${url}${url.includes('?') ? '&' : '?'}${search}`;
     };
     const send = async (
          endpoint: EndpointName,
          url: string,
          method: HttpMethod,
          body: unknown,
          bearer: string | undefined,
          controls: RequestControls,
          retryable: boolean,
     ): Promise<{ body: unknown; status: number; headers: Headers }> => {
          const headers = new Headers(controls.headers);
          headers.set('accept', 'application/json');
          if (body !== undefined) headers.set('content-type', 'application/json');
          if (bearer) headers.set('authorization', `Bearer ${bearer}`);
          const maxAttempts = (controls.retry ?? retryable) ? Math.max(0, options.retryAttempts ?? 2) + 1 : 1;
          for (let attempt = 1; ; attempt++) {
               const context = { endpoint, url, attempt };
               const controller = new AbortController();
               const abort = () => controller.abort(controls.signal?.reason);
               if (controls.signal?.aborted) abort();
               else controls.signal?.addEventListener('abort', abort, { once: true });
               const timer = setTimeout(() => controller.abort(), controls.timeoutMs ?? options.timeoutMs ?? 0);
               if (!(controls.timeoutMs ?? options.timeoutMs)) clearTimeout(timer);
               try {
                    await options.hooks?.onRequest?.(context);
                    const init: RequestInit = { method, headers, signal: controller.signal };
                    if (body !== undefined) init.body = JSON.stringify(body);
                    const response = await fetcher(url, init);
                    const responseBody = await readBody(response);
                    await options.hooks?.onResponse?.({ endpoint, url, status: response.status });
                    if (!response.ok) throw new ApiError(`HTTP ${response.status}`, response.status, response.headers, responseBody, endpoint, 'http');
                    return { body: responseBody, status: response.status, headers: response.headers };
               } catch (error) {
                    const aborted = controller.signal.aborted || controls.signal?.aborted === true;
                    const apiError =
                         error instanceof ApiError
                              ? error
                              : new ApiError(aborted ? 'Request aborted' : 'Network request failed', null, null, undefined, endpoint, aborted ? 'aborted' : 'network', {
                                   cause: error,
                              });
                    try {
                         await options.hooks?.onError?.({ endpoint, url, error: apiError });
                    } catch {
                         /* Keep the original request error. */
                    }
                    const retryStatus = apiError.status !== null && [408, 429, 500, 502, 503, 504].includes(apiError.status);
                    if ((!retryable && controls.retry !== true) || (!retryStatus && apiError.code !== 'network') || attempt >= maxAttempts) throw apiError;
                    await delay(Math.min(150 * 2 ** (attempt - 1), 2_000));
               } finally {
                    clearTimeout(timer);
                    controls.signal?.removeEventListener('abort', abort);
               }
          }
     };
     const parse = <EndpointKey extends EndpointName>(endpoint: EndpointKey, response: { body: unknown; status: number; headers: Headers }): EndpointResponse<EndpointKey> => {
          try {
               return routes[endpoint].parse(response.body) as EndpointResponse<EndpointKey>;
          } catch (cause) {
               throw new ApiError('Response did not match the endpoint contract', response.status, response.headers, response.body, endpoint, 'validation', { cause });
          }
     };
     const performRefresh = async (): Promise<SessionTokens> => {
          const token = await refreshToken('auth.session.refresh');
          logger.info('Refreshing API session', { endpoint: 'auth.session.refresh' });
          try {
               const response = await send('auth.session.refresh', `${options.baseUrl.replace(/\/+$/, '')}/auth/refresh`, 'GET', undefined, token, {}, false);
               const result = parse('auth.session.refresh', response);
               await saveTokens(result);
               logger.info('API session refreshed', { endpoint: 'auth.session.refresh' });
               return result;
          } catch (error) {
               logger.error('API session refresh failed', { endpoint: 'auth.session.refresh', status: error instanceof ApiError ? error.status : null });
               throw error;
          }
     };
     const freshSession = (): Promise<SessionTokens> => {
          if (refreshPromise) return refreshPromise;
          const current = performRefresh();
          refreshPromise = current;
          void current
               .finally(() => {
                    if (refreshPromise === current) refreshPromise = undefined;
               })
               .catch(() => undefined);
          return current;
     };
     const request = async <EndpointKey extends EndpointName>(endpoint: EndpointKey, ...args: RequestArguments<EndpointKey>): Promise<EndpointResponse<EndpointKey>> => {
          const input = args[0] as RequestOptions<EndpointKey> | undefined;
          const controls = (input ?? {}) as RequestControls;
          if (endpoint === 'auth.session.refresh') {
               if (controls.signal?.aborted) throw new ApiError('Request aborted', null, null, undefined, endpoint, 'aborted');
               return (await freshSession()) as EndpointResponse<EndpointKey>;
          }
          const route = routes[endpoint] as EndpointRuntime<EndpointName>;
          route.validate?.(input);
          let bearer: string | undefined;
          if (route.auth === 'session') bearer = (await freshSession()).sessionToken;
          else if (route.auth === 'refresh') bearer = await refreshToken(endpoint);
          if (controls.signal?.aborted) throw new ApiError('Request aborted', null, null, undefined, endpoint, 'aborted');
          const url = buildUrl(endpoint, input);
          const requestInput = asRecord(input ?? {}, 'request options');
          const method = route.method;
          const useCache = method === 'GET' && ttl > 0 && controls.cache !== false;
          const useDedupe = method === 'GET' && controls.signal === undefined && controls.deduplicate !== false;
          const headerKey = Object.entries(controls.headers ?? {})
               .sort(([left], [right]) => left.localeCompare(right))
               .map(([name, value]) => `${name}:${value}`)
               .join('|');
          const key = `${endpoint}|${url}|${headerKey}`;
          if (useCache) {
               const hit = cache.get(key);
               if (hit && hit.expiresAt > Date.now()) return cloneResponseValue(hit.value) as EndpointResponse<EndpointKey>;
               if (hit) cache.delete(key);
          }
          if (useDedupe && pending.has(key)) return cloneResponseValue(await pending.get(key)) as EndpointResponse<EndpointKey>;
          const operation = (async () => {
               const result = await send(endpoint, url, method, requestInput['body'], bearer, controls, method === 'GET' && route.auth !== 'refresh');
               if (method !== 'GET') cache.clear();
               const value = parse(endpoint, result);
               if (useCache) cache.set(key, { endpoint, expiresAt: Date.now() + ttl, value: cloneResponseValue(value) });
               return value;
          })();
          if (useDedupe) pending.set(key, operation);
          try {
               const result = await operation;
               const value = result as unknown;
               if (endpoint === 'auth.register' && options.tokens) await saveTokens({ refreshToken: asString(asRecord(value)['refreshToken'], 'refreshToken') });
               else if (endpoint === 'auth.login.continue' && 'sessionToken' in asRecord(value)) await saveTokens(value as SessionTokens);
               else if (endpoint === 'auth.session.rotate') {
                    const tokens = asRecord(value);
                    await saveTokens({ sessionToken: asString(tokens['sessionToken'], 'sessionToken'), refreshToken: asString(tokens['refreshToken'], 'refreshToken') });
               } else if (endpoint === 'auth.session.logout') {
                    await saveTokens({ sessionToken: undefined, refreshToken: undefined });
                    syncScope(undefined);
               }
               return cloneResponseValue(result);
          } finally {
               if (useDedupe && pending.get(key) === operation) pending.delete(key);
          }
     };
     return {
          request,
          cache: cacheApi,
          iterateAuditLog: query =>
               paginate<AuditPage, AuditLogEntry, number>(
                    cursor => request('security.audit.list', { query: { ...query, ...(cursor === undefined ? {} : { before: cursor }) } }),
                    page => page.entries,
                    page => page.nextCursor,
               ),
     };
};
