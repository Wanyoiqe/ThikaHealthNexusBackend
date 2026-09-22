import crypto from "crypto";

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateBackupCodes = (count = 10) => {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString("hex")
  );
};