'use strict'

const express = require('express');
const router = express.Router();
const multer = require('multer');
const excel = require('exceljs');
const moment = require('moment-timezone');
const path = require('path');
const fs = require('fs');

const Account = require('./Account');
const Transaction = require('./Transaction');
const User = require('../user/User');
const Category = require('../configuracoes/category/Category');
const Center = require('../configuracoes/centers/Center');
const Partner = require('../configuracoes/partners/Partner');
const paginate = require('mongoose-pagination');
const Busca = require('../service/search');
const auth = require('../service/auth');


function accountRouter() {

  router.post('/account', auth, async (req, res) => {
      try {
          const { 
              name,
              type,
              bank,
              agency,
              accountNumber
          } = req.body;
          
          const _user = req.payload.id;

          if (await Account.findOne({name:name, _owner:_user}) || (await Account.findOne({bank:bank, agency:agency, accountNumber:accountNumber, _owner:_user}) && type=='Conta Corrente'))
              return res.status(409).send({ error: { message: 'Conta já cadastrada!' } });
          
          let account = new Account();
          account._owner = _user;
          account.name = name;
          account.type = type;
          switch (type) {
              case 'Conta Corrente':
                  account.bank = bank;
                  account.agency = agency;
                  account.accountNumber = accountNumber;
                  break;
              case 'Dinheiro':
              case 'Investimento':
                  break;
              default:
                  return res.status(400).send({ error: { message: 'BAD REQUEST' } });
          }
          
          account = await account.save();

          return res.status(201).send(account);
      } catch (err) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.put('/account/:id', auth, async (req, res) => {
      try {
          const { 
              name,
              type,
              bank,
              agency,
              accountNumber,
              balance
          } = req.body;
          
          const _user = req.payload.id;
          //Testa repeticao do Nome
          var registered = await Account.findOne({name:name, _owner:_user});
          
          if(registered && registered._id != req.params.id)
              return res.status(409).send({ error: { message: 'Conta já cadastrada!' } });

          //Testa repeticao de numero da conta, agencia e banco
          registered = await Account.findOne({bank:bank, agency:agency, accountNumber:accountNumber, _owner:_user});

          if(registered && registered._id != req.params.id && type=='Conta Corrente')
              return res.status(409).send({ error: { message: 'Conta já cadastrada!' } });

          const account = await Account.findByIdAndUpdate(req.params.id, {
              name,
              type,
              bank,
              agency,
              accountNumber,
              balance
          }, { new: true });

          return res.send(account);
      } catch (err) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.get('/account/:id', auth, async (req, res) => {
      try {
          const _user = req.payload.id;

          const account = await Account.findOne({_id:req.params.id, _owner:_user});
          if (!account)
              return res.status(404).send({ error: { message: 'Erro ao buscar conta' } });
          return res.status(200).send(account);
      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.get('/accounts/:page?', auth, async (req, res) => {

      try{
          const page = parseInt(req.params.page, 10) || 1;
          const limit = parseInt(req.query.limit, 10) || 20;

          const _user = req.payload.id;

          await Account.find({_owner:_user}, 'name type bank agency accountNumber balance').sort('name').paginate(page, limit, (error, result, total) => {
              if (error) {
                  return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
              }    
              const docs = {
                  result: result,
                  total,
                  page,
                  pages: Math.ceil(total / limit)
              }
              return res.status(200).send(docs);
          });


      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.delete('/account/:id', auth, async (req, res) => {
      try {
          Account.findOne({_id:req.params.id, _owner:req.payload.id}, async (err, account) => {
              if(err)
                  return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
              if(!account)
                  return res.status(204).send({ error: { message: 'Conta não cadastrada' } });
              
                  await Transaction.remove({_account:req.params.id});
                  await Account.findByIdAndRemove(account._id);

              res.status(200).send({result: {message: 'Conta Apagada'}});
          });
          
      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.get('/account-search/:page?', auth, async (req, res) => {
      try {
          var text = req.query.text || "";
          const page = parseInt(req.params.page, 10) || 1;
          const limit = parseInt(req.query.limit, 10) || 20;
          
          const _user = req.payload.id;
          var consulta = {_owner:_user};

          if(text!=""){
              consulta.$text = { $search: text};
          }

          Account.find(consulta).sort('name').paginate(page, limit, (error, result , total) =>{
              if(error)
                  res.send(error);
              else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
          });
      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.post('/posting/:id', auth, async (req, res) => {
      try {
          const { 
              credit,
              value,
              description,
              date,
              _category,
              docNumber,
              _partner,
              _center,
              month
          } = req.body;

          const _user = req.payload.id;
          const _account = req.params.id;

          var account = await Account.findOne({_id:_account, _owner:_user});

          if(value<=0){
              return res.status(400).send({ error: { message: 'Valor da transação inválido' } });
          }

          var signal = 0;
          
          if(credit){
              signal = 1;
          }else{
              signal = -1;
          }
          
          account.balance = (account.balance + signal*value).toFixed(2); 
          var _owner = _user;
          var transaction = new Transaction({
              _owner,
              _account,
              credit,
              value,
              description,
              date,
              _category,
              docNumber,
              _partner,
              _center,
              month
          });

          transaction.save( (errSav, transactionResult) => {
              if (errSav){
                  return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
              }
              
              account.save();                                        

              return res.status(201).send(transaction);
          });
          
      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.put('/posting/:id/:tranid', auth, async(req, res) => {
      try {
          const {
              credit,
              value,
              description,
              date,
              _category,
              docNumber,
              _partner,
              _center,
              month
          } = req.body;

          const _user = req.payload.id;

          var transaction = new Transaction();
          transaction._owner = _user;
          transaction._id = req.params.tranid
          transaction.credit = credit;
          transaction.value = value;
          transaction.description = description;
          transaction.date = date;
          transaction._category = _category;
          transaction.docNumber = docNumber;
          transaction._partner = _partner;
          transaction._center = _center;
          transaction.month = month; 
          transaction._account = req.params.id;

          Transaction.findOneAndUpdate({_id:transaction._id, _owner:_user}, transaction, async (err, transactionResult) => {
              if (err){
                  return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
              }
              if(transactionResult){
                  Account.findOne({_id:transaction._account, _owner:_user}, async (errAcc, account) => {
                      if (errAcc){
                          return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
                      }
                      if(account){
                          var signal = 0;
                          var credit = transactionResult.credit;
                          var value = transactionResult.value;
                          
                          if(credit){
                              signal = -1;
                          }else{
                              signal = 1;
                          }
                                  
                          account.balance = (account.balance + signal*value).toFixed(2); 
                          
                          credit = transaction.credit;
                          value = transaction.value;

                          if(credit){
                              signal = 1;
                          }else{
                              signal = -1;
                          }
                                  
                          account.balance = (account.balance + signal*value).toFixed(2); 
                          await account.save();
                      }
                  });
                  return res.status(200).send(transaction);
              }else{
                  return res.status(204).send({ error: { message: 'Transação não encontrada' } });
              }
          });
      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.get('/posting/:tranid', auth, async(req,res) => {
      try {
          const _user = req.payload.id;
          const transaction = await Transaction.findOne({_id:req.params.tranid, _owner:_user}).populate('_category _center _partner _account');
          if (!transaction)
              return res.status(404).send({ error: { message: 'Erro ao buscar transação' } });
          return res.status(200).send(transaction);
      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.get('/account-extra/:id', auth, async(req, res) => {
      try {
          const _account = req.params.id;

          const _user = req.payload.id;

          var result = await Transaction.find({_account:_account, _owner:_user}).sort({date:-1});

          return res.status(200).send({
              qtdTransactions: result.length,
              lastTransaction: result[0].date
          });

      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.get('/postings/:_account/:page?', auth, async(req, res) => {
          try {

          const _user = req.payload.id;

          const page = parseInt(req.params.page, 10) || 1;
          const limit = parseInt(req.query.limit, 10) || 20;

          const _account = req.params._account;

          Transaction.find({_account:_account, _owner:_user}).populate('_category _center _partner _account').sort('date').paginate(page, limit, (error, result, total) => {
              if (error) {
                  return res.status(500).send({ error: { message: 'Erro interno do servidor' } });
              }    
              const docs = {
                  result: result,
                  total,
                  page,
                  pages: Math.ceil(total / limit)
              }
              return res.status(200).send(docs);
          });


      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.delete('/posting/:id/:tranid', auth, async(req, res) => {
      try {
          const _user = req.payload.id;
          const id = req.params.id;
          const tranid = req.params.tranid;

          var account = await Account.findOne({_id:id, _owner:_user});
          var transaction = await Transaction.findOne({_id:tranid, _owner:_user});
          var signal = 1;

          if(transaction.credit){
              signal = -1;
          }else{
              signal = 1;
          }

          account.balance = account.balance + signal*transaction.value;

          await Account.findByIdAndUpdate(account._id, account);
          await Transaction.findByIdAndRemove(tranid);
          return res.status(200).send(account);        
      
      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  router.get('/posting-search/:page?', auth, async (req, res) => {
      try {
          const _user = req.payload.id;
          var text = req.query.text || undefined;
          var page = parseInt(req.params.page) || 1;
          var limit = parseInt(req.query.limit) || 10;
          const credit = req.query.credit || undefined;
          const start = new Date (req.query.start);
          const end = new Date (req.query.end);
          const conciliation = req.query.conciliation || false;
          const _account = req.query._account || null;
          var consulta = {};

          if(text){
              if(credit == undefined){
                  if(conciliation){
                      if(_account !=null){
                          consulta = {date: {$gte:start, $lte:end}, $text: { $search: text }, _conciliation:null, _account:_account, _owner:_user }
                      }else{
                          consulta = {date: {$gte:start, $lte:end}, $text: { $search: text }, _conciliation:null, _owner:_user }
                      }
                  }else{
                      if(_account !=null){
                          consulta = {date: {$gte:start, $lte:end}, $text: { $search: text }, _account:_account, _owner:_user }
                      }else{
                          consulta = {date: {$gte:start, $lte:end}, $text: { $search: text }, _owner:_user}
                      }
                  }
              }else{
                  if(conciliation){
                      if(_account !=null){
                          consulta = {date: {$gte:start, $lte:end}, credit:credit, $text: { $search: text }, _conciliation:null, _account:_account, _owner:_user }
                      }else{
                          consulta = {date: {$gte:start, $lte:end}, credit:credit, $text: { $search: text }, _conciliation:null, _owner:_user}
                      }
                  }else{
                      if(_account !=null){
                          consulta = {date: {$gte:start, $lte:end}, credit:credit, $text: { $search: text }, _account:_account, _owner:_user }
                      }else{
                          consulta = {date: {$gte:start, $lte:end}, credit:credit, $text: { $search: text }, _owner:_user }
                      }
                  }
              }
  

              Transaction.find( consulta ).populate('_category _center _partner _account').sort({date:-1}).paginate(page, limit,  (error, result , total) =>{
                  if(error)
                      res.send(error);
                  else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
              });
          }else{

              if(credit == undefined){
                  if(conciliation){
                      if(_account !=null){
                          consulta = {date: {$gte:start, $lte:end}, _conciliation:null, _owner:_user, _account:_account }
                      }else{
                          consulta = {date: {$gte:start, $lte:end}, _conciliation:null, _owner:_user }
                      }
                  }else{
                      if(_account!=null){
                          consulta = {date: {$gte:start, $lte:end}, _owner:_user, _account:_account }
                      }else{
                          consulta = {date: {$gte:start, $lte:end}, _owner:_user }
                      }
                  }
              }else{
                  if(conciliation){
                      if(_account!=null){
                          consulta = {date: {$gte:start, $lte:end}, credit:credit, _conciliation:null, _owner:_user, _account:_account }
                      }else{
                          consulta = {date: {$gte:start, $lte:end}, credit:credit, _conciliation:null, _owner:_user}
                      }
                  }else{
                      if(_account!=null){
                          consulta = {date: {$gte:start, $lte:end}, credit:credit, _owner:_user, _account:_account }
                      }else{
                          consulta = {date: {$gte:start, $lte:end}, credit:credit, _owner:_user}
                      }
                  }
              }


              Transaction.find(consulta).populate('_category _center _partner _account').sort({date:-1}).paginate(page, limit, (error, result , total) =>{
                  if(error)
                      res.send(error);
                  else return res.status(200).send({total:total, page:page, pages: Math.ceil(total/limit),  result});
              });
          }
      } catch (error) {
          return res.status(400).send({ error: { message: 'BAD REQUEST' } });
      }
  });

  // Upload de Arquivo excel

  const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, path.resolve("uploads", "temp"));
      },
      filename: function(req, file, cb) {
      cb(null, "transactions.xlsx");
    }
  });
  
  const upload = multer({	storage: storage }).single('excelFile');

  router.post('/import-trasactions/:account', auth, async (req, res) => {
    try {
      const _user = req.payload.id;
      const account = await Account.findById(req.params.account);
      let balance = account.balance;
      const inboundWorkbook = new excel.Workbook();

      await upload(req, res, async (error) => {
        inboundWorkbook.xlsx.readFile(req.file.path).then(async (xlsxFile) => {
          const inboundWorksheet = await xlsxFile.getWorksheet(1);

          inboundWorksheet.eachRow(async function(row, rowNumber) {
            const transaction = {};

            if (rowNumber > 1) {
              transaction._owner = _user;
              transaction._account = account._id;
              if ( (row.getCell(1).value === "credito") || (row.getCell(1).value === "Credito") || 
                 (row.getCell(1).value === "crédito") || (row.getCell(1).value === "Crédito" ) || 
                 (row.getCell(1).value === "CREDITO") || (row.getCell(1).value === "CRÉDITO") ) {
                    transaction.credit = true;      
              } else transaction.credit = false;
              //transaction.credit = row.getCell(1).value === "credito" ? true : false;
              transaction.value = new Number(row.getCell(2).value);
              transaction.description = row.getCell(3).value;
              transaction.date = moment(row.getCell(4).value).add(1, 'days');
              transaction.docNumber = row.getCell(5).value;
              transaction.month = row.getCell(6).value;

              if (transaction.credit) {
                balance += transaction.value;
              } else {
                balance -= transaction.value;
              }

              const newTransaction = await Transaction.create(transaction);
              console.log(newTransaction);
            }
          });

          await Account.findByIdAndUpdate(account._id, { $set: { balance }});

          fs.unlink(req.file.path);
        });
      });
      
      res.status(200).send({ message: 'Transações criadas com sucesso!' });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: 'Erro ao carregar arquivo, tente novamente.' });
    }
  });

  // ROTA PARA MOSTRAR O EXEMPLO DE IMPORTAÇÃO PELO EXCEL
	router.get('/exemple/:id', auth, async (req, res) => {
		try {			
			return res.sendFile(path.resolve('./uploads/exemplo_excel.png' ));
		} catch (error) {
			return res.status(500).send({ message: 'Erro ao carregar exemplo!' });
		}
    });
    
    // ROTA PARA DOWNLOAD DO MODELO DO EXCEL
	router.get('/download/:id', auth, async (req, res) => {
		try {			
			return res.sendFile(path.resolve('./uploads/modelo.xlsx' ));
		} catch (error) {
			return res.status(500).send({ message: 'Erro ao baixar modelo!' });
		}
	});


  return router;
};

module.exports = accountRouter;
