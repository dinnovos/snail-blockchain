import { MESSAGE } from '../p2p';

class Miner{
	constructor(blockchain, p2pService, wallet){
		this.blockchain = blockchain;
		this.p2pService = p2pService;
		this.wallet = wallet;
	}

	mine(){
		const { blockchain: { memoryPool }, p2pService, wallet } = this;

		let memoryPoolTxs = [];

		if(memoryPool.transactions.length === 0)
			return null;

		// Recorre todas las transacciones de memory pool
		memoryPool.transactions.forEach(( tx ) => {
			memoryPoolTxs.push(tx);
		});

		// Crea el block con la transaccion valida
		const block = this.blockchain.addBlock(memoryPoolTxs);

		// Sincroniza la nueva blockChain con toda la red
		p2pService.sync();

		// Limpia todas las transacciones de memory pool
		memoryPool.wipe();

		// Envia mensaje broadcast
		p2pService.broadcast(MESSAGE.WIPE);

		return block;
	}
}

export default Miner;