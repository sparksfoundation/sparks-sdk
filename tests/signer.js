import { Spark } from '../dist/index.mjs';
import { Ed25519 } from '../dist/signers/Ed25519/index.mjs';
import { X25519SalsaPoly } from '../dist/ciphers/X25519SalsaPoly/index.mjs';
import { Blake3 } from '../dist/hashers/Blake3/index.mjs';
import { Basic } from '../dist/controllers/Basic/index.mjs';
import { assert } from 'console';

(async function() {
    const spark = new Spark({
      cipher: X25519SalsaPoly,
      controller: Basic,
      hasher: Blake3,
      signer: Ed25519,
    });
  
    const data = { test: 'test' };
    const keyPairs = await spark.generateKeyPairs()
      .catch(e => {console.log(e); assert(false, 'signer - keys generated')});

    spark.setKeyPairs(keyPairs)
      .catch(e => {console.log(e); assert(false, 'signer - keys set') });

    const keys = spark.keyPairs;
    
    const other = await spark.generateKeyPairs()
      .catch(e => assert(false, 'signer - other keys generated'));
  
    const signed = await spark.sign({ data })
      .catch(e => assert(false, 'signer - data signed'));

    const verified = await spark.verify({ data, signature: signed, publicKey: keys.signer.publicKey })
      .catch(e => assert(false, 'signer - data verified'));
  
    const sealed = await spark.seal({ data })
      .catch(e => assert(false, 'signer - data sealed'));

    const opened = await spark.open({ publicKey: keys.signer.publicKey, signature: sealed })
      .catch(e => assert(false, 'signer - data opened'));

}())