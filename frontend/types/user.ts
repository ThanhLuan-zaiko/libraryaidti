export interface Role {
    id: string;
    name: string;
    description: string;
}

export interface User {
    id: string;
    email: string;
    username?: string;
    full_name: string;
    roles: Role[];
    avatar_url?: string;
}
