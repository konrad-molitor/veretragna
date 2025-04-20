import { Request } from 'express';
import { User } from '../../users/user.entity';

export interface ExpressRequest extends Request {
    user?: User;
}
