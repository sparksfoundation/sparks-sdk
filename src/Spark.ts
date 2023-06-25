import { Controller } from "./controller";
import { Constructable, KeyPairs, PublicKeys, SecretKeys, SparkParams } from "./types";
import { AgentAbstract } from "./agents/types";
import { CipherAbstract, EncryptionKeyPair } from "./ciphers/types";
import { HashDigest, HasherAbstract } from "./hashers/types";
import { SignerAbstract, SigningKeyPair } from "./signers/types";
import { SparkInterface } from "./types";
import { ControllerInterface, Identifier, KeyEventLog } from "./controller/types";
import { SparkError, ErrorInterface } from "./common/errors";

export class Spark<
  A extends AgentAbstract[],
  C extends CipherAbstract,
  H extends HasherAbstract,
  S extends SignerAbstract
> implements SparkInterface<A, C, H, S> {

  private cipher: C;
  private hasher: H;
  private signer: S;
  public agents: { [key: string]: InstanceType<Constructable<A[number]>> } = {};
  private controller: ControllerInterface;

  constructor({
    agents = [],
    cipher,
    hasher,
    signer
  }: SparkParams<A, C, H, S>) {

    this.cipher = new cipher();
    this.controller = new Controller();
    this.hasher = new hasher();
    this.signer = new signer();

    agents.forEach((agent: Constructable<A[number]>) => {
      const mixin = new agent();
      const name = agent.name.charAt(0).toLowerCase() + agent.name.slice(1);
      this.agents[name] = mixin;
    });
  }

  get keyPairs(): KeyPairs | ErrorInterface {
    const encryption = this.encryptionKeys() as EncryptionKeyPair;
    const signing = this.signingKeys() as SigningKeyPair;
    if (encryption instanceof SparkError) return encryption as ErrorInterface;
    if (signing instanceof SparkError) return signing as ErrorInterface;
    return { encryption, signing } as KeyPairs;
  }

  get publicKeys(): PublicKeys | ErrorInterface {
    const encryption = this.encryptionKeys() as EncryptionKeyPair;
    const signing = this.signingKeys() as SigningKeyPair;
    if (encryption instanceof SparkError) return encryption as ErrorInterface;
    if (signing instanceof SparkError) return signing as ErrorInterface;
    return {
      encryption: encryption.publicKey,
      signing: signing.publicKey
    } as PublicKeys;
  }

  get secretKeys(): SecretKeys | ErrorInterface {
    const encryption = this.encryptionKeys() as EncryptionKeyPair;
    const signing = this.signingKeys() as SigningKeyPair;
    if (encryption instanceof SparkError) return encryption as ErrorInterface;
    if (signing instanceof SparkError) return signing as ErrorInterface;
    return {
      encryption: encryption.secretKey,
      signing: signing.secretKey
    }
  }

  get getIdentifier(): ControllerInterface['getIdentifier'] {
    return this.controller.getIdentifier;
  }

  get getKeyEventLog(): ControllerInterface['getKeyEventLog'] {
    return this.controller.getKeyEventLog;
  }

  get encryptionKeys(): C['getKeyPair'] {
    return this.cipher.getKeyPair;
  }

  get signingKeys(): S['getKeyPair'] {
    return this.signer.getKeyPair;
  }

  get initEncryptionKeys(): C['initKeyPair'] {
    return this.cipher.initKeyPair;
  }

  get computSharedEncryptionKey(): C['computeSharedKey'] {
    return this.cipher.computeSharedKey;
  }

  get encrypt(): C['encrypt'] {
    return this.cipher.encrypt;
  }

  get decrypt(): C['decrypt'] {
    return this.cipher.decrypt;
  }

  get hash(): H['hash'] {
    return this.hasher.hash;
  }

  get initSingingKeys(): S['initKeyPair'] {
    return this.signer.initKeyPair;
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

  get incept(): ControllerInterface['incept'] {
    const keyPairs = this.keyPairs as KeyPairs;
    return this.controller.incept;
  }

  get rotate(): ControllerInterface['rotate'] {
    return this.controller.rotate;
  }

  get destroy(): ControllerInterface['destroy'] {
    return this.controller.destroy;
  }

  import(data: HashDigest): Promise<void | ErrorInterface> {
    return Promise.resolve();
  }

  export(): Promise<HashDigest> {
    return Promise.resolve('');
  }
}