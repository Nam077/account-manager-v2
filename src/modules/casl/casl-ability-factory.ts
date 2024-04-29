import { AbilityBuilder, createMongoAbility, ExtractSubjectType, InferSubjects, MongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { ActionCasl } from '../../common/enum/action-casl.enum';
import { UserRole } from '../../common/enum/user-role.enum';
import { Account } from '../account/entities/account.entity';
import { AccountCategory } from '../account-category/entities/account-category.entity';
import { AccountPrice } from '../account-price/entities/account-price.entity';
import { AdminAccount } from '../admin-account/entities/admin-account.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Email } from '../email/entities/email.entity';
import { Rental } from '../rental/entities/rental.entity';
import { RentalRenew } from '../rental-renew/entities/rental-renew.entity';
import { RentalType } from '../rental-type/entities/rental-type.entity';
import { User } from '../user/entities/user.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { WorkspaceEmail } from '../workspace-email/entities/workspace-email.entity';

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
    | typeof RentalRenew
    | 'all'
>;
type AppAbility = MongoAbility<[ActionCasl, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
    createForUser(user: User) {
        const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
        if (user.role === UserRole.SUPER_ADMIN) {
            can(ActionCasl.Manage, 'all');
            cannot(ActionCasl.Delete, User, { role: UserRole.SUPER_ADMIN });
            can(ActionCasl.Update, User, { id: user.id });
            cannot(ActionCasl.Update, User, {
                role: UserRole.SUPER_ADMIN,
                id: { $ne: user.id },
            });
        }
        if (user.role === UserRole.ADMIN) {
            can(ActionCasl.Manage, 'all');
            cannot(ActionCasl.Manage, User, { role: UserRole.SUPER_ADMIN });
            cannot(ActionCasl.Update, User, { role: UserRole.SUPER_ADMIN });
            cannot(ActionCasl.AddAdmin, User, { role: UserRole.ADMIN });
            cannot(ActionCasl.Delete, User, { role: UserRole.SUPER_ADMIN });
            cannot(ActionCasl.Delete, User, { role: UserRole.ADMIN });
        }
        if (user.role === UserRole.USER) {
            can(ActionCasl.Update, User, { id: user.id });
            cannot(ActionCasl.Manage, User);
            cannot(ActionCasl.ReadAll, User);
            /// Account Category
            cannot(ActionCasl.Manage, AccountCategory);
            can(ActionCasl.ReadAll, AccountCategory);
            can(ActionCasl.Read, AccountCategory);
            /// Account
            cannot(ActionCasl.Manage, Account);
            can(ActionCasl.ReadAll, Account);
            can(ActionCasl.Read, Account);
        }
        return build({
            detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
        });
    }
}
