const CoinDb = require('../');
const _ = require('lodash');
const wallet = { id: 'btctest', name: 'bitcointest', confirmed_balance: 0, unconfirmed_balance: 0, bip44: 0 };
const wallet2 = { id: 'bursttest', name: 'bursttest', confirmed_balance: 0, unconfirmed_balance: 0, bip44: 21 };

async function getInstance(w) {
  return await CoinDb(w);
}
test('getWallet', async () => {
  expect.assertions(1);
  const coindb = await getInstance(wallet);
  return coindb.getWallet().then(data => {
    expect(data).toEqual(wallet);
  });
});

test('importAddress1', async () => {
  const coindb = await getInstance(wallet);
  return coindb.importAddress('1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXX', 1, 4).then(data => {
    expect(data).toBeTruthy;
  });
});
test('getAddress1', async () => {
  expect.assertions(1);
  const coindb = await getInstance(wallet);
  return coindb.getAddress('1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXX').then(data => {
    expect(data).toEqual({
      walletId: 'btctest',
      address: '1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXX',
      accountId: 1,
      index: 4
    });
  });
});
test('importAddress2', async () => {
  const coindb = await getInstance(wallet);
  return coindb.importAddress('1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXL', 2, 4).then(data => {
    expect(data).toBeTruthy;
  });
});
test('getAddress2', async () => {
  expect.assertions(1);
  const coindb = await getInstance(wallet);
  return coindb.getAddress('1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXL').then(data => {
    expect(data).toEqual({
      walletId: 'btctest',
      address: '1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXL',
      accountId: 2,
      index: 4
    });
  });
});
test('getAddresses', async () => {
  expect.assertions(1);
  const coindb = await getInstance(wallet);
  return coindb.getAddresses().then(data => {
    expect(data).toEqual([{
      walletId: 'btctest',
      address: '1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXL',
      accountId: 2,
      index: 4
    }, {
      walletId: 'btctest',
      address: '1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXX',
      accountId: 1,
      index: 4
    }]);
  });
});

test('newWallet', async () => {
  expect.assertions(1);
  const coindb = await getInstance(wallet2);
  return coindb.getWallet().then(data => {
    expect(data).toEqual(wallet2);
  });
});
test('newimportAddress1', async () => {
  const coindb = await getInstance(wallet2);
  return coindb.importAddress('BURST-1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXX', 1, 4).then(data => {
    expect(data).toBeTruthy;
  });
});
test('newgetAddress1', async () => {
  expect.assertions(1);
  const coindb = await getInstance(wallet2);
  return coindb.getAddress('BURST-1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXX').then(data => {
    expect(data).toEqual({
      walletId: 'bursttest',
      address: 'BURST-1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXX',
      accountId: 1,
      index: 4
    });
  });
});
test('newimportAddress2', async () => {
  const coindb = await getInstance(wallet2);
  return coindb.importAddress('BURST-1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXL', 2, 4).then(data => {
    expect(data).toBeTruthy;
  });
});
test('newgetAddress2', async () => {
  expect.assertions(1);
  const coindb = await getInstance(wallet2);
  return coindb.getAddress('BURST-1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXL').then(data => {
    expect(data).toEqual({
      walletId: 'bursttest',
      address: 'BURST-1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXL',
      accountId: 2,
      index: 4
    });
  });
});
test('newgetAddresses', async () => {
  expect.assertions(1);
  const coindb = await getInstance(wallet2);
  return coindb.getAddresses().then(data => {
    expect(data).toEqual([{
      walletId: 'bursttest',
      address: 'BURST-1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXL',
      accountId: 2,
      index: 4
    }, {
      walletId: 'bursttest',
      address: 'BURST-1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXX',
      accountId: 1,
      index: 4
    }]);
  });
});
test('getAddressBy', async () => {
  const coindb = await getInstance(wallet);
  return coindb.getAddressBy({ accountId: 2 }).then(data => {
    expect(data).toEqual([{
      walletId: 'btctest',
      address: '1UniBRgb1QYyvMmm6VMFyutZfPoZgPUXL',
      accountId: 2,
      index: 4
    }]);
  });
});
test('updateBalance', async () => {
  expect.assertions(1);
  const coindb = await getInstance(wallet);
  await coindb.updateBalance(10);
  return coindb.getWallet().then(data => {
    expect(data).toEqual({ id: 'btctest', name: 'bitcointest', confirmed_balance: 10, unconfirmed_balance: 0, bip44: 0 });
  });
});

test('deleteWallet1', async () => {
  const coindb = await getInstance(wallet);

  return coindb.deleteWallet(true).then(data => {
    expect(data).toBeTruthy;
  });
});
test('deleteWallet1', async () => {
  const coindb = await getInstance(wallet2);

  return coindb.deleteWallet(true).then(data => {
    expect(data).toBeTruthy;
  });
});
test('getWallet1', async () => {
  const coindb = await getInstance(wallet);
  return coindb.getWallet().then(data => {
    expect(data).toBeFalsy;
  });
});

test('getWallet2', async () => {
  const coindb = await getInstance(wallet2);
  return coindb.getWallet().then(data => {
    expect(data).toBeFalsy;
  });
});
