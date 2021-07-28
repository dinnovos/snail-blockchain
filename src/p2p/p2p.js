import PeerId from 'peer-id';
import Bootstrap  from 'libp2p-bootstrap';
import uint8ArrayFromString from 'uint8arrays/from-string';
import uint8ArrayToString from 'uint8arrays/to-string';
import P2PBundle  from './p2p-bundle';

const MESSAGE = { 
	BLOCKS: 'blocks',
	TX: 'transaction',
	WIPE: 'wipe-memory-pool'
};

const TOPIC = "chain-snail-p2p-2021-31484856";

class P2PService{

	constructor(port, peers, blockchain){
		this.port = port;
		this.peers = peers;
		this.blockchain = blockchain;
		this.nodeListener = null;
	}

	async listen(peerId){

		const { blockchain } = this;

		// Genera el peerId desde archivo peer.json
		const idListener = await PeerId.createFromJSON(peerId);

		this.nodeListener = new P2PBundle({
			peerId: idListener,
		    addresses: {
		    	listen: ['/ip4/0.0.0.0/tcp/' + this.port]
		    },
		    config: {
		        peerDiscovery: {
					autoDial: true,
					[Bootstrap.tag]: {
						enabled: true,
						list: this.peers
					}
		        },
		        pubsub: {
					enabled: true,
					emitSelf: false
			    }
		    },

		});

		// Start listening
  		await this.nodeListener.start();

  		// Muestra un mensaje cuando se conecta un nodo
		this.nodeListener.connectionManager.on('peer:connect', (connection) => {
			console.log('Connected to: ', connection.remotePeer.toB58String());
		});

		// Muestra un mensaje cuando se descubre un nodo
		this.nodeListener.on('peer:discovery', (peer) => {
			console.log('Discovered %s', peer.toB58String()) // Log discovered peer
		});

		this.nodeListener.pubsub.on(TOPIC, (message) => {

			const { type, value } = JSON.parse(uint8ArrayToString(message.data));

			console.log("Type: ", type);
			console.log("Value: ", value);

			try{

				if(type === MESSAGE.BLOCKS)
					blockchain.replace(value);
				else if(type === MESSAGE.TX)
					blockchain.memoryPool.addOrUpdate(value);
				else if(type === MESSAGE.WIPE)
					blockchain.memoryPool.wipe();
			
			}catch(error){
				console.log(`ATENCION: [ws:message] error ${error}`);
			}

		});

		await this.nodeListener.pubsub.subscribe(TOPIC);

		// Print out listening addresses
		console.log('Listening on addresses:');

		this.nodeListener.multiaddrs.forEach(addr => {
			console.log(` > ${addr.toString()}/p2p/${this.nodeListener.peerId.toB58String()}`)
		});
	}

	sync(){
		const {blockchain: { blocks } } = this;

		// Envio un mensaje a todos los nodos de la red con los bloques de la instancia actual
		this.broadcast(MESSAGE.BLOCKS, blocks);
	}

	broadcast(type, value){

		const message = JSON.stringify({type, value});

		this.nodeListener.pubsub.publish(TOPIC, uint8ArrayFromString(message));
	}
}

export  { MESSAGE };
export default P2PService;