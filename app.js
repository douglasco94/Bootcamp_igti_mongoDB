/*Imports*/

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { accountRouter } from './routes/accountRouter.js';

const app = express();

dotenv.config();

/*Conexão com mongoDB */
(async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://
        {$process.env.USERDB} 
        :
        {$process.env.PWDDB}
        @cluster0.wk3aw.mongodb.net/myBank?retryWrites=true&w=majority`,
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

app.use(express.json());
app.use(accountRouter);

app.listen(process.env.PORT, () => console.log('API Iniciada'));
