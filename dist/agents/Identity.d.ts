import { KeyPairs, PublicSigningKey, PublicEncryptionKey } from '../forge/types.js';

type InceptProps = {
    keyPairs: KeyPairs;
    nextKeyPairs: KeyPairs;
    backers?: PublicSigningKey[];
};
type RotateProps = {
    keyPairs: KeyPairs;
    nextKeyPairs: KeyPairs;
    backers?: PublicSigningKey[];
};
type DestroyProps = undefined | {
    backers?: PublicSigningKey[];
};
interface IdentityInterface {
    incept(args?: InceptProps): void | never;
    rotate(args?: RotateProps): void | never;
    destroy(args?: DestroyProps): void | never;
    encrypt({ data, publicKey, sharedKey }: {
        data: object | string;
        publicKey?: string;
        sharedKey?: string;
    }): string;
    decrypt({ data, publicKey, sharedKey }: {
        data: object | string;
        publicKey?: string;
        sharedKey?: string;
    }): string;
    sign({ data, detached }: {
        data: object | string;
        detached?: boolean;
    }): string;
    verify({ publicKey, signature, data }: {
        publicKey: string;
        signature: string;
        data: object | string;
    }): boolean | string;
    toJSON(): object;
    identifier: string;
    keyEventLog: object[];
    publicKeys: {
        signing: PublicSigningKey;
        encryption: PublicEncryptionKey;
    };
}
declare class Identity implements IdentityInterface {
    #private;
    private __parseJSON;
    constructor();
    get connections(): object[];
    get identifier(): string;
    get keyEventLog(): object[];
    get publicKeys(): {
        signing: string;
        encryption: string;
    };
    incept({ keyPairs, nextKeyPairs, backers }: InceptProps): void;
    rotate({ keyPairs, nextKeyPairs, backers }: RotateProps): void;
    destroy(args: DestroyProps): void;
    encrypt({ data, publicKey, sharedKey }: {
        data: object | string;
        publicKey?: string;
        sharedKey?: string;
    }): string;
    decrypt({ data, publicKey, sharedKey }: {
        data: string;
        publicKey?: string;
        sharedKey?: string;
    }): string;
    sign({ data, detached }: {
        data: object | string;
        detached?: boolean;
    }): string;
    verify({ publicKey, signature, data }: {
        publicKey: any;
        signature: any;
        data: any;
    }): any;
    addConnection(Connection: any): any;
    toJSON(): {
        identifier: string;
        keyEventLog: object[];
    };
}

export { Identity };
