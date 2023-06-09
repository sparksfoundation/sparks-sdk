import { AnyKeyEvent, BaseKeyEventProps, KeyDestructionEvent, KeyInceptionEvent, KeyRotationEvent } from "../types";
import { KeyEventType } from "../types";
import { CoreController } from "../CoreController";
import { KeyPairs } from "../../types";
import { ControllerErrors } from "../../errors/controller";

export class Basic extends CoreController {
  public async import(data: Record<string, any>): Promise<void> {
    await super.import(data);
    return Promise.resolve();
  }
  
  public async export(): Promise<Record<string, any>> {
    const data = await super.export();
    return Promise.resolve(data);
  }

  private async keyEvent({ nextKeyPairs, type }: { nextKeyPairs?: KeyPairs, type: KeyEventType.INCEPT }): Promise<KeyInceptionEvent>;
  private async keyEvent({ nextKeyPairs, type }: { nextKeyPairs?: KeyPairs, type: KeyEventType.ROTATE }): Promise<KeyRotationEvent>;
  private async keyEvent({ nextKeyPairs, type }: { nextKeyPairs?: KeyPairs, type: KeyEventType.DESTROY }): Promise<KeyDestructionEvent>;
  private async keyEvent({ nextKeyPairs, type }: { nextKeyPairs?: KeyPairs, type: KeyEventType }): Promise<AnyKeyEvent> {
    const keyPairs = this._spark.keyPairs as KeyPairs;
    const previousKeyCommitment = this._keyEventLog[this._keyEventLog.length - 1]?.nextKeyCommitments;
    const keyCommitment = await this._spark.hash({ data: keyPairs.signer.publicKey });
    const nextKeyCommitments = type === KeyEventType.DESTROY ? undefined  : await this._spark.hash({ data: nextKeyPairs.signer.publicKey });

    try {
      switch (true) {
          // if incepting and already incepted
        case type === KeyEventType.INCEPT && this._keyEventLog.length > 0:
          throw new Error('Cannot incept when already incepted.');
          // if rotating and not incepted
        case type === KeyEventType.ROTATE && this._keyEventLog.length === 0:
          throw new Error('Cannot rotate when not incepted.');
          // if destroying and not incepted
        case type === KeyEventType.DESTROY && this._keyEventLog.length === 0:
          throw new Error('Cannot destroy when not incepted.');
          // if destroying and already destroyed
        case type === KeyEventType.DESTROY && this._keyEventLog.length > 0 && this._keyEventLog[this._keyEventLog.length - 1].type === KeyEventType.DESTROY:
          throw new Error('Cannot destroy when already destroyed.');
          // if invalid next key pairs
        case type !== KeyEventType.DESTROY && !nextKeyPairs:
          throw new Error('Invalid next key pairs.');
          // if invalid type
        case !Object.values(KeyEventType).includes(type):
          throw new Error('Invalid key event type.');
          // if rotation and invalid next key commitment
        case type === KeyEventType.ROTATE && previousKeyCommitment !== keyCommitment:
          throw new Error('Invalid next key commitment.');
      }

      const baseEventProps: BaseKeyEventProps = {
        index: this._keyEventLog.length,
        signingThreshold: 1,
        signingKeys: [keyPairs.signer.publicKey],
        backerThreshold: 0,
        backers: [],
        nextKeyCommitments,
      }

      const eventJSON = JSON.stringify(baseEventProps);
      const version = 'KERI10JSON' + eventJSON.length.toString(16).padStart(6, '0') + '_';
      const hashedEvent = await this._spark.hash({ data: eventJSON });
      const selfAddressingIdentifier = await this._spark.seal({ data: hashedEvent });
      const identifier = this._identifier || `B${selfAddressingIdentifier}`;
      const previousEventDigest: string = this._keyEventLog.length > 0 ? this._keyEventLog[this._keyEventLog.length - 1].selfAddressingIdentifier : undefined;

      const commonEventProps = {
        identifier,
        type,
        version,
        ...baseEventProps,
        selfAddressingIdentifier,
      }

      switch (type) {
        case KeyEventType.INCEPT:
          return {
            ...commonEventProps,
            type: KeyEventType.INCEPT,
          };
        case KeyEventType.ROTATE:
          return {
            ...commonEventProps,
            type: KeyEventType.ROTATE,
            previousEventDigest,
          };
        case KeyEventType.DESTROY:
          return {
            ...commonEventProps,
            type: KeyEventType.DESTROY,
            previousEventDigest,
            nextKeyCommitments: [],
            signingKeys: []
          };
        default:
          throw new Error('Invalid key event type.');
      }
    } catch (error) {
      return Promise.reject(ControllerErrors.KeyEventCreationError(error));
    }
  }

  public async incept(): Promise<void> {
    try {
      const keyPairs = this._spark.keyPairs as KeyPairs;
      const inceptionEvent = await this.keyEvent({ nextKeyPairs: keyPairs, type: KeyEventType.INCEPT }) as KeyInceptionEvent;
      this._keyEventLog.push(inceptionEvent);
      this._identifier = inceptionEvent.identifier;
    } catch (error) {
      return Promise.reject(ControllerErrors.InceptionError(error));
    }
  }

  public async rotate({ nextKeyPairs }: { nextKeyPairs: KeyPairs }): Promise<void> {
    try {
      const rotationEvent = await this.keyEvent({ nextKeyPairs, type: KeyEventType.ROTATE }) as KeyRotationEvent;
      this._keyEventLog.push(rotationEvent);
    } catch(error) {
      return Promise.reject(ControllerErrors.RotationError(error));
    }
  }

  public async destroy(): Promise<void> {
    try {
      const destructionEvent = await this.keyEvent({ type: KeyEventType.DESTROY }) as KeyDestructionEvent;
      this._keyEventLog.push(destructionEvent);
    } catch(error) {
      return Promise.reject(ControllerErrors.DestroyError(error));
    }
  }
}