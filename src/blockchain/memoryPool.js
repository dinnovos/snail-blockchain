import { Transaction } from '../wallet';

class MemoryPool{
	constructor(){
		this.transactions = [];	
	}

	addOrUpdate(transaction){
		const { input } = transaction;

		if(! Transaction.verify(transaction))
			throw Error(`Invalid signature from: ${input.address}`);

		const txIndex = this.transactions.findIndex(({ id }) => id === transaction.id );

		if(txIndex >= 0)
			this.transactions[txIndex] = transaction;
		else
			this.transactions.push(transaction);
	}

	find(address){
		return this.transactions.find(({ input }) => input.address === address);
	}

	getAll(){
		return this.transactions;
	}

	wipe(){
		this.transactions = [];
	}
}

export default MemoryPool;