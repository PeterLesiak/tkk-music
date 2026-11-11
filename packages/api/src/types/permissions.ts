import type { MakePath } from "./common.js";

export type Role = {
     id: number;
     code: string;
     displayName: string;
     description?: string | undefined;
     isSystemRole: boolean;
     createdAt: Date;
};

export type PermissionCategory = {
     id: number;
     name: string;
};

export interface PermissionSchema {
     music: {
          artists: 'manage';
          audio_files: 'manage';
          songs: 'create' | 'delete' | 'edit' | 'view';
     };
     permissions: {
          roles: 'manage';
     };
     queue: 'view' | 'manage';
     scheduling: {
          static: 'view' | 'manage';
          dynamic: 'view' | 'manage';
     };
     system: {
          audit_log: 'view';
     };
     users: 'manage' | 'view';
}

export type PermissionCode = MakePath<PermissionSchema>;
export type Permission = {
     id: number;
     name: PermissionCode;
     category: PermissionCategory;
};
