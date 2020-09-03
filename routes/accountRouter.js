import express from 'express';
import { accountModel } from '../models/accountModel.js';

const app = express();

app.get('/account', async (req, res) => {
  try {
    const account = await accountModel.find({});
    res.send(account);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/account', async (req, res) => {
  try {
    const account = new accountModel(req.body);

    await account.save();
    res.send(account);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.patch('/account/deposit', async (req, res) => {
  try {
    const { agencia, conta, balance } = req.body;

    if (!agencia || !conta || !balance) {
      return res.status(400).send(error);
    }

    const findAccount = await accountModel.findOne({ agencia, conta });

    if (!findAccount) {
      res.status(400).send(error);
    }

    findAccount.balance = findAccount.balance + balance;

    await findAccount.save();

    res.send(findAccount);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.patch('/account/withdraw', async (req, res) => {
  try {
    const { agencia, conta, balance } = req.body;

    if (!agencia || !conta || !balance) {
      return res.status(400).send(error);
    }

    const findAccount = await accountModel.findOne({ agencia, conta });

    if (!findAccount) {
      res.status(400).send(error);
    }

    let newBalance = findAccount.balance - balance - 1;

    if (newBalance < 0) {
      res.status(400).json({ error: 'Saldo insufiencte.' });
      //throw new Error('Saldo insuficiente.');
    }

    findAccount.balance = newBalance;

    await findAccount.save();

    res.send(findAccount);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/account/query', async (req, res) => {
  try {
    const { agencia, conta } = req.body;

    if (!agencia || !conta) {
      res
        .status(400)
        .json({ error: 'É necessário as informações de agência e conta' });
    }

    const findAccount = await accountModel.findOne({ agencia, conta });

    if (!findAccount) {
      res.status(400).json({ error: 'Agência ou conta não encontrada.' });
    }

    res.status(200).json({ balance: findAccount.balance });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/account/delete', async (req, res) => {
  try {
    const { agencia, conta } = req.body;

    if (!agencia || !conta) {
      res
        .status(400)
        .json({ error: 'É necessário as informações de agência e conta' });
    }

    await accountModel.findOneAndDelete({ agencia, conta });

    const activeAccounts = await accountModel.find({ agencia });

    res.status(200).json(activeAccounts);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.patch('/account/transfer', async (req, res) => {
  try {
    const { contaOrigem, contaDestino, valor } = req.body;

    if (!contaOrigem || !contaDestino || !valor) {
      return res.status(400).send(error);
    }

    const findAccountSource = await accountModel.findOne({
      conta: contaOrigem,
    });
    const findAccountDestiny = await accountModel.findOne({
      conta: contaDestino,
    });

    if (findAccountSource.agencia !== findAccountDestiny.agencia) {
      findAccountSource.balance -= 8;
    }

    findAccountSource.balance -= valor;
    findAccountDestiny.balance += valor;

    await findAccountSource.save();
    await findAccountDestiny.save();

    res.send(findAccountSource);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/account/average', async (req, res) => {
  try {
    const { agencia } = req.body;

    if (!agencia) {
      res
        .status(400)
        .json({ error: 'É necessário a informação do número da agência' });
    }

    const findAccounts = await accountModel.aggregate([
      { $match: { agencia: Number(agencia) } },
      { $group: { _id: '$agencia', avgBalance: { $avg: '$balance' } } },
    ]);

    if (findAccounts.length === 0) {
      res
        .status(400)
        .json({ error: 'Nenhuma conta encontrada para esta agência' });
    }

    res.status(200).json(findAccounts);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/account/lowesBalance', async (req, res) => {
  try {
    const { limit } = req.body;

    if (!limit) {
      res
        .status(400)
        .json({ error: 'É necessário a informação do número da agência' });
    }

    const findAccounts = await accountModel
      .aggregate([{ $sort: { balance: 1 } }])
      .limit(Number(limit));

    res.status(200).json(findAccounts);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/account/topBalance', async (req, res) => {
  try {
    const { limit } = req.body;

    if (!limit) {
      res
        .status(400)
        .json({ error: 'É necessário a informação do número da agência' });
    }

    const findAccounts = await accountModel
      .aggregate([{ $sort: { balance: -1 } }])
      .limit(Number(limit));

    res.status(200).json(findAccounts);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.patch('/account/transferTopBalances', async (req, res) => {
  try {
    const findAgencies = await accountModel.distinct('agencia');
    let vipAccounts = [];

    for (const agency of findAgencies) {
      const findTopAccount = await accountModel
        .find({ agencia: agency })
        .sort({ balance: -1 })
        .limit(1);

      const { name, balance, conta } = findTopAccount[0];

      const accountExist = await accountModel.findOne({
        agencia: 99,
        conta: Number(conta),
      });

      if (!accountExist) {
        vipAccounts.push({
          agencia: 99,
          name,
          balance,
          conta,
        });
      }
    }

    if (vipAccounts.length > 0) {
      await accountModel.insertMany(vipAccounts);
    }

    const findPrivateAgency = await accountModel.find({ agencia: 99 });

    res.status(200).json(findPrivateAgency);
  } catch (error) {
    res.status(500).send(error);
  }
});

export { app as accountRouter };
