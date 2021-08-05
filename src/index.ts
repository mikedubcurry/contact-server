import express from 'express';
import morgan from 'morgan';
import { createWriteStream, readFileSync } from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

import { addToBlockList, allowedToEmail, loadBlockList, rejectInBlockList } from './utils';

dotenv.config();

let blockList: BlockList = loadBlockList();

let cache: MyCache = {};

const transport = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_ACCOUNT,
		pass: process.env.EMAIL_PASS,
	},
});

const app = express();

app.use(
	morgan('[:date[clf]] :remote-addr :method :url :status', {
		stream: createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' }),
		skip: function (req, res) {
			return res.statusCode < 400;
		},
	})
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.json({ status: 'success', message: 'good to go' });
});

app.get('/clearCache', (req, res) => {
	cache = {};
	res.json({ status: 'success', message: 'cache cleared' });
});

app.post(
	'/sendEmail',
	(req, res, next) => {
		rejectInBlockList(req, res, next, blockList);
	},
	async (req, res) => {
		const { name, email, message }: { name: string; email: string; message: string } = req.body;
		if (!name || !email || !message) {
			return res.status(400).json({ status: 'error', message: 'must send name, email and message' });
		}
		if (!allowedToEmail(email, cache, blockList)) {
			return res.status(429).json({
				status: 'error',
				message: `user ${name}-${email} has already sent a message. try again in an hour`,
			});
		}

		if (message.length > 240) {
			return res.status(400).json({ status: 'error', message: 'message exceeds allowed length' });
		}

		try {
			const messageSent = (await transport.sendMail({
				to: process.env.EMAIL_DESTINATION,
				from: process.env.EMAIL_ACCOUNT,
				subject: `Portfolio message from ${name}-${email}`,
				html: message,
			})) as unknown as nodemailerResponse;

			if (messageSent.rejected.length) {
				return res.status(500).json({ status: 'error', message: 'message not sent' });
			}
			if (messageSent.response.includes(' OK ')) {
				/* this is probably good */

				cache[email] = new Date().getTime();
				return res.status(200).json({ status: 'success', message: 'message sent' });
			}
		} catch (e) {
			return res.status(500).json({ status: 'error', message: 'error in POST /sendMail' });
		}
	}
);

app.post('/blockUser', (req, res) => {
	const { ip } = req.body;
	if (!ip) {
		return res.status(400).json({ status: 'error', message: 'must supply ip to be added to blockList' });
	}
	addToBlockList(ip);
	blockList = loadBlockList();
	res.json({ blockList });
});

app.listen(3000, () => {
	console.log('listening on port 3000');
});
