import express from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import fs from 'fs';

import BlockChain from '../blockchain';
import Wallet, { TYPE } from '../wallet';
import P2PService, { MESSAGE } from '../p2p';
import Miner from '../miner';
import Helpers from '../tools';
import validate from "../blockchain/modules/validate";

let envConfig = fs.readFileSync(process.cwd() + '/env.json');
let config = JSON.parse(envConfig);

const { NAME, HTTP_PORT = 80, P2P_PORT = 5000, DOMAIN_ALLOW, PEERS } = config;

const app = express();
const blockChain = new BlockChain();
const mainWallet = new Wallet(blockChain, TYPE.BLOCKCHAIN);
const minerWallet = new Wallet(blockChain, TYPE.MINER);
const p2pService = new P2PService(P2P_PORT, PEERS, blockChain);
const miner = new Miner(blockChain, p2pService, minerWallet);

let walletContainer = [];

walletContainer.push(mainWallet);
walletContainer.push(minerWallet);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(helmet());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

// Get Blocks
app.get("/blocks", (req, res) => {
    res.json(blockChain.blocks);
});

// Wallet Create
app.post("/wallet/create", async (req, res) => {

    const newWallet = new Wallet(blockChain, 0);
    const { publicKey, privateKey, confirmationKey, securityPhrase } = newWallet;

    walletContainer.push(newWallet);

    res.json({ publicKey: publicKey, privateKey: privateKey, confirmationKey: confirmationKey, securityPhrase: securityPhrase });
});

// Create transaction
app.post("/tx/create", (req, res) => {
    const { body: { senderAddress, data } } = req;

    const senderWallet = walletContainer.find(({ publicKey }) => publicKey === senderAddress );

    if(senderWallet === undefined){
        res.json({ error: "Sender Wallet not found" });
        return;
    }

    try{
        
        const tx = senderWallet.createTransaction(data);

        p2pService.broadcast(MESSAGE.TX, tx);
        
        res.json(tx);
        
    }catch(error){
        res.json({ error: error.message });
    }
});

// Confirm transactions
app.get("/txs/confirm", (req, res) => {

    let block;

    try{
        block = miner.mine();
    }catch(error){
        res.json({ error: error.message });
    }

    res.json({ status: "ok", block: block });
});

// Get unconfirmed transactions
app.get("/txs/unconfirmed", (req, res) => {
    const { query: { publicKey } } = req;
    const { memoryPool } = blockChain;

    let txs = {};

    if(publicKey === undefined){
        txs = memoryPool.getAll();
    }else{
        txs = memoryPool.find(publicKey);
    }

    res.json({"status":"ok", "txs":txs});
});

app.get("/blocks/validate", (req, res) => {

    try {
        validate(blockChain.blocks);
    } catch (error) {
        res.json({ status: "failed", message: error });
        return;
    }

    res.json({ status: "ok", message:"All blocks are valid." });
});

app.listen(HTTP_PORT, async () => {
    console.log(`Server: ${NAME}`);
    console.log(`Service HTTP: http://localhost:${HTTP_PORT} listening...`);

    const peerId = await Helpers.getPeerId();

    p2pService.listen(peerId);
});