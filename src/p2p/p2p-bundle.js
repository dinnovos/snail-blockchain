'use strict'

import libp2p from 'libp2p';
import TCP from 'libp2p-tcp';
import WS from 'libp2p-websockets';
import Mplex from 'libp2p-mplex';
import { NOISE } from 'libp2p-noise';
import defaultsDeep from 'defaults-deep';
import Bootstrap from 'libp2p-bootstrap';
import Gossipsub from 'libp2p-gossipsub';

class P2PBundle extends libp2p {
  constructor (_options) {
    const defaults = {
      modules: {
        transport: [
          TCP,
          WS
        ],
        streamMuxer: [ Mplex ],
        peerDiscovery: [Bootstrap],
        connEncryption: [ NOISE ],
        pubsub: Gossipsub
      }
    }

    super(defaultsDeep(_options, defaults))
  }
}

module.exports = P2PBundle