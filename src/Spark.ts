import { Constructable, KeyPairs, PublicKeys, SecretKeys, SparkParams } from "./types";
import { AgentAbstract } from "./agent/types";
import { EncryptionKeyPair } from "./cipher/types";
import { HashDigest } from "./hasher/types";
import { SigningKeyPair } from "./signer/types";
import { SparkInterface } from "./types";
import { CipherCore } from "./cipher/CipherCore";
import { HasherCore } from "./hasher/HasherCore";
import { SignerCore } from "./signer/SignerCore";
import { ControllerCore } from "./controller";

export class Spark<
  A extends AgentAbstract[],
  X extends CipherCore,
  C extends ControllerCore,
  H extends HasherCore,
  S extends SignerCore
> implements SparkInterface<A, X, C, H, S> {

  public readonly cipher: X;
  public readonly controller: C;
  public readonly hasher: H;
  public readonly signer: S;
  public readonly agents: { [key: string]: InstanceType<Constructable<A[number]>> } = {};

  constructor({
    agents = [],
    cipher,
    controller,
    hasher,
    signer
  }: SparkParams<A, X, C, H, S>) {

    this.cipher = new cipher();
    this.hasher = new hasher();
    this.signer = new signer();
    this.controller = new controller(this);

    agents.forEach((agent: Constructable<A[number]>) => {
      const mixin = new agent();
      const name = agent.name.charAt(0).toLowerCase() + agent.name.slice(1);
      this.agents[name] = mixin;
    });

    Object.defineProperties(this, {
      agents: { enumerable: false, writable: false },
      cipher: { enumerable: false, writable: false },
      hasher: { enumerable: false, writable: false },
      signer: { enumerable: false, writable: false },
      controller: { enumerable: false, writable: false },
    });
  }

  // spark
  public get publicKeys(): PublicKeys {
    const keyPairs = this.keyPairs as KeyPairs;
    return {
      encryption: keyPairs.encryption.publicKey,
      signing: keyPairs.signing.publicKey,
    } as PublicKeys;
  }

  public get secretKeys(): SecretKeys {
    const keyPairs = this.keyPairs as KeyPairs;
    return {
      encryption: keyPairs.encryption.secretKey,
      signing: keyPairs.signing.secretKey,
    } as SecretKeys;
  }

  public get keyPairs(): KeyPairs {
    const encryption = this.cipher.getKeyPair();
    const signing = this.signer.getKeyPair();
    return { encryption, signing } as KeyPairs;
  }

  public async generateKeyPairs(args: any): Promise<KeyPairs> {
    const encryption = await this.cipher.generateKeyPair(args) as EncryptionKeyPair;
    const signing = await this.signer.generateKeyPair(args) as SigningKeyPair;
    return { encryption, signing } as KeyPairs;
  }

  public async setKeyPairs({ keyPairs }: { keyPairs: KeyPairs }): Promise<void> {
    this.signer.setKeyPair({ keyPair: keyPairs.signing });
    this.cipher.setKeyPair({ keyPair: keyPairs.encryption });
  }

  import(data: HashDigest): Promise<void> {
    return Promise.resolve();
  }

  export(): Promise<HashDigest> {
    return Promise.resolve('');
  }

  // cipher
  get generateSharedEncryptionKey():  X['generateSharedKey'] {
    return this.cipher.generateSharedKey;
  }

  get setEncryptionKeyPair(): X['setKeyPair'] {
    return this.cipher.setKeyPair;
  }

  get encrypt(): X['encrypt'] {
    return this.cipher.encrypt;
  }

  get decrypt(): X['decrypt'] {
    return this.cipher.decrypt;
  }

  // controller
  get identifier(): ReturnType<C['getIdentifier']> {
    return this.controller.getIdentifier() as ReturnType<C['getIdentifier']>;
  }

  get keyEventLog(): ReturnType<C['getKeyEventLog']> {
    return this.controller.getKeyEventLog() as ReturnType<C['getKeyEventLog']>;
  }

  get incept(): C['incept'] {
    return this.controller.incept;
  }

  get rotate(): C['rotate'] {
    return this.controller.rotate;
  }

  get destroy(): C['destroy'] {
    return this.controller.destroy;
  }

  // hasher
  get hash(): H['hash'] {
    return this.hasher.hash;
  }

  // signer
  get generateSingingKeyPair(): S['generateKeyPair'] {
    return this.signer.generateKeyPair;
  }

  get setSigningKeyPair(): S['setKeyPair'] {
    return this.signer.setKeyPair;
  }

  get sign(): S['sign'] {
    return this.signer.sign;
  }

  get seal(): S['seal'] {
    return this.signer.seal;
  }

  get verify(): S['verify'] {
    return this.signer.verify;
  }

  get open(): S['open'] {
    return this.signer.open;
  }
}