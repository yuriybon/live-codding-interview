export interface UserProfile {
    id: string;
    email: string;
    name: string;
    picture: string;
}

export interface AuthTokenPayload {
    sub: string;
    email: string;
    name: string;
    picture: string;
}
