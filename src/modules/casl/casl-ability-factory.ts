import { AbilityBuilder, createMongoAbility, ExtractSubjectType, InferSubjects, MongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { Account } from '../account/entities/account.entity';
import { AccountCategory } from '../account-category/entities/account-category.entity';
import { AccountPrice } from '../account-price/entities/account-price.entity';
import { AdminAccount } from '../admin-account/entities/admin-account.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Email } from '../email/entities/email.entity';
import { Rental } from '../rental/entities/rental.entity';
import { RentalType } from '../rental-type/entities/rental-type.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { WorkspaceEmail } from '../workspace-email/entities/workspace-email.entity';
export enum Action {
    ReadAll = 'readAll',
    Manage = 'manage',
    Create = 'create',
    Read = 'read',
    Update = 'update',
    Delete = 'delete',
    HardDelete = 'hardDelete',
    Restore = 'restore',
    AddAdmin = 'addAdmin',
}

export type Subjects = InferSubjects<
    | typeof User
    | typeof AccountCategory
    | typeof Account
    | typeof AdminAccount
    | typeof Customer
    | typeof Email
    | typeof Workspace
    | typeof RentalType
    | typeof AccountPrice
    | typeof WorkspaceEmail
    | typeof Rental
    | 'all'
>;
type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
    createForUser(user: User) {
        const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
        if (user.role === UserRole.SUPER_ADMIN) {
            can(Action.Manage, 'all');
            cannot(Action.Delete, User, { role: UserRole.SUPER_ADMIN });
            can(Action.Update, User, { id: user.id });
            cannot(Action.Update, User, { role: UserRole.SUPER_ADMIN, id: { $ne: user.id } });
        }
        if (user.role === UserRole.ADMIN) {
            can(Action.Manage, 'all');
            cannot(Action.Manage, User, { role: UserRole.SUPER_ADMIN });
            cannot(Action.Update, User, { role: UserRole.SUPER_ADMIN });
            cannot(Action.AddAdmin, User, { role: UserRole.ADMIN });
            cannot(Action.Delete, User, { role: UserRole.SUPER_ADMIN });
            cannot(Action.Delete, User, { role: UserRole.ADMIN });
        }
        if (user.role === UserRole.USER) {
            can(Action.Update, User, { id: user.id });
            cannot(Action.Manage, User);
            cannot(Action.ReadAll, User);
            /// Account Category
            cannot(Action.Manage, AccountCategory);
            can(Action.ReadAll, AccountCategory);
            can(Action.Read, AccountCategory);
            /// Account
            cannot(Action.Manage, Account);
            can(Action.ReadAll, Account);
            can(Action.Read, Account);
        }
        return build({
            detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
        });
    }
}
