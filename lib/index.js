const assert = require('assert');
const MongoDb = require('./db');
const debug = require('./debug');
const instances = {};
class CoinDb {
  constructor(mongodb, wallet, log) {
    this.debug = log;
    this.walletId = wallet.id;
    this.db = mongodb;
    this.gracefulShutdown();
  }

  async getWallet() {
    this.debug('fetching wallet');
    const wallet = await this.db.fetchWallet(this.walletId);
    return wallet;
  }
  async deleteWallet(forced = false) {
    if (forced) {
      await this.db.deleteWallet(this.walletId);
      return true;
    }
    console.log('Warning, this will delete the whole wallet and all addresses associated with it');
    console.log('You have 10 seconds to cancel CTRL+C');
    setTimeout(async function() {
      await this.db.deleteWallet(this.walletId);
      console.log('Successfully deleted wallet', this.walletId);
    }, 10000);
  }
  async importAddresses(bulk) {
    this.debug('importing batch addresses');
    if (!Array.isArray(bulk)) {
      this.debug('Parameter is expected to be an array');
      return false;
    }
    let len = bulk.length;
    while (len--) {
      bulk[len].walletId = this.walletId;
    }
    const msg = await this.db.storeAddresses(this.walletId, bulk);
    this.debug('Successfully imported addresses');
    return msg;
  }
  async importAddress(address, accountId, ind) {
    this.debug('importing address');
    const a = {
      walletId: this.walletId,
      address,
      accountId,
      index: ind
    };
    const checkaddr = await this.db.fetchAddress(this.walletId, address);
    if (checkaddr) {
      this.debug('Address already exists');
      return false;
    }
    await this.db.storeAddress(a);
    this.debug('Successfully imported address');
    return true;
  }
  async removeAddress(address) {
    this.debug('removing address');
    const checkaddr = await this.db.fetchAddress(this.walletId, address);
    if (!checkaddr) {
      this.debug('Address does not exists');
      return false;
    }
    await this.db.removeAddress(this.walletId, address);
    this.debug('Successfully deleted address');
    return true;
  }
  async countAddress() {
    this.debug('counting addresses');

    return await this.db.countAddresses(this.walletId) || 0;
  }
  async getAddress(address) {
    this.debug('fetching address');
    if (!address) {
      this.debug('Address is required');
      return false;
    }
    return await this.db.fetchAddress(this.walletId, address) || false;
  }
  async getAddresses() {
    this.debug('fetching all addresses');
    return await this.db.fetchAddressByWalletId(this.walletId);
  }
  async getAddressBy(q) {
    if (typeof q === 'object' && !Array.isArray(q)) {
      q.walletId = this.walletId;
      return await this.db.fetchAddressBy(q);
    } else {
      this.debug('Argument is expected to be an object');
      return false;
    }
  }
  async updateBalance(amount, confirmed = true) {
    await this.db.updateBalance(this.walletId, amount, confirmed);
    return true;
  }
  async addressExist(address) {
    if (!Array.isArray(address)) {
      address = [address];
    }
    return this.db.fetchBatchAddress(this.walletId, address);
  }
  async addTx(tx) {
    tx.walletId = this.walletId;
    if (!tx.id || typeof tx.isPending === 'undefined') {
      this.debug('Missing arguments either tx.id or tx.isPending');
      return false;
    }
    return await this.db.storeTx(tx);
  }
  async updateTx(tx) {
    tx.walletId = this.walletId;
    return await this.db.updateTx(tx);
  }
  async removeTx(txid) {
    return await this.db.removeTx(this.walletId, txid);
  }
  async getUtxo() {
    return await this.db.fetchPendingTxs(this.walletId);
  }
  async getUspentTx() {
    return await this.db.fetchUnspentTxs(this.walletId);
  }
  async getTxo(limit = 10) {
    return await this.db.fetchTxs(this.walletId, limit);
  }
  async insertBlock(blockid) {
    if (!blockid || Number.isNaN(parseInt(blockid))) {
      this.debug('Blockid is required and must be a number');
      return false;
    }
    await this.db.storeBlock(this.walletId, parseInt(blockid));
    return true;
  }
  async getBlock() {
    return await this.db.fetchBlock(this.walletId);
  }
  async close() {
    this.debug('Database is shutting down');
    delete instances[this.walletId];
    await this.db.disconnect();
  }

  gracefulShutdown() {
    process.stdin.resume();
    process.on('unhandledRejection', async (reason, p) => {
      this.debug('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
      await this.db.disconnect();
      process.exit();
    });
    process.on('SIGINT', async () => {
      this.debug('Database is shutting down');
      await this.db.disconnect();
      process.exit();
    });
  }
}

async function _init(wallet, logger = false) {
  assert(typeof wallet === 'object', 'First argument is expected to be a object');
  if (instances[wallet.id]) {
    return instances[wallet.id];
  }
  const log = debug(logger);
  log('CoinDb starting...');
  const mongodb = await MongoDb.open(log);
  const w = {
    id: wallet.id,
    name: wallet.name,
    confirmed_balance: wallet.balance || 0,
    unconfirmed_balance: wallet.ubalance || 0,
    bip44: wallet.bip44
  };
  const checkwallet = await mongodb.fetchWallet(wallet.id);
  if (!checkwallet) {
    await mongodb.storeWallet(w);
  }
  log('CoinDb is ready');
  instances[wallet.id] = new CoinDb(mongodb, wallet, log);
  return instances[wallet.id];
}

module.exports = _init;
