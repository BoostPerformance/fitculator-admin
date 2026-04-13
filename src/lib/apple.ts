import jwt from 'jsonwebtoken';

export function generateAppleClientSecret(): string {
 const privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');

 return jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: process.env.APPLE_TEAM_ID!,
  subject: process.env.APPLE_SERVICE_ID!,
  header: {
   alg: 'ES256',
   kid: process.env.APPLE_KEY_ID!,
  },
 });
}
