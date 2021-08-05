import { readFileSync } from 'fs';
import path from 'path';
import { expect } from 'chai';
import { allowedToEmail, ipInBlockList } from '../utils';

describe('allowedToEmail should validate against cache', () => {
	it('should return true if email isnt present in cache', () => {
		let cache: MyCache = {};

		let email = 'notincache@email.com';

		expect(allowedToEmail(email, cache)).to.be.true;
	});

	it('should return false if email is present in cache within timeframe', () => {
		let cache: MyCache = {};

		let email = 'incache@email.com';

		cache[email] = new Date().getTime();

		expect(allowedToEmail(email, cache)).to.equal(false);
	});

	it('should return true if email is in cache, but outside of timeframe', () => {
		let cache: MyCache = {};

		let email = 'totally.valid@email.com';

		cache[email] = new Date('1995-06-28').getTime();

		expect(allowedToEmail(email, cache)).to.be.true;
	});
});

describe('ipInBlockList should return true if `req.ip` exists in blockList', () => {
	it('should return true if email is in blockList', () => {
		const blockList: BlockList = readFileSync(path.join(__dirname, './blocklist.text.txt'), 'utf-8').split('\n');
		const ip: BlockedIP = blockList[0];

		expect(ipInBlockList(ip, blockList)).to.be.true;
	});
});
