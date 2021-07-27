import { elliptic, hash } from '../modules';
import Transaction from './transaction';
import Helpers from '../tools';

const TYPE = { 
	MINER: 'miner',
	USER: 'user',
	BLOCKCHAIN: 'blockchain',
};

class Wallet{

	constructor(blockchain, type = TYPE.USER, staticKey = null){

		let keyPair = elliptic.createKeyPair();

		// Clave publica
		this.publicKey = keyPair.getPublic().encodeCompressed("hex");

		// Clave privada
		this.privateKey = keyPair.getPrivate("hex");

		// Guarda la blockchain
		this.blockchain = blockchain;

		// Tipo de usuario dueño de la wallet
		this.type = type;

		// Key estatico usado por los nodos tipo MINER para recuperar su wallet
		this.staticKey = staticKey;

		this.keyPair = keyPair;

		this.confirmationKey = hash(this.publicKey);

		this.securityPhrase = Helpers.getSecurityPhrase(this.confirmationKey);
	}

	toString(){
		const { publicKey } = this;

		return ` Wallet - 
			publicKey	: ${publicKey.toString()}
		`
	}

	sign(data) {

		// Genera una firma a partir de un hash de la data enviada como parametro
		return this.keyPair.sign(hash(data));
	}

	createTransaction(data){
		const { blockchain: { memoryPool } } = this;

		// Busca si mi wallet ya tiene una transaccion en memoryPool
		let tx = memoryPool.find(this.publicKey);

		// si la transaccion existe la actualiza con el nuevo output
		if(tx){
			tx.update(this, data);
		}else{
			tx = Transaction.create(this, data);

			// Actualiza memoryPool con la nueva transaccion.
			memoryPool.addOrUpdate(tx);
		}

		return tx;
	}
}

export { TYPE };

export default Wallet;