import { ISpark } from "../../Spark";
import { Controller } from "./Controller";

export type Identifier = string;                            // base64 identifier of inception event digest

export type SigningPublicKey = string;                      // base64 signing keypair's public key
export type SigningSecretKey = string;                      // base64 signing keypair's secret key
export type EncryptionPublicKey = string;                   // base64 encryption keypair's public key
export type EncryptionSecretKey = string;                   // base64 encryption keypair's secret key
export type EncryptionSharedKey = string;                   // base64 encryption shared key

export type SigningPublicKeyHash = string;                  // base64 hash of signing public signing key
export type EncryptionPublicKeyHash = string;               // base64 hash of encryption public signing key

export type EncryptionKeyPair = {
  publicKey: EncryptionPublicKey;                           // base64 encryption public key
  secretKey: EncryptionSecretKey;                           // base64 encryption secret key
}

export type SigningKeyPair = {
  publicKey: SigningPublicKey;                              // base64 signing public key
  secretKey: EncryptionPublicKey;                           // base64 signing secret key
}

export type PublicKeys = {
  encryption: EncryptionPublicKey;                          // base64 encryption public key
  signing: SigningPublicKey;                                // base64 signing public key
}

export type SecretKeys = {
  encryption: EncryptionSecretKey;                          // base64 encryption public key
  signing: SigningSecretKey;                                // base64 signing public key
}

export type KeyPairs = {
  encryption: EncryptionKeyPair;                            // base64 encryption public and secret keys
  signing: SigningKeyPair;                                  // base64 signing public and secret keys
}

export type KeriEventIndex = number;                        // s: sequence number
export enum KeriEventType {                                 // t: event type
  INCEPTION = 'incept',
  ROTATION = 'rotate',
  DELETION = 'delete',
}
export type SigningThreshold = number;                      // kt: minimum amount of signatures needed for this event to be valid (multisig)
export type SigningKeys = SigningPublicKey[];               // k: list of signing key
export type NextKeyCommitments = SigningPublicKeyHash[];    // n: next keys
export type Backer = SigningPublicKey;                      // b: individual backer
export type BackerThreshold = number;                       // bt: minimum amount of backers threshold
export type Backers = Backer[];                             // b: list of backers in this case the spark pwa-agent host's publickey there's no receipt at this ste
export type SelfAddressingIdentifier = string;              // d: self-addressing identifier
export type Version = string;                               // v: version
export type PreviousEventDigest = string;                   // p: previous event digest

export type KeriRotationEventArgs = {
  eventType: KeriEventType.ROTATION;
  keyPairs: KeyPairs;
  nextKeyPairs: KeyPairs;
  backers: Backers;
  previousEventDigest: PreviousEventDigest;
}

export type KeriDeletionEventArgs = {
  eventType: KeriEventType.DELETION;
  backers: Backers;
}

export type KeriInceptionEventArgs = {
  eventType: KeriEventType.INCEPTION;
  keyPairs: KeyPairs;
  nextKeyPairs: KeyPairs;
  backers: Backers;
}

export type KeriEventArgs = KeriInceptionEventArgs | KeriRotationEventArgs | KeriDeletionEventArgs;

export type KeriEvent = {
  identifier: Identifier;
  version: Version;
  eventIndex: KeriEventIndex;
  eventType: KeriEventType;
  signingThreshold: SigningThreshold;
  signingKeys: SigningKeys;
  nextKeyCommitments: NextKeyCommitments;
  backerThreshold: BackerThreshold;
  backers: Backers;
  selfAddressingIdentifier: SelfAddressingIdentifier;
}

export type KeriInceptionEvent = KeriEvent & {
  eventType: KeriEventType.INCEPTION;
}

export type KeriRotationEvent = KeriEvent & {
  previousEventDigest: string;
  eventType: KeriEventType.ROTATION;
}

export type KeriDeletionEvent = KeriRotationEvent & {
  eventType: KeriEventType.DELETION;
}

export type KeriKeyEvent = KeriInceptionEvent | KeriRotationEvent | KeriDeletionEvent;
export type KeyEventLog = KeriKeyEvent[];

/**
 * Controller interface
 * responsible for managing keypairs and key event log
 * must implement methods for incepting, rotating, deleting, importing and exporting
 * relies on a cipher for encryption and decryption, a hasher for hashing and a signer
 * also provides and import and export method for backing up or restoring data
 * this is the main interface for the spark Identity
 * extend Controller class provide custom key derivation functionality
 */

export interface IController {
  /**
   * Incepts a new identity
   * @param {Object} args - The args for incepting.
   * @param {Object} args.keyPairs - Key pairs to incept with.
   * @param {Object} args.nextKeyPairs - Next key pairs to rotate to.
   * @param {Array} args.backers - List of backers to back this inception.
   * @returns {Promise<void> | never} A promise that resolves when the incept operation is complete,
   * or rejects with an error.
   */
  incept({ keyPairs, nextKeyPairs, backers }: { keyPairs: KeyPairs, nextKeyPairs: KeyPairs, backers?: Backers }): Promise<void> | never;

  /**
   * Rotates the current key pairs to a new key pair
   * @param {Object} args - The args for incepting.
   * @param {Object} args.keyPairs - Key pairs to incept with.
   * @param {Object} args.nextKeyPairs - Next key pairs to rotate to.
   * @param {Array} args.backers - List of backers to back this inception.
   * @returns {Promise<void> | never} A promise that resolves when the rotate operation is complete,
   */
  rotate({ keyPairs, nextKeyPairs, backers }: { keyPairs: KeyPairs, nextKeyPairs: KeyPairs, backers: Backers }): Promise<void> | never;

  /**
   * Deletes the current key pairs by rotating to a null set
   * @param {Object} args - The args for rotating.
   * @param {Array} args.backers - List of backers to back this deletion.
   * @returns {Promise<void> | never} A promise that resolves when the delete operation is complete,
   * or rejects with an error.
   */
  delete({ backers }: { backers: Backers }): Promise<void> | never;

  /**
   * Imports an identity from an encrypted serialized base64 string
   * @param {Object} args - The args for importing.
   * @param {Object} args.keyPairs - Key pairs to decrypt with.
   * @param {string} args.data - The encrypted serialized base64 string.
   * @returns {Promise<void> | never} A promise that resolves when the import operation is complete,
   * or rejects with an error.
   */
  import({ keyPairs, data }: { keyPairs: KeyPairs, data: string | Record<string, any> }): Promise<void> | never;

  /**
   * Exports an identity to an encrypted serialized base64 string
   * @returns {Promise<string> | never} A promise that resolves to the encrypted serialized base64 string.
   * or rejects with an error.
   */
  export(): Promise<any> | never;

  // getters
  keyPairs: KeyPairs;
  identifier: Identifier;
  keyEventLog: KeyEventLog;
  publicKeys: PublicKeys;
  encryptionKeys: EncryptionKeyPair;
  signingKeys: SigningKeyPair;
  secretKeys: SecretKeys;
}

/**
* Creates a key event
* @param {Object} args - The args for creating a key event.
* @param {string} args.eventType - The type of key event.
* @param {Object} args.keyPairs - Key pairs to incept with.
* @param {Object} args.nextKeyPairs - Next key pairs to rotate to.
* @param {Array} args.backers - List of backers to back this inception.
* @param {string} args.previousEventDigest - The previous event digest.
* @returns {Promise<KeriKeyEvent> | never} A promise that resolves to the key event.
* or rejects with an error.
*/
export type KeyEventMethod = (args: KeriEventArgs) => Promise<KeriKeyEvent> | never;

// only for others to extend
export abstract class AController {
  public controller: IController;
  public spark: ISpark<any, any, any, any, any>;
  constructor(spark: ISpark<any, any, any, any, any>) {
    if (!spark) throw new Error('Controller: missing spark');
    this.spark = spark;
    Object.defineProperties(this, { spark: { enumerable: false, writable: false } });
    this.controller = new Controller(this.spark);
    this.incept = this.incept.bind(this);
    this.rotate = this.rotate.bind(this);
    this.delete = this.delete.bind(this);
    this.import = this.import.bind(this);
    this.export = this.export.bind(this);
  }
  
  public abstract incept(args: any): any;
  public abstract rotate(args: any): any;
  public abstract delete(args: any): any;
  public abstract import(args: any): any;
  public abstract export(args?: any): any;

  get identifier(): Identifier {
    return this.controller.identifier;
  }

  get keyPairs(): KeyPairs {
    return this.controller.keyPairs;
  }

  get keyEventLog(): KeyEventLog {
    return this.controller.keyEventLog;
  }

  get encryptionKeys(): EncryptionKeyPair { 
    return this.controller.encryptionKeys;
  }
  
  get signingKeys(): SigningKeyPair {
    return this.controller.signingKeys;
  }

  get secretKeys(): SecretKeys { 
    return this.controller.secretKeys;
  }

  get publicKeys(): PublicKeys { 
    return this.controller.publicKeys;
  }
}