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
const UploadFile = require('./UploadFileBill');
const Bill = require('./Bill');

/* Configuração de upload imagem de aeronave */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './uploads/bills');
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


function UploadBillRouter() {

	/* Upload e Update de anexo de bill. */
	router.post('/file-bill/:id', auth, async (req, res) => {
		try {
			const _user = req.payload.id;

			const bill = await Bill.findOne({_id:req.params.id, _owner:_user});
			const fileBill = await UploadFile.findOne({ _bill: req.params.id, _owner:_user });

			if (fileBill) {
				await fs.unlink('./uploads/bills/' + fileBill.name);
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
				fileInfo._bill = req.params.id;

				var img = {};
				var url = "";

				if (fileBill) {
					img = await UploadFile.findOneAndUpdate({_id:fileBill._id, _owner:_user}, fileInfo, { new: true });
				} else {
					img = await UploadFile.create(fileInfo);
					url = 'http://localhost:3000/' + 'api/v1/file-bill/' + fileInfo.name;
					await Bill.findByIdAndUpdate(bill._id, { $set: { file: url } });
				}

				return res.status(200).send({ message: 'Arquivo enviado com sucesso!' });
			});
		} catch (error) {
			return res.status(500).send({ error: 'Erro interno do servidor!' });
		}
	});

	/* Deletar anexo de aeronave. */
	router.delete('/file-bill/:id', auth, async (req, res) => {
		try {
			const _user = req.payload.id;

			const file = await UploadFile.findOne({ _bill: req.params.id, _owner:_user });
			const bill = await Bill.findOne({_id:req.params.id, _owner:_user});

			if (!file)
				return res.status(404).send({ message: 'Arquivo não encontrado!' });

			await fs.unlink('./uploads/bills/' + file.name, (error) => {
				if (error)
					return res.status(404).send({ message: 'Erro ao deletar arquivo!' });
			});

			await UploadFile.findOneAndRemove({_id:file._id, _owner:_user});
			await Bill.findOneAndUpdate({_id:bill._id, _owner:_user}, { $set: { file: "" } });

			return res.send({ message: 'Arquivo excluido com sucesso!' });
		} catch (error) {
			return res.status(400).send({ message: 'BAD REQUEST' });
		}
	});

	/* Exibir anexo id do Bill. */
	router.get('/file-bill/:id', auth, async (req, res) => {
		try {
			const _user = req.payload.id;

			const file = await UploadFile.findOne({ _bill: req.params.id, _owner:_user });

			if (!file)
				return res.status(404).send({ message: 'Arquivo não encontrado!' });

			fs.exists('./uploads/bills/' + file.name, exists => {
				if (exists)
					return res.sendFile(path.resolve('./uploads/bills/' + file.name));
				else
					return res.status(404).send({ message: 'Arquivo não encontrado!' });
			});
		} catch (error) {
			return res.status(500).send({ message: 'Erro ao carregar anexo!' });
		}
	});

	router.get('/getfile-bill/:id', auth, async (req, res) => {
		try {
			const _user = req.payload.id;

			const file = await UploadFile.findOne({_id:req.params.id, _owner:_user});

			fs.exists('./uploads/bills/' + file.name, exists => {
				if (exists)
					return res.sendFile(path.resolve('./uploads/bills/' + file.name));
				else
					return res.status(404).send({ message: 'Anexo não encontrado!' });
			});
		} catch (error) {
			return res.status(500).send({ message: 'Erro ao carregar anexo!' });
		}
	});

	return router;
}

module.exports = UploadBillRouter;
