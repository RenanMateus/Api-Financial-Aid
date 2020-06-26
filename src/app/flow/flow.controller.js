'use strict'

const Account = require('../account/Account');
const Transaction = require('../account/Transaction');
const Bill = require('../bills/Bill');
const Category = require('../configuracoes/category/Category');
const Center = require('../configuracoes/centers/Center');
const Partner = require('../configuracoes/partners/Partner');
const Conciliation = require('../conciliation/Conciliation');
const express = require('express');
const router = express.Router();
const paginate = require('mongoose-pagination');
const Busca = require('../service/search');
const auth = require('../service/auth');

function flowRouter() {

    router.get('/flow', auth, async (req, res) => {
        try {
            const _user = req.payload.id;

            const start = new Date(req.query.start);
            var end = new Date(req.query.end);

            var result = [];
            var obj = {
                inicialBalance: 0,
                received: 0,
                payed: 0,
                finalBalance: 0,
                pending: 0
            }
            var today = new Date();
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(0);
            today.setMilliseconds(0);

            if (end < today) {
                var transactions = await Transaction.find({ date: { $lt: start }, _owner: _user }).sort('date');
                transactions.forEach(element => {
                    var signal;
                    if (element.credit) {
                        signal = 1;
                    } else {
                        signal = -1
                    }
                    obj.inicialBalance += element.value * signal;
                });

                var auxDay = new Date(start);
                auxDay.setHours(0);
                auxDay.setMinutes(0);
                auxDay.setSeconds(0);
                auxDay.setMilliseconds(0);
                var bills = [];
                do {


                    auxDay.setDate(start.getDate() + 1);

                    transactions = await Transaction.find({ date: { $gte: start, $lt: auxDay }, _owner: _user });

                    transactions.forEach(element => {
                        if (element.credit) {
                            obj.received += element.value;
                        } else {
                            obj.payed += element.value;
                        }
                    });

                    bills = await Bill.find({ dueDate: { $gte: start, $lt: auxDay }, _owner: _user });

                    bills.forEach(element => {
                        if (element.credit && element._conciliation == null && element.ok) {
                            obj.received += element.value;
                        } else if (!element.credit && element._conciliation == null && element.ok) {
                            obj.payed += element.value;
                        }
                    });

                    obj.finalBalance = obj.inicialBalance - obj.payed + obj.received;

                    result.push({
                        date: start.toISOString(),
                        inicialBalance: obj.inicialBalance,
                        received: obj.received,
                        payed: obj.payed,
                        finalBalance: obj.finalBalance
                    });

                    obj.inicialBalance = obj.finalBalance;
                    obj.received = 0;
                    obj.payed = 0;
                    obj.finalBalance = 0;

                    start.setDate(start.getDate() + 1);

                } while (end >= auxDay);

                return res.status(200).send(result);

            } else if (start < today) {

                var transactions = await Transaction.find({ date: { $lt: start }, _owner: _user }).sort('date');
                transactions.forEach(element => {
                    var signal;
                    if (element.credit) {
                        signal = 1;
                    } else {
                        signal = -1
                    }
                    obj.inicialBalance += element.value * signal;
                });

                var auxDay = new Date(start);
                auxDay.setHours(0);
                auxDay.setMinutes(0);
                auxDay.setSeconds(0);
                auxDay.setMilliseconds(0);
                var bills = [];
                do {


                    auxDay.setDate(start.getDate() + 1);

                    transactions = await Transaction.find({ date: { $gte: start, $lt: auxDay }, _owner: _user });

                    transactions.forEach(element => {
                        if (element.credit) {
                            obj.received += element.value;
                        } else {
                            obj.payed += element.value;
                        }
                    });

                    bills = await Bill.find({ dueDate: { $gte: start, $lt: auxDay }, _owner: _user });

                    bills.forEach(element => {
                        if (element.credit && element._conciliation == null && element.ok) {
                            obj.received += element.value;
                        } else if (!element.credit && element._conciliation == null && element.ok) {
                            obj.payed += element.value;
                        }
                    });

                    obj.finalBalance = obj.inicialBalance - obj.payed + obj.received;

                    result.push({
                        date: start.toISOString(),
                        inicialBalance: obj.inicialBalance,
                        received: obj.received,
                        payed: obj.payed,
                        finalBalance: obj.finalBalance
                    });

                    obj.inicialBalance = obj.finalBalance;
                    obj.received = 0;
                    obj.payed = 0;
                    obj.finalBalance = 0;

                    start.setDate(start.getDate() + 1);

                } while (today > auxDay);


                do {

                    auxDay.setDate(start.getDate() + 1);

                    transactions = await Transaction.find({ date: { $gte: start, $lt: auxDay }, _owner: _user });

                    transactions.forEach(element => {
                        if (element.credit) {
                            obj.received += element.value;
                        } else {
                            obj.payed += element.value;
                        }
                    });

                    bills = await Bill.find({ dueDate: { $gte: start, $lt: auxDay }, _owner: _user });

                    bills.forEach(element => {
                        if (element.credit && element._conciliation == null) {
                            obj.received += element.value;
                        } else if (!element.credit && element._conciliation == null) {
                            obj.payed += element.value;
                        }
                    });

                    obj.finalBalance = obj.inicialBalance - obj.payed + obj.received;

                    result.push({
                        date: start.toISOString(),
                        inicialBalance: obj.inicialBalance,
                        received: obj.received,
                        payed: obj.payed,
                        finalBalance: obj.finalBalance
                    });

                    obj.inicialBalance = obj.finalBalance;
                    obj.received = 0;
                    obj.payed = 0;
                    obj.finalBalance = 0;

                    start.setDate(start.getDate() + 1);

                } while (end >= auxDay);



                return res.status(200).send(result);
            } else {
                var transactions = await Transaction.find({ date: { $lt: start }, _owner: _user });
                transactions.forEach(element => {
                    if (element.credit) {
                        obj.inicialBalance += element.value;
                    } else {
                        obj.inicialBalance -= element.value;
                    }
                });

                var bills = await Bill.find({ dueDate: { $lt: start }, ok: false, _owner: _user });
                bills.forEach(element => {
                    if (element.credit && element._conciliation == null) {
                        obj.received += element.value;
                    } else if (!element.credit && element._conciliation == null) {
                        obj.payed += element.value;
                    }
                });

                var auxDay = new Date(start);
                auxDay.setHours(0);
                auxDay.setMinutes(0);
                auxDay.setSeconds(0);
                auxDay.setMilliseconds(0);

                do {

                    auxDay.setDate(start.getDate() + 1);

                    transactions = await Transaction.find({ date: { $gte: start, $lt: auxDay }, _owner: _user });

                    transactions.forEach(element => {
                        if (element.credit) {
                            obj.received += element.value;
                        } else {
                            obj.payed += element.value;
                        }
                    });

                    bills = await Bill.find({ dueDate: { $gte: start, $lt: auxDay }, _owner: _user });

                    bills.forEach(element => {
                        if (element.credit && element._conciliation == null) {
                            obj.received += element.value;
                        } else if (!element.credit && element._conciliation == null) {
                            obj.payed += element.value;
                        }
                    });

                    obj.finalBalance = obj.inicialBalance - obj.payed + obj.received;

                    result.push({
                        date: start.toISOString(),
                        inicialBalance: obj.inicialBalance,
                        received: obj.received,
                        payed: obj.payed,
                        finalBalance: obj.finalBalance
                    });

                    obj.inicialBalance = obj.finalBalance;
                    obj.received = 0;
                    obj.payed = 0;
                    obj.finalBalance = 0;

                    start.setDate(start.getDate() + 1);

                } while (end >= auxDay);

                return res.status(200).send(result);
            }

        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });

    router.get('/flow-graphic', auth, async (req, res) => {
        try {
            const _user = req.payload.id;

            const start = new Date(req.query.start);
            var end = new Date(req.query.end);

            end.setDate(end.getDate() - 1);

            var result = [];
            var obj = {
                inicialBalance: 0,
                received: 0,
                payed: 0,
                finalBalance: 0,
                pending: 0
            }
            var today = new Date();
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(0);
            today.setMilliseconds(0);

            if (end < today) {
                var transactions = await Transaction.find({ date: { $lt: start }, _owner: _user }).sort('date');
                transactions.forEach(element => {
                    var signal;
                    if (element.credit) {
                        signal = 1;
                    } else {
                        signal = -1
                    }
                    obj.inicialBalance += element.value * signal;
                });

                var auxDay = new Date(start);
                auxDay.setHours(0);
                auxDay.setMinutes(0);
                auxDay.setSeconds(0);
                auxDay.setMilliseconds(0);
                var bills = [];
                do {


                    auxDay.setDate(start.getDate() + 1);

                    transactions = await Transaction.find({ date: { $gte: start, $lt: auxDay }, _owner: _user });

                    transactions.forEach(element => {
                        if (element.credit) {
                            obj.received += element.value;
                        } else {
                            obj.payed += element.value;
                        }
                    });

                    bills = await Bill.find({ dueDate: { $gte: start, $lt: auxDay }, _owner: _user });

                    bills.forEach(element => {
                        if (element.credit && element._conciliation == null && element.ok) {
                            obj.received += element.value;
                        } else if (!element.credit && element._conciliation == null && element.ok) {
                            obj.payed += element.value;
                        }
                    });

                    obj.finalBalance = obj.inicialBalance - obj.payed + obj.received;

                    result.push({
                        date: start.toISOString(),
                        inicialBalance: obj.inicialBalance,
                        received: obj.received,
                        payed: obj.payed,
                        finalBalance: obj.finalBalance
                    });

                    obj.inicialBalance = obj.finalBalance;
                    obj.received = 0;
                    obj.payed = 0;
                    obj.finalBalance = 0;

                    start.setDate(start.getDate() + 1);

                } while (end >= auxDay);

                return res.status(200).send(result);

            } else if (start < today) {

                var transactions = await Transaction.find({ date: { $lt: start }, _owner: _user }).sort('date');
                transactions.forEach(element => {
                    var signal;
                    if (element.credit) {
                        signal = 1;
                    } else {
                        signal = -1
                    }
                    obj.inicialBalance += element.value * signal;
                });

                var auxDay = new Date(start);
                auxDay.setHours(0);
                auxDay.setMinutes(0);
                auxDay.setSeconds(0);
                auxDay.setMilliseconds(0);
                var bills = [];
                do {


                    auxDay.setDate(start.getDate() + 1);

                    transactions = await Transaction.find({ date: { $gte: start, $lt: auxDay }, _owner: _user });

                    transactions.forEach(element => {
                        if (element.credit) {
                            obj.received += element.value;
                        } else {
                            obj.payed += element.value;
                        }
                    });

                    bills = await Bill.find({ dueDate: { $gte: start, $lt: auxDay }, _owner: _user });

                    bills.forEach(element => {
                        if (element.credit && element._conciliation == null && element.ok) {
                            obj.received += element.value;
                        } else if (!element.credit && element._conciliation == null && element.ok) {
                            obj.payed += element.value;
                        }
                    });

                    obj.finalBalance = obj.inicialBalance - obj.payed + obj.received;

                    result.push({
                        date: start.toISOString(),
                        inicialBalance: obj.inicialBalance,
                        received: obj.received,
                        payed: obj.payed,
                        finalBalance: obj.finalBalance
                    });

                    obj.inicialBalance = obj.finalBalance;
                    obj.received = 0;
                    obj.payed = 0;
                    obj.finalBalance = 0;

                    start.setDate(start.getDate() + 1);

                } while (today > auxDay);


                do {

                    auxDay.setDate(start.getDate() + 1);

                    transactions = await Transaction.find({ date: { $gte: start, $lt: auxDay }, _owner: _user });

                    transactions.forEach(element => {
                        if (element.credit) {
                            obj.received += element.value;
                        } else {
                            obj.payed += element.value;
                        }
                    });

                    bills = await Bill.find({ dueDate: { $gte: start, $lt: auxDay }, _owner: _user });

                    bills.forEach(element => {
                        if (element.credit && element._conciliation == null) {
                            obj.received += element.value;
                        } else if (!element.credit && element._conciliation == null) {
                            obj.payed += element.value;
                        }
                    });

                    obj.finalBalance = obj.inicialBalance - obj.payed + obj.received;

                    result.push({
                        date: start.toISOString(),
                        inicialBalance: obj.inicialBalance,
                        received: obj.received,
                        payed: obj.payed,
                        finalBalance: obj.finalBalance
                    });

                    obj.inicialBalance = obj.finalBalance;
                    obj.received = 0;
                    obj.payed = 0;
                    obj.finalBalance = 0;

                    start.setDate(start.getDate() + 1);

                } while (end >= auxDay);



                return res.status(200).send(result);
            } else {
                var transactions = await Transaction.find({ date: { $lt: start }, _owner: _user });
                transactions.forEach(element => {
                    if (element.credit) {
                        obj.inicialBalance += element.value;
                    } else {
                        obj.inicialBalance -= element.value;
                    }
                });

                var bills = await Bill.find({ dueDate: { $lt: start }, ok: false, _owner: _user });
                bills.forEach(element => {
                    if (element.credit && element._conciliation == null) {
                        obj.received += element.value;
                    } else if (!element.credit && element._conciliation == null) {
                        obj.payed += element.value;
                    }
                });

                var auxDay = new Date(start);
                auxDay.setHours(0);
                auxDay.setMinutes(0);
                auxDay.setSeconds(0);
                auxDay.setMilliseconds(0);


                do {

                    auxDay.setDate(start.getDate() + 1);

                    transactions = await Transaction.find({ date: { $gte: start, $lt: auxDay }, _owner: _user });

                    transactions.forEach(element => {
                        if (element.credit) {
                            obj.received += element.value;
                        } else {
                            obj.payed += element.value;
                        }
                    });

                    bills = await Bill.find({ dueDate: { $gte: start, $lt: auxDay }, _owner: _user });

                    bills.forEach(element => {
                        if (element.credit && element._conciliation == null) {
                            obj.received += element.value;
                        } else if (!element.credit && element._conciliation == null) {
                            obj.payed += element.value;
                        }
                    });

                    obj.finalBalance = obj.inicialBalance - obj.payed + obj.received;

                    result.push({
                        date: start.toISOString(),
                        inicialBalance: obj.inicialBalance,
                        received: obj.received,
                        payed: obj.payed,
                        finalBalance: obj.finalBalance
                    });

                    obj.inicialBalance = obj.finalBalance;
                    obj.received = 0;
                    obj.payed = 0;
                    obj.finalBalance = 0;

                    start.setDate(start.getDate() + 1);

                } while (end >= auxDay);

                return res.status(200).send(result);
            }

        } catch (error) {
            return res.status(400).send({ error: { message: 'BAD REQUEST' } });
        }
    });
    return router;
};

module.exports = flowRouter;