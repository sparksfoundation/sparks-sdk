import { ISpark } from "../../Spark";
export type SharedEncryptionKey = string;
/**
 * Cipher interface
 * responsible for symmetric and asymmetric encrypting & decrypting operations.
 * must also implement a method for computing a shared key.
 * relies on controller's keyPairs and inbound public keys.
 * extend Cipher class to provide other cipher algorithms.
 */
export interface ICipher {
    /**
     * Encrypts data using X25519SalsaPoly
     * @param {object|string} data
     * @param {string} publicKey
     * @param {string} sharedKey
     * @returns {string}
     */
    encrypt: (args: {
        data: object | string;
        publicKey?: string;
        sharedKey?: string;
    }) => Promise<string | null> | never;
    /**
     * Decrypts data using X25519SalsaPoly
     * @param {string} data
     * @param {string} publicKey
     * @param {string} sharedKey
     * @returns {string}
     */
    decrypt: (args: {
        data: string;
        publicKey?: string;
        sharedKey?: string;
    }) => Promise<string | Record<string, any> | null> | never;
    /**
     * Computes a shared key using X25519SalsaPoly
     * @param {string} publicKey
     * @returns {string} sharedKey
     */
    computeSharedKey: (args: {
        publicKey: string;
    }) => Promise<string> | never;
}
export declare abstract class ACipher {
    protected spark: ISpark<any, any, any, any, any>;
    protected cipher: ICipher;
    constructor(spark: ISpark<any, any, any, any, any>);
    abstract encrypt(args: any): any;
    abstract decrypt(args: any): any;
    abstract computeSharedKey(args: any): any;
}
