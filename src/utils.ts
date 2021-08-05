import { Request, Response, NextFunction } from 'express';
import { writeFileSync, readFileSync, appendFileSync } from 'fs';
import path from 'path';

export function allowedToEmail(email: string, cache: MyCache, blockList: BlockList = []): boolean {
	if (blockList.includes(email)) {
		return false;
	} else {
		if (!cache[email]) return true;
		else if (new Date().getTime() - cache[email] > 3.6e6) {
			delete cache[email];
			return true;
		} else return false;
	}
}

export function ipInBlockList(ip: BlockedIP, blockList: BlockList) {
	return blockList.includes(ip);
}

export function rejectInBlockList(req: Request, res: Response, next: NextFunction, blockList: BlockList) {
	if (ipInBlockList(req.ip, blockList)) {
		return res.status(429).json({
			status: 'error',
			message: `user with IP addr: ${req.ip} is unable to use this feature`,
		});
	} else {
		next();
	}
}

export function loadBlockList() {
	let blocklist: BlockList;
	try {
		blocklist = readFileSync(path.join(__dirname, './blocklist.txt'), 'utf-8')
			.split('\n')
			.filter((ip) => ip);
		// return blocklist;
	} catch (err) {
		writeFileSync(path.join(__dirname, './blocklist.txt'), '', { encoding: 'utf-8' });
		blocklist = readFileSync(path.join(__dirname, './blocklist.txt'), 'utf-8')
			.split('\n')
			.filter((ip) => ip);
	}
	return blocklist;
}

export function addToBlockList(ip: BlockedIP) {
	try {
		appendFileSync(path.join(__dirname, './blocklist.txt'), '\n' + ip);
		return true;
	} catch (err) {
		return false;
	}
}
