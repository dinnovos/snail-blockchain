import fs from 'fs';
import PeerId from 'peer-id';
import randomWords from 'random-words';

let Helpers = {};

Helpers.getSecurityPhrase = (key) => {
	let words = randomWords({exactly:3, wordsPerString:2, separator:'-', formatter: (word)=> word.toUpperCase()});

	let i = Helpers.randomIntInc(0, 2);

	let subString = key.slice(0, 10) + '-' + key.slice(-10) + '-' + key.slice(11, 21) + '-' + Date.now();

	if(words[i] === undefined){
		return words[0] + "-" + subString;
	}

	return words[i] + "-" + subString;
};

Helpers.randomIntInc = (low, high) => {
  return Math.floor(Math.random() * (high - low + 1) + low);
};

// Genera o carga el archivo peer.json y a apartir de el genera el token de conexion
Helpers.getPeerId = (file = 'peer', generate = false) => {

	return new Promise(async (resolve) => {

		let peerId = null;
		let filename = file + '.json';

		try {

			let peerId = null;

		    if(fs.existsSync(process.cwd() + '/' + filename) && generate === false) {

		        peerId = fs.readFileSync(process.cwd() + '/' + filename, {encoding:'utf8', flag:'r'});

		    } else {

		    	const id = await PeerId.create({ bits: 1024, keyType: 'rsa' });

		    	peerId = JSON.stringify(id.toJSON());

		    	fs.appendFile(process.cwd() + '/' + filename, peerId, (err) => {
				  	if (err) 
				  		throw err;
				});
		    }

		    if(peerId){

		    	peerId = JSON.parse(peerId);

		    	resolve(peerId);
		    }

		} catch (err) {
		    console.error(err);
		}

	});
};

export default Helpers;