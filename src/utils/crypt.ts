import { JSEncrypt } from "jsencrypt";
import * as CryptoJS from "crypto-js";
import { isEmpty } from "@pureadmin/utils";

// 密钥对生成 http://web.chacuo.net/netrsakeypair
const publicKey =
  "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDbHFkI/QelMt1cGC1XxPDITFdRzAxGcf8l8Xw92JoBdmjhcsAazTpFgbElWrrj/BaIp/++Wd+cj2nN9ArLl5EDzBKHWpbhT8SMgLwC7FrjUz6KeKqErtq6aVCvMPG7jiZWdZWbv0IiPjbMohIZnUaKS36HixkzK7JCCyjfXLBKcwIDAQAB";

// 加密
export function rsaEncrypt(txt): string {
  const encryptor = new JSEncrypt();
  // 设置公钥
  encryptor.setPublicKey(publicKey);
  // 对数据进行加密
  const encryptedValue = encryptor.encrypt(txt);

  // Check if the encrypted value is a boolean
  if (typeof encryptedValue === "boolean") {
    throw new Error("Encryption failed: Encrypted value returned a boolean");
  }

  return encryptedValue;
}

const aesKey = "admin654321";

export function aesEncrypt(txt): string {
  if (isEmpty(txt)) {
    return null;
  }
  const message = CryptoJS.enc.Utf8.parse(txt);
  const secretPassphrase = CryptoJS.enc.Utf8.parse(aesKey);
  const iv = CryptoJS.enc.Utf8.parse(aesKey);

  const encrypted = CryptoJS.AES.encrypt(message, secretPassphrase, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    iv
  }).toString();
  return encrypted;
}

export function aesDecrypt(txtEncrypt): string {
  const secretPassphrase = CryptoJS.enc.Utf8.parse(aesKey);
  const iv = CryptoJS.enc.Utf8.parse(aesKey);
  const decrypted = CryptoJS.AES.decrypt(txtEncrypt, secretPassphrase, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    iv
  }).toString(CryptoJS.enc.Utf8);
  return decrypted;
}
