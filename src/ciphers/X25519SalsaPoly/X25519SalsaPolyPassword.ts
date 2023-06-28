import util from "tweetnacl-util";
import { CipherCore } from "../CipherCore";
import { DecryptedData, EncryptedData, EncryptionKeyPair } from "../types";
import { X25519SalsaPoly } from "./X25519SalsaPoly";
import nacl from "tweetnacl";
import * as scrypt from "scrypt-pbkdf";
import { CipherErrors } from "../../errors/cipher";

export class X25519SalsaPolyPassword extends CipherCore {
  private X25519SalsaPoly: X25519SalsaPoly;
  constructor() {
    super();
    this.X25519SalsaPoly = new X25519SalsaPoly();
  }

  public async generateKeyPair({ password, salt: nonce }: { password: string, salt?: string }): Promise<EncryptionKeyPair> {
    try {
      const options = { N: 16384, r: 8, p: 1 };
      const salt = nonce || util.encodeBase64(nacl.randomBytes(16));
      const len = nacl.box.secretKeyLength / 2;
      const buffer = await scrypt.scrypt(password, salt, len, options);

      const seed = [...new Uint8Array(buffer)]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('');

      const uint8Seed = util.decodeUTF8(seed);
      const keyPair = nacl.box.keyPair.fromSecretKey(uint8Seed);
      const secretKey = util.encodeBase64(keyPair.secretKey);
      return { publicKey: util.encodeBase64(keyPair.publicKey), secretKey } as EncryptionKeyPair;
    } catch (error) {
      return Promise.reject(CipherErrors.GenerateEncryptionKeyPairError(error));
    }
  }

  public getPublicKey(): EncryptionKeyPair['publicKey'] {
    return this.X25519SalsaPoly.getPublicKey();
  }

  public getSecretKey(): EncryptionKeyPair['secretKey'] {
    return this.X25519SalsaPoly.getSecretKey();
  }

  public getKeyPair(): EncryptionKeyPair {
    return this.X25519SalsaPoly.getKeyPair();
  }

  public setKeyPair({ keyPair }: { keyPair: EncryptionKeyPair }): void {
    this.X25519SalsaPoly.setKeyPair({ keyPair });
  }

  public async decrypt(params: Parameters<X25519SalsaPoly['decrypt']>[0]): Promise<DecryptedData> {
    return this.X25519SalsaPoly.decrypt(params);
  }

  public async encrypt(params: Parameters<X25519SalsaPoly['encrypt']>[0]): Promise<EncryptedData> {
    return this.X25519SalsaPoly.encrypt(params);
  }

  public async generateSharedKey(params: Parameters<X25519SalsaPoly['generateSharedKey']>[0]): Promise<string> {
    return this.X25519SalsaPoly.generateSharedKey(params);
  }
}