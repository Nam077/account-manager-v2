import * as bcrypt from 'bcrypt';
import { from, Observable } from 'rxjs';

const saltRounds = 10;

class BcryptService {
    private static instance: BcryptService;

    private constructor() {}

    public static getInstance(): BcryptService {
        if (!BcryptService.instance) {
            BcryptService.instance = new BcryptService();
        }

        return BcryptService.instance;
    }

    hash(password: string): Observable<string> {
        return from(bcrypt.hash(password, saltRounds));
    }

    compare(password: string, hash: string): Observable<boolean> {
        return from(bcrypt.compare(password, hash));
    }
}

export const BcryptServiceInstance = BcryptService.getInstance();
