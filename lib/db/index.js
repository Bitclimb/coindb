const { MongoClient } = require('mongodb');
const _ = require('lodash');
const dburl = 'mongodb://localhost:27017';
let mdb;
class MongoDb {
  constructor(db, client) {
    this.collections = {
      WALLETS: 'wallets',
      TXS: 'txs',
      TXS_LIST: 'txs_list',
      ADDRESSES: 'addresses',
      BLOCK: 'block'
    };
    this.client = client;
    this.db = db;
    this._createIndexes();
  }

  async _createIndexes() {
    await this.db.collection(this.collections.WALLETS).createIndex({
      id: 1
    });
    await this.db.collection(this.collections.TXS).createIndex({
      walletId: 1,
      id: 1
    });
    await this.db.collection(this.collections.TXS).createIndex({
      walletId: 1,
      isPending: 1,
      txid: 1
    });
    await this.db.collection(this.collections.TXS).createIndex({
      walletId: 1,
      createdOn: -1
    });
    await this.db.collection(this.collections.TXS).createIndex({
      txid: 1
    });
    await this.db.collection(this.collections.TXS_LIST).createIndex({
      walletId: 1,
      txid: 1
    });
    await this.db.collection(this.collections.ADDRESSES).createIndex({
      walletId: 1
    });
    await this.db.collection(this.collections.ADDRESSES).createIndex({
      address: 1
    });
    await this.db.collection(this.collections.ADDRESSES).createIndex({
      walletId: 1,
      address: 1
    });
    await this.db.collection(this.collections.ADDRESSES).createIndex({
      address: 1,
      accountId: 1
    });
    await this.db.collection(this.collections.BLOCK).createIndex({
      walletId: 1
    });
  }

  async disconnect() {
    try {
      await this.client.close();
      return true;
    } catch (e) {
      throw e;
    }
  }
  async storeBlock(wid, bid) {
    const pl = {
      walletId: wid,
      blockId: bid
    };
    return await this.db.collection(this.collections.BLOCK).updateOne({ walletId: wid }, { $set: pl }, { upsert: true, w: 1 });
  }
  async fetchBlock(wid) {
    return await this.db.collection(this.collections.BLOCK).findOne({ walletId: wid }, { fields: { _id: 0 } });
  }
  async fetchWallet(walletid) {
    return await this.db.collection(this.collections.WALLETS).findOne({ id: walletid }, { fields: { _id: 0 } });
  }
  async storeWallet(wallet) {
    return await this.db.collection(this.collections.WALLETS).insertOne(wallet);
  }
  async storeAddress(address) {
    return await this.db.collection(this.collections.ADDRESSES).insertOne(address);
  }
  async countAddresses(wid) {
    return await this.db.collection(this.collections.ADDRESSES).find({ walletId: wid }).count();
  }
  async storeAddresses(wid, addresses) {
    let addr = await this.fetchAddressByWalletId(wid);
    const origlen = addresses.length;
    addr = addr.map(y => y.address);
    addresses = addresses.filter(y => !addr.includes(y.address));
    const dupes = origlen - addresses.length;
    await this.db.collection(this.collections.ADDRESSES).insertMany(addresses);
    return { imported: addresses.length, dupes };
  }
  async fetchAddress(wid, addr) {
    return await this.db.collection(this.collections.ADDRESSES).findOne({
      walletId: wid,
      address: addr
    }, { fields: { _id: 0 } });
  }
  async fetchBatchAddress(wid, addr) {
    return await this.db.collection(this.collections.ADDRESSES).find({
      walletId: wid,
      address: { $in: addr }
    }, { fields: { _id: 0 } }).toArray();
  }
  async deleteWallet(wid) {
    await this.db.collection(this.collections.ADDRESSES).deleteMany({ walletId: wid });
    await this.db.collection(this.collections.TXS).deleteMany({ walletId: wid });
    await this.db.collection(this.collections.BLOCK).deleteMany({ walletId: wid });
    return await this.db.collection(this.collections.WALLETS).deleteOne({ id: wid });
  }
  async removeAddress(wid, addr) {
    return await this.db.collection(this.collections.ADDRESSES).deleteOne({ walletId: wid, address: addr });
  }
  async fetchAddressByWalletId(wid) {
    return await this.db.collection(this.collections.ADDRESSES).find({
      walletId: wid
    }, { fields: { _id: 0 } }).toArray();
  }

  async fetchAddressBy(q) {
    return await this.db.collection(this.collections.ADDRESSES).find(q, { fields: { _id: 0 } }).toArray();
  }
  async updateBalance(wid, amt, conf) {
    let p;
    if (conf) {
      p = { confirmed_balance: amt };
    } else {
      p = { unconfirmed_balance: amt };
    }
    return await this.db.collection(this.collections.WALLETS).updateOne({ id: wid }, { $inc: p });
  }
  async fetchTxs(wid, limit) {
    return await this.db.collection(this.collections.TXS_LIST).find({ walletId: wid }, { fields: { _id: 0 } }).limit(limit).toArray();
  }
  async fetchPendingTxs(walletId) {
    return await this.db.collection(this.collections.TXS).find({
      walletId,
      isPending: true
    }, { fields: { _id: 0 } }).sort({
      createdOn: -1
    }).toArray();
  }
  async fetchUnspentTxs(walletId) {
    return await this.db.collection(this.collections.TXS).find({
      walletId
    }, { fields: { _id: 0 } }).toArray();
  }
  async storeTx(tx) {
    const txslist = await this.db.collection(this.collections.TXS_LIST).find({ walletId: tx.walletId, txid: tx.id }, { fields: { _id: 0 } }).toArray();
    if (txslist.length > 0) {
            // tx already exists
      return;
    }
    await this.db.collection(this.collections.TXS).updateOne({ id: tx.id }, { $set: tx }, { upsert: true, w: 1 });
    await this.db.collection(this.collections.TXS_LIST).insertOne({ walletId: tx.walletId, txid: tx.id });
    const utxos = await this.fetchPendingTxs(tx.walletId);
    let unconfbal = 0;
    for (const arr of utxos) {
      for (const v of arr.vout) {
        Object.values(v).forEach(o => {
          unconfbal += o;
        });
      }
    }
    return await this.db.collection(this.collections.WALLETS).updateOne({ id: tx.walletId }, { $set: { unconfirmed_balance: unconfbal } });
  }
  async updateTx(tx) {
    return await this.db.collection(this.collections.TXS).updateOne({ id: tx.id, walletId: tx.walletId }, { $set: { isPending: tx.isPending } });
  }
  async removeTx(wid, txid) {
    return await this.db.collection(this.collections.TXS).findAndRemove({
      id: txid,
      walletId: wid
    }, { w: 1 });
  }
}

MongoDb.open = async (log) => {
  if (mdb) {
    log('An open database is found, return this instead');
    return mdb;
  }
  let client;
  try {
    log('Connecting to database...');
    client = await MongoClient.connect(dburl);
    log('Database connected');
    const db = client.db('coindb');
    mdb = new MongoDb(db, client);
    return mdb;
  } catch (err) {
    client.close();
    throw err;
  }
};
module.exports = MongoDb;
