import { User } from './token.interface';

export interface LoginWithGoogle {
    access_token: string;
    user: User;
    __typename: string;
}
