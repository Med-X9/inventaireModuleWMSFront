export interface Session {
    id: number;
    username: string;
}

export interface SessionResponse {
    status: string;
    message: string;
    data: Session[];
}
