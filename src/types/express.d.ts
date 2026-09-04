import "passport";

declare global {
    namespace Express {

        interface User {
            id: number;
            name: string;
            email: string;
            password: string | null;
            googleId: string | null;
            userId?: number;
        }

        interface Request {
            auth?: {
                userId: number;
            };
        }
    }
}

export {};