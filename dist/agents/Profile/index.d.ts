import { S as SparkAgent } from '../../index-91aa2e5b.js';
import '../../types-ea65808d.js';
import '../../types-188a9fde.js';
import '../../types-d4be7460.js';
import '../../types-93f6b970.js';

declare class Profile extends SparkAgent {
    avatar: string;
    handle: string;
    import(data: Record<string, any>): Promise<void>;
    export(): Promise<Record<string, any>>;
}

export { Profile };
