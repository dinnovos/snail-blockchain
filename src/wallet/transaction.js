const { v4: uuidv4 } = require('uuid');
import { elliptic } from '../modules';

class Transaction{
	constructor(){
		this.id = uuidv4();
		this.input = null;
		this.outputs = [];
	}

	// Metodo estatico para generar una transaccion
	static create(senderWallet, data){

		const transaction = new Transaction();

		// Se almacena la data
		transaction.outputs.push( {data: data, timestamp: Date.now()} );

		transaction.input = Transaction.sign(transaction, senderWallet);

		return transaction;
	}

	// Metodo estatico para verificar una transaccion
	static verify(transaction){

		// Del input de la transaccion obtiene la direccion y la firma
		// Tambien obtiene el ouput
		const { input: { address, signature }, outputs } = transaction;

		// Verifica la firma a partir de la direccion, la firma y los outputs
		return elliptic.verifySignature(address, signature, outputs);
	}

	static sign(transaction, senderWallet, updateTimestamp = true){

		// Contiene los detalles del emisor
		// Timestamp: momento de creacion de la transaccion
		// Address: direccion publica del emisor
		// Signature: firma digital que hace unica la transaccion
		return {
			timestamp: 	(updateTimestamp)?Date.now():transaction.input.timestamp,
			address: 	senderWallet.publicKey,
			signature: 	senderWallet.sign(transaction.outputs),
		};
	}

	update(senderWallet, data){

		// Agrega el output de quien recibe
		this.outputs.push( {data: data, timestamp: Date.now()} );

		// Vuelve a firmar la transaccion
		this.input = Transaction.sign(this, senderWallet, false);

		return this;
	}
}

export default Transaction;