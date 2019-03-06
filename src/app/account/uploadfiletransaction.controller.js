/* Libraries */
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const multer   = require('multer');
const moment   = require('moment-timezone');
const path     = require('path');
const env 	   = require('dotenv').config().parsed;
const fs 	   = require('fs');
const auth	   = require('../service/auth');

/* Model */
const UploadFile = require('./UploadFileTransaction');
const Transaction = require('./Transaction');

/* Configuração de upload imagem de aeronave */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './uploads/transactions');
	},

	filename: function (req, file, cb) {
		cb(null, req.params.id + '.' + file.mimetype.split('/')[1]);
	}
});

/* Filtro para rejeitar arquivos. */
const fileFilter = (req, file, cb) => {
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/))
		return cb(new Error('Somente imagens ou PDF são permitidos!'));

	cb(null, true);
}

/* Configuração de upload de imagem */
const upload = multer({
	storage: storage,
	limits: { fileSize: 1024 * 1024 * 20 },
	fileFilter: fileFilter
}).single('file');


function UploadTransactionRouter() {

	/* Upload e Update de anexo de transaction. */
	router.post('/file-transaction/:id', auth, async (req, res) => {
		try {
			const _user = req.payload.id;

			const transaction = await Transaction.findOne({_id:req.params.id, _owner:_user});
			const fileTransaction = await UploadFile.findOne({ _transaction: req.params.id, _owner:_user });

			if (fileTransaction) {
				await fs.unlink('./uploads/transactions/' + fileTransaction.name);
			}
			upload(req, res, async (error) => {
				if (error)
					return res.status(400).send({ message: "O arquivo deve ser do tipo < jpg | jpeg | png | gif | pdf>, e ter no máximo " + 20 + " MB." });
				if (!req.file)
					return res.status(400).send({ message: 'O arquivo não foi enviado!' });
				var fileInfo = {};

				fileInfo._owner = _user;
				fileInfo.name = req.params.id + '.' + req.file.mimetype.split('/')[1];
				fileInfo.size = (req.file.size / 1048576).toFixed(2) + ' MB';
				fileInfo.type = req.file.mimetype;
				fileInfo._transaction = req.params.id;

				var img = {};
				var url = "";

				if (fileTransaction) {
					img = await UploadFile.findByIdAndUpdate(fileTransaction._id, fileInfo, { new: true });
				} else {
					img = await UploadFile.create(fileInfo);
					url = 'http://localhost:3000/' + 'api/v1/file-transaction/' + fileInfo.name;
					await Transaction.findByIdAndUpdate(transaction._id, { $set: { file: url } });
				}

				return res.status(200).send({ message: 'Arquivo enviado com sucesso!' });
			});
		} catch (error) {
			return res.status(500).send({ error: 'Erro interno do servidor!' });
		}
	});

	/* Deletar anexo de aeronave. */
	router.delete('/file-transaction/:id', auth, async (req, res) => {
		try {
			const _user = req.payload.id;
			const file = await UploadFile.findOne({ _transaction: req.params.id, _owner:_user });
			const transaction = await Transaction.findOne({_id:req.params.id, _owner:_user});

			if (!file)
				return res.status(404).send({ message: 'Arquivo não encontrado!' });

			await fs.unlink('./uploads/transactions/' + file.name, (error) => {
				if (error)
					return res.status(404).send({ message: 'Erro ao deletar arquivo!' });
			});

			await UploadFile.findByIdAndRemove(file._id);
			await Transaction.findByIdAndUpdate(transaction._id, { $set: { file: "" } });

			return res.send({ message: 'Arquivo excluido com sucesso!' });
		} catch (error) {
			return res.status(400).send({ message: 'BAD REQUEST' });
		}
	});

	/* Exibir anexo id do Transaction. */
	router.get('/file-transaction/:id', auth, async (req, res) => {
		try {
			const _user = req.payload.id;
			const file = await UploadFile.findOne({ _transaction: req.params.id, _owner:_user });

			if (!file)
				return res.status(404).send({ message: 'Arquivo não encontrado!' });

			fs.exists('./uploads/transactions/' + file.name, exists => {
				if (exists)
					return res.sendFile(path.resolve('./uploads/transactions/' + file.name));
				else
					return res.status(404).send({ message: 'Arquivo não encontrado!' });
			});
		} catch (error) {
			return res.status(500).send({ message: 'Erro ao carregar anexo!' });
		}
	});

	

	router.get('/getfile-transaction/:id', auth, async (req, res) => {
		try {

			const _user = req.payload.id;
			const file = await UploadFile.findOne({_id:req.params.id, _owner:_user});

			fs.exists('./uploads/transactions/' + file.name, exists => {
				if (exists)
					return res.sendFile(path.resolve('./uploads/transactions/' + file.name));
				else
					return res.status(404).send({ message: 'Anexo não encontrado!' });
			});
		} catch (error) {
			return res.status(500).send({ message: 'Erro ao carregar anexo!' });
		}
	});

	return router;
}

module.exports = UploadTransactionRouter;
