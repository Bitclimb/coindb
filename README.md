# coindb (under development)

A simple crypto-coin data storage.

It only stores **addresses and transactions**.

# Requirement

- Nodejs v8+
- MongoDb 3.x listening on localhost:27017

# Install

```js
npm install coindb --save
```

# Usage

All Api endpoints returns a *Promise*

```js
const CoinDb = require('coindb');

(async () => {
 	const coindb = await CoinDb({ id: 'bitcoin', name: 'btc', bip44: 1 });
    const getwallet = await coindb.getWallet();
    console.log(getwallet);
    //prints { id: 'bitcoin', name: 'btc', bip44: 1 }
    await coindb.importAddress('1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXX', 1, 4);
    const address = await coindb.getAddress('1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXX');
    consle.log(address)
    //prints { walletId: 'bitcoinner',  address: '1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXL',  accountId: 1,  index: 4 }
})()
```
# Test
```js
npm test
```
# Debug
By default, Coindb stores current process log at `process.env.HOME + '/.coindb'`. Log files gets overwritten every start instance.
To output logs on your console, initiate the CoinDb with a additional `true` flag.
```js
const coindb = await CoinDb({ id: 'bitcoin', name: 'btc', bip44: 1 },true);
```
# Api
TODO: Add more description for each endpoint
##### getWallet
##### deleteWallet | deleteWallet(true)
##### importAddress(address,accountid,index)
##### removeAddress(address)
##### getAddress(address)
##### getAddresses
##### getAddressBy(query `Object`)
##### updateBalance(amount) | updateBalance(amount,`Boolean`) - default: true(confirmed), false(unconfirmed)
##### addressExist([address1,address2,...]) 
##### addTx(tx `Object`)
##### updateTx(tx `Object`)
##### removeTx(tx `Object`)
##### getUtxo
##### getTxo
##### close