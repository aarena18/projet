import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import "dotenv/config";

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!,
});

const POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

export async function signUp(email: string, password: string, name: string) {
  await client.send(
    new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
      ],
    }),
  );
}

export async function signIn(email: string, password: string) {
  const res = await client.send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    }),
  );
  return res.AuthenticationResult;
}

export async function getUserBySub(sub: string) {
  const res = await client.send(
    new AdminGetUserCommand({
      UserPoolId: POOL_ID,
      Username: sub,
    }),
  );
  const attrs: Record<string, string> = {};
  res.UserAttributes?.forEach((a) => {
    attrs[a.Name!] = a.Value!;
  });
  return { sub, email: attrs["email"], name: attrs["name"] };
}

export async function getUserByEmail(email: string) {
  const res = await client.send(
    new ListUsersCommand({
      UserPoolId: POOL_ID,
      Filter: `email = "${email}"`,
    }),
  );
  const user = res.Users?.[0];
  if (!user) return null;
  const attrs: Record<string, string> = {};
  user.Attributes?.forEach((a) => {
    attrs[a.Name!] = a.Value!;
  });
  return { sub: user.Username!, email: attrs["email"], name: attrs["name"] };
}

export async function updateUserBySub(sub: string, data: { name?: string }) {
  const attributes = Object.entries(data)
    .filter(([_, v]) => v !== undefined)
    .map(([Name, Value]) => ({ Name, Value: Value as string }));
  await client.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: POOL_ID,
      Username: sub,
      UserAttributes: attributes,
    }),
  );
}
