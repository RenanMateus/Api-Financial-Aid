'use strict'

const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const env = require('dotenv').config({path:'./config/.env'}).parsed;
//const port = process.env.PORT || env.portServer;
const port = 3000;
const app = express();
const auth = require('./src/app/service/auth');

const http = require('http').createServer(app)

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

//CONTROLLERS
const authRoter = require('./src/app/user/auth.controller')();
const userRoter = require('./src/app/user/user.controller')();
const partnerRouter = require('./src/app/configuracoes/partners/partner.controller')();
const categoryRouter = require('./src/app/configuracoes/category/category.controller')();
const centerRouter = require('./src/app/configuracoes/centers/center.controller')();
const accountRouter = require('./src/app/account/account.controller')();
const billRouter = require('./src/app/bills/bill.controller')();
const conciliationRouter = require('./src/app/conciliation/conciliation.controller')();
const procedureRouter = require('./src/app/service/cep')();
const flowRouter = require('./src/app/flow/flow.controller')();
const dashboardRouter = require('./src/app/dashboard/dashboard.controller')();
const UploadBillRouter = require('./src/app/bills/uploadfilebill.controller')();
const UploadTransactionRouter = require('./src/app/account/uploadfiletransaction.controller')();

//ROUTERS
app.use('/api/v1', authRoter);
app.use('/api/v1', userRoter);
app.use('/api/v1', partnerRouter);
app.use('/api/v1', categoryRouter);
app.use('/api/v1', centerRouter);
app.use('/api/v1', accountRouter);
app.use('/api/v1', billRouter);
app.use('/api/v1', conciliationRouter);
app.use('/api/v1', procedureRouter);
app.use('/api/v1', flowRouter);
app.use('/api/v1', dashboardRouter);
app.use('/api/v1', UploadBillRouter);
app.use('/api/v1', UploadTransactionRouter);


//DATABASE
mongoose.Promise = global.Promise;
mongoose.Error.messages.Number.min = "O '{VALUE}' informado é menor que o limite mínimo de '{MIN}'. "
mongoose.Error.messages.Number.max = "O '{VALUE}' informado é maior que o limite máximo de '{MAX}'. "
mongoose.Error.messages.String.enum = "O '{VALUE}' não é válido para o atributo '{PATH}'. "

// useMongoClient: true
mongoose.connect(`mongodb://localhost/financial_aid`,  (erro, res) => {
    if (erro) throw erro;
    else {
        console.log('Base de Dados conectada!');
        http.listen(3000, () => console.log('Executando na porta: ' + 3000));
    }
})
