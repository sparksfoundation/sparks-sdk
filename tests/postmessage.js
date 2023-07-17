import { Spark } from '../dist/index.mjs';
import { Ed25519 } from '../dist/signers/Ed25519/index.mjs';
import { Blake3 } from '../dist/hashers/Blake3/index.mjs';
import { Basic } from '../dist/controllers/Basic/index.mjs';
import { X25519SalsaPoly } from '../dist/ciphers/X25519SalsaPoly/index.mjs';
import { PostMessage } from '../dist/channels/ChannelTransports/PostMessage/index.mjs';
import { assert } from 'console';
import { Window } from './utilities/Window.js';

(async function () {
  const webWindow = new Window('http://localhost:1111');
  const aliceWindow = new Window('http://localhost:0000');

  const website = new Spark({
    cipher: X25519SalsaPoly,
    controller: Basic,
    hasher: Blake3,
    signer: Ed25519,
  });

  const keyPairs = await website._generateKeyPairs();
  await website.incept(keyPairs)

  const alice = new Spark({
    cipher: X25519SalsaPoly,
    controller: Basic,
    hasher: Blake3,
    signer: Ed25519,
  });

  await alice.incept()

  PostMessage.receive(async ({ event, confirmOpen }) => {
    const channel = await confirmOpen();
    channel.on(channel.eventTypes.MESSAGE_REQUEST, async (event) => {
      const message = await channel.getEventData(event);
      console.log('w: ', message);
    });

    await channel.message('hey alice');

  }, { spark: website, _window: webWindow, _source: aliceWindow });

  const channel = new PostMessage({
    peer: { origin: webWindow.origin },
    spark: alice,
    source: webWindow,
    _window: aliceWindow,
  });

  channel.on(channel.eventTypes.MESSAGE_REQUEST, async (event) => {
    const message = await channel.getEventData(event);

  });

  await channel.open()

  await channel.message('hey website');
  await channel.message('hey website');
  await channel.message('hey website');
  await channel.message('hey website');

  const backup = await channel.export();
  for (let i = 0; i < backup.eventLog.length; i++) {
    const event = backup.eventLog[i];
    const nextEvent = backup.eventLog[i + 1];
    console.log(!!event.request, event.type);
    if (nextEvent) {
      const matched = event.metadata.nextEventId === nextEvent.metadata.eventId;
    }
  }

  // const newChannes = new PostMessage({
  //   spark: alice,
  //   source: webWindow,
  //   peer: { origin: webWindow.origin },
  //   _window: aliceWindow,
  // });

  // newChannes.on(channel.eventTypes.ANY_EVENT, async (event) => {
  //   console.log('a', channel.peer.origin, event.type);
  // });

  // await newChannes.import(backup);
  // await newChannes.open();
  
  // await newChannes.close();
  
}())