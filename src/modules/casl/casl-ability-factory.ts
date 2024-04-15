import { createMongoAbility, AbilityBuilder, MongoAbility, InferSubjects, ExtractSubjectType } from '@casl/ability';
import { User, UserRole } from '../user/entities/user.entity';
import { Injectable } from '@nestjs/common';
export enum Action {
    Manage = 'manage',
    Create = 'create',
    Read = 'read',
    Update = 'update',
    Delete = 'delete',
    HardDelete = 'hardDelete',
    Restore = 'restore',
    AddAdmin = 'addAdmin',
}

export type Subjects = InferSubjects<typeof User | 'all'>;
type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
    createForUser(user: User) {
        const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
        if (user.role === UserRole.SUPER_ADMIN) {
            can(Action.Manage, 'all');
        }
        if (user.role === UserRole.ADMIN) {
            can(Action.Manage, 'all');
            cannot(Action.Manage, User, { role: UserRole.SUPER_ADMIN });
            cannot(Action.AddAdmin, User, { role: UserRole.SUPER_ADMIN });
            cannot(Action.AddAdmin, User, { role: UserRole.ADMIN });
        }
        if (user.role === UserRole.USER) {
            can(Action.Read, User, { id: user.id });
            can(Action.Update, User, { id: user.id });
            cannot(Action.Manage, User);
        }
        return build({
            detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
        });
    }
}
