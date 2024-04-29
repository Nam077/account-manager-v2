/* DO NOT EDIT, file generated by nestjs-i18n */

/* eslint-disable */
/* prettier-ignore */
import { Path } from "nestjs-i18n";
/* prettier-ignore */
export type I18nTranslations = {
    "main": {
        "greeting": string;
        "farewell": string;
        "questionName": {
            "question": string;
            "reprompt": string;
        };
    };
    "message": {
        "AccountCategory": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "NotDeleted": string;
            "NotRestored": string;
        };
        "Account": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "Activated": string;
            "Deactivated": string;
            "NotDeleted": string;
            "NotRestored": string;
        };
        "AdminAccount": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "NotDeleted": string;
            "NotRestored": string;
        };
        "Customer": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "Activated": string;
            "Deactivated": string;
            "NotDeleted": string;
            "NotRestored": string;
        };
        "Email": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "NotDeleted": string;
            "NotRestored": string;
            "NotBelongToCustomer": string;
        };
        "Workspace": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Full": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "NotDeleted": string;
            "NotRestored": string;
            "NotBelongToAccount": string;
        };
        "RentalType": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "NotDeleted": string;
            "NotRestored": string;
        };
        "AccountPrice": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "NotDeleted": string;
            "NotRestored": string;
        };
        "WorkspaceEmail": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "NotDeleted": string;
            "NotRestored": string;
        };
        "Rental": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "NotDeleted": string;
            "NotRestored": string;
        };
        "RefreshToken": {
            "NotFound": string;
            "Found": string;
            "Invalid": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "NotDeleted": string;
            "NotRestored": string;
        };
        "User": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "Activated": string;
            "Deactivated": string;
            "NotDeleted": string;
            "NotRestored": string;
        };
        "RentalRenew": {
            "NotFound": string;
            "Found": string;
            "Conflict": string;
            "Created": string;
            "Updated": string;
            "Restored": string;
            "Deleted": string;
            "NotDeleted": string;
            "NotRestored": string;
            "DateInvalid": string;
        };
        "Authentication": {
            "Unauthorized": string;
            "Forbidden": string;
            "InvalidToken": string;
            "TokenExpired": string;
        };
        "Validation": {
            "BadRequest": string;
        };
        "Resource": {
            "NotFound": string;
            "Conflict": string;
        };
        "Server": {
            "InternalError": string;
        };
        "Login": {
            "Failed": string;
            "LockedOut": string;
            "Inactive": string;
            "Success": string;
        };
        "Register": {
            "Failed": string;
            "Success": string;
        };
    };
    "validation": {
        "createAccount": {
            "name": {
                "required": string;
                "isString": string;
                "lengthAccept": string;
            };
            "description": {
                "required": string;
                "isString": string;
            };
            "accountCategoryId": {
                "required": string;
                "isUUID": string;
            };
        };
        "createAccountCategory": {
            "name": {
                "required": string;
                "isString": string;
                "lengthAccept": string;
            };
            "description": {
                "required": string;
                "isString": string;
                "lengthAccept": string;
            };
        };
        "createAccountPrice": {
            "price": {
                "required": string;
                "isNumber": string;
                "min": string;
            };
            "accountId": {
                "required": string;
                "isUUID": string;
            };
            "rentalTypeId": {
                "required": string;
                "isUUID": string;
            };
        };
        "createAdminAccount": {
            "email": {
                "required": string;
                "isEmail": string;
            };
            "value": {
                "required": string;
                "isString": string;
            };
            "accountId": {
                "required": string;
                "isUUID": string;
            };
        };
        "login": {
            "email": {
                "required": string;
                "isEmail": string;
            };
            "password": {
                "required": string;
                "isString": string;
                "minLength": string;
            };
        };
        "register": {
            "email": {
                "required": string;
                "isEmail": string;
            };
            "password": {
                "required": string;
                "isString": string;
                "minLength": string;
            };
            "name": {
                "required": string;
                "isString": string;
            };
        };
        "createCustomer": {
            "name": {
                "required": string;
                "isString": string;
            };
            "email": {
                "required": string;
                "isEmail": string;
            };
            "phone": {
                "required": string;
                "isString": string;
            };
            "address": {
                "isString": string;
            };
            "company": {
                "isString": string;
            };
            "description": {
                "isString": string;
            };
        };
        "createEmail": {
            "email": {
                "required": string;
                "isEmail": string;
            };
            "customerId": {
                "required": string;
                "isUUID": string;
            };
        };
        "createRental": {
            "customerId": {
                "isUUID": string;
            };
            "accountPriceId": {
                "isUUID": string;
            };
            "workspaceId": {
                "isUUID": string;
            };
            "emailId": {
                "isUUID": string;
            };
            "startDate": {
                "isDate": string;
                "isEarlierThanDate": string;
            };
            "endDate": {
                "isDate": string;
            };
            "status": {
                "isEnum": string;
            };
            "note": {
                "isString": string;
            };
            "totalPrice": {
                "isNumber": string;
            };
            "paymentAmount": {
                "isNumber": string;
            };
            "warrantyFee": {
                "isNumber": string;
            };
            "discount": {
                "isNumber": string;
            };
            "paymentMethod": {
                "isString": string;
                "lengthAccept": string;
            };
        };
        "createRentalType": {
            "name": {
                "isNotEmpty": string;
                "isString": string;
            };
            "description": {
                "isString": string;
            };
            "maxSlots": {
                "isInt": string;
                "min": string;
            };
        };
        "createUser": {
            "name": {
                "isString": string;
            };
            "email": {
                "isEmail": string;
            };
            "password": {
                "isString": string;
                "lengthAccept": string;
                "regex": string;
            };
            "role": {
                "isEnum": string;
            };
        };
        "createWorkspace": {
            "description": {
                "isNotEmpty": string;
                "isString": string;
            };
            "maxSlots": {
                "isNotEmpty": string;
                "isInt": string;
                "min": string;
            };
            "adminAccountId": {
                "isNotEmpty": string;
                "isUUID": string;
            };
        };
        "createWorkspaceEmail": {
            "workspaceId": {
                "isNotEmpty": string;
                "isUUID": string;
            };
            "emailId": {
                "isNotEmpty": string;
                "isUUID": string;
            };
        };
        "Login": {
            "Failed": string;
            "LockedOut": string;
            "Inactive": string;
        };
    };
};
/* prettier-ignore */
export type I18nPath = Path<I18nTranslations>;
