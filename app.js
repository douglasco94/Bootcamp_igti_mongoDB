import express from 'express';
import mongoose from 'mongoose';

import { accountRouter } from './routes/accountRouter.js';

(async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://dbAgenda:admin@cluster0.wk3aw.mongodb.net/myBank?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Conectado com sucesso!');
  } catch (err) {
    console.log('Erro ao conectar no Mongo DB Atlas' + err);
  }
})();

const app = express();

app.use(express.json());
app.use(accountRouter);

app.listen(3000, () => console.log('API Iniciada'));
