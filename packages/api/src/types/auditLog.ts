export type AuditActionCode =
     | 'auth.register'
     | 'auth.login.start'
     | 'auth.login.success'
     | 'auth.login.failure'
     | 'auth.login.mfa_required'
     | 'auth.logout'
     | 'auth.refresh_token_reuse'
     | 'permission.denied'
     | 'role.assign'
     | 'role.revoke'
     | 'role.permission.grant'
     | 'role.permission.revoke'
     | 'schedule.static.create'
     | 'schedule.static.update'
     | 'schedule.static.delete';

export type AuditActorCode = 'user' | 'system' | 'admin';

export type AuditContext = {
     ip?: string | undefined;
     userAgent?: string | undefined;
};

export interface AuditEntryInput {
     action: AuditActionCode;
     actorType?: AuditActorCode | undefined;
     actorUserId?: number | null | undefined;
     targetType?: string | undefined;
     targetId?: string | number | undefined;
     success?: boolean | undefined;
     oldValue?: unknown;
     newValue?: unknown;
     ip?: string | undefined;
     userAgent?: string | undefined;
}

export type AuditLogEntry = {
     id: number;
     action: string;
     actorType: string;
     actorUserPublicId: string | null;
     targetType: string | null;
     targetId: string | null;
     success: boolean;
     oldValue: unknown;
     newValue: unknown;
     ip: string | null;
     userAgent: string | null;
     createdAt: Date;
};

export interface AuditLogFilters {
     actorPublicId?: string | undefined;
     action?: string | undefined;
     targetType?: string | undefined;
     targetId?: string | undefined;
     success?: boolean | undefined;
     from?: Date | undefined;
     to?: Date | undefined;
     before?: number | undefined;
     limit?: number | undefined;
}
