import {
    AdminCreateUserCommand,
    AdminGetUserCommand,
    AdminGetUserCommandOutput,
    AdminGetUserResponse,
    AdminInitiateAuthCommand,
    CognitoIdentityProviderClient,
    RespondToAuthChallengeCommand
} from "@aws-sdk/client-cognito-identity-provider";

export enum AuthLevel {
    Admin = "admin",
    Doctor = "doctor",
    Patient = "patient",
    None = "none"
}

const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

const UserPoolId = "us-east-1_YFUDT531G";
const ClientId = "2qqqu5pvm3akms681eaqq5frdu";

export namespace Auth {

    export function getAuthLevel(user: AdminGetUserResponse): AuthLevel {
        if (user.UserAttributes) {
            const authLevel = user.UserAttributes.find((attr) => attr.Name === "custom:authlevel");
            if (authLevel) {
                return authLevel.Value as AuthLevel;
            }
        }
        return AuthLevel.None;
    }

    function respondToNewPasswordChallenge(email: string, password: string, session: string) {
        const command = new RespondToAuthChallengeCommand({
            ClientId,
            ChallengeName: "NEW_PASSWORD_REQUIRED",
            ChallengeResponses: {
                USERNAME: email,
                NEW_PASSWORD: password
            },
            Session: session
        });
        return client.send(command);
    }

    export function getUserData(email: string): Promise<AdminGetUserCommandOutput> {
        const command = new AdminGetUserCommand({
            UserPoolId,
            Username: email
        });
        return client.send(command);
    }

    export function handleAuthRequest(email: string, password: string) {
        const command = new AdminInitiateAuthCommand({
            UserPoolId,
            ClientId,
            AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        });

        return client.send(command).then((res) => {
            // if the user needs to change their password add a 1 at the end lol
            if (res.ChallengeName === "NEW_PASSWORD_REQUIRED" && res.Session) {
                return respondToNewPasswordChallenge(email, password, res.Session).then((res) => {
                    return getUserData(email);
                });
            }
            else {
                return getUserData(email);
            }
        });
    }

    export function createUser(email: string, password: string) {
        const command = new AdminCreateUserCommand({
            UserPoolId,
            Username: email,
            TemporaryPassword: password,
            MessageAction: "SUPPRESS",
            DesiredDeliveryMediums: ["EMAIL"],
            UserAttributes: [
                {
                    Name: "email",
                    Value: email
                }
            ],

        });

        return client.send(command);
    }

}