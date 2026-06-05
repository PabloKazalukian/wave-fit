export interface Token {
    access_token: string;
    userId: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar: {
        url: string;
    } | null;
    role: string;
}
