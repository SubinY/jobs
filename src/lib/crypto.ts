import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionId() {
  return randomUUID();
}

export function createInviteCode() {
  return randomBytes(16).toString("hex");
}

export function createId() {
  return randomUUID();
}
