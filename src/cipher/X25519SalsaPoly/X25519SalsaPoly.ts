import nacl from "tweetnacl";
import util from "tweetnacl-util";
import { parseJSON } from "../../common";
import { CipherAbstract, CipherType, DecryptedData, EncryptedData, EncryptionKeyPair, EncryptionPublicKey, EncryptionSecret, EncryptionSecretKey, EncryptionSharedKey } from "../types";
import { CipherErrorFactory } from "../errorFactory";
import { ErrorInterface } from "../../common/errors";

const errors = new CipherErrorFactory(CipherType.X25519_SALSA_POLY);

export class X25519SalsaPoly extends CipherAbstract {
  private _publicKey: EncryptionPublicKey;
  private _secretKey: EncryptionSecretKey;

  constructor() {
    super();
    this.getPublicKey = this.getPublicKey.bind(this);
    this.getSecretKey = this.getSecretKey.bind(this);
    this.getKeyPair = this.getKeyPair.bind(this);
    this.setKeyPair = this.setKeyPair.bind(this);
    this.generateKeyPair = this.generateKeyPair.bind(this);
    this.generateSharedKey = this.generateSharedKey.bind(this);
    this.encrypt = this.encrypt.bind(this);
    this.decrypt = this.decrypt.bind(this);
  }

  public getPublicKey(): ReturnType<CipherAbstract['getPublicKey']> {
    if (!this._publicKey) return errors.InvalidPublicKey() as ErrorInterface;
    return this._publicKey as EncryptionPublicKey;
  }

  public getSecretKey(): ReturnType<CipherAbstract['getSecretKey']> {
    if (!this._secretKey) return errors.InvalidSecretKey() as ErrorInterface;
    return this._secretKey as EncryptionSecretKey;
  }

  public getKeyPair(): ReturnType<CipherAbstract['getKeyPair']> {
    if (!this._publicKey || !this._secretKey) return errors.InvalidKeyPair() as ErrorInterface;
    return { publicKey: this._publicKey, secretKey: this._secretKey } as EncryptionKeyPair;
  }

  public async generateKeyPair(secret?: EncryptionSecret): ReturnType<CipherAbstract['generateKeyPair']> {
    try {
      const keyPair = secret ? nacl.box.keyPair.fromSecretKey(util.decodeBase64(secret)) : nacl.box.keyPair();
      const publicKey = util.encodeBase64(keyPair.publicKey);
      const secretKey = util.encodeBase64(keyPair.secretKey);
      if (!publicKey || !secretKey) throw new Error('keyPair');
      return { publicKey, secretKey } as EncryptionKeyPair;
    } catch (error) {
      return errors.KeyPairFailure(error.message) as ErrorInterface;
    }
  }

  public async setKeyPair(keyPair: EncryptionKeyPair): ReturnType<CipherAbstract['setKeyPair']> {
    if (!keyPair?.publicKey || !keyPair?.secretKey) return errors.InvalidKeyPair() as ErrorInterface;
    this._publicKey = keyPair.publicKey;
    this._secretKey = keyPair.secretKey;
  }

  public async generateSharedKey(publicKey: EncryptionPublicKey): ReturnType<CipherAbstract['generateSharedKey']> {
    try {
      const baseEncryptionPublicKey = util.decodeBase64(publicKey);
      const baseEncryptionSecretKey = util.decodeBase64(this._secretKey);
      const uintSharedKey = nacl.box.before(baseEncryptionPublicKey, baseEncryptionSecretKey);
      const baseSharedKey = util.encodeBase64(uintSharedKey);
      if (!baseSharedKey) throw new Error();
      return baseSharedKey as EncryptionSharedKey;
    } catch (error) {
      return errors.SharedKeyFailure(error.message) as ErrorInterface;
    }
  }

  public async encrypt({ data, publicKey, sharedKey }: { data: DecryptedData, publicKey?: EncryptionPublicKey, sharedKey?: EncryptionSharedKey }): ReturnType<CipherAbstract['encrypt']> {
    try {
      let box;
      const utfData = typeof data === 'string' ? data : JSON.stringify(data);
      const uintData = util.decodeUTF8(utfData);
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      
      switch (true) {
        case publicKey !== undefined:
          const publicKeyUint = util.decodeBase64(publicKey);
          box = nacl.box(uintData, nonce, publicKeyUint, util.decodeBase64(this._secretKey));
          break;
        case sharedKey !== undefined:
          const sharedKeyUint = util.decodeBase64(sharedKey);
          box = nacl.box.after(uintData, nonce, sharedKeyUint);
          break;
        default:
          const secreKeyUint = util.decodeBase64(this._secretKey);
          box = nacl.secretbox(uintData, nonce, secreKeyUint);
          break;
      }

      const encrypted = new Uint8Array(nonce.length + box.length);
      encrypted.set(nonce);
      encrypted.set(box, nonce.length);
      const ciphertext = util.encodeBase64(encrypted);
      if (!ciphertext) throw new Error();
      return ciphertext as EncryptedData;
    } catch (error) {
      return errors.EncryptionFailure(error.message) as ErrorInterface;
    }
  }

  public async decrypt({ data, publicKey, sharedKey }: { data: EncryptedData, publicKey?: EncryptionPublicKey, sharedKey?: EncryptionSharedKey }): ReturnType<CipherAbstract['decrypt']> {
    try {
      const uintDataAndNonce = util.decodeBase64(data);
      const nonce = uintDataAndNonce.slice(0, nacl.secretbox.nonceLength);
      const uintData = uintDataAndNonce.slice(nacl.secretbox.nonceLength, uintDataAndNonce.length);
  
      let decrypted;
      switch (true) {
        case publicKey !== undefined:
          const publicKeyUint = util.decodeBase64(publicKey);
          decrypted = nacl.box.open(uintData, nonce, publicKeyUint, util.decodeBase64(this._secretKey));
          break;
        case sharedKey !== undefined:
          const sharedKeyUint = util.decodeBase64(sharedKey);
          decrypted = nacl.box.open.after(uintData, nonce, sharedKeyUint);
          break;
        default:
          const secreKeyUint = util.decodeBase64(this._secretKey);
          decrypted = nacl.secretbox.open(uintData, nonce, secreKeyUint);
          break;
      }
  
      const utf8Result = util.encodeUTF8(decrypted);
      const parsed = parseJSON(utf8Result) || utf8Result;
      if (!parsed) throw new Error();
      return parsed as DecryptedData;
    } catch(error) {
      return errors.DecryptionFailure(error.message) as ErrorInterface;
    }
  }
}