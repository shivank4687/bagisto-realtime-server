export type UserType = 'customer' | 'supplier';

export interface User {
    id: number;
    name: string;
    email: string;
    type: UserType;
}
