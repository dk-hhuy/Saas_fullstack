import { INVITE_CODE_CHARS, INVITE_CODE_LENGTH } from "@/constants/classroom";

export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    const index = Math.floor(Math.random() * INVITE_CODE_CHARS.length);
    code += INVITE_CODE_CHARS[index];
  }
  return code;
}
