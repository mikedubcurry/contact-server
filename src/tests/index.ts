import { expect } from 'chai';
import { allowedToEmail, Cache } from '../index';

describe('allowedToEmail should validate against cache', () => {
	it('should return true if email isnt present in cache', () => {
		let cache: Cache = {};

		let email = 'notincache@email.com';

		expect(allowedToEmail(email, cache)).to.be.true;
	});

	it('should return false if email is present in cache within timeframe', () => {
		let cache: Cache = {};

		let email = 'incache@email.com';

		cache[email] = new Date().getTime();

		expect(allowedToEmail(email, cache)).to.equal(false);
	});

	it('should return true if email is in cache, but outside of timeframe', () => {
		let cache: Cache = {};

		let email = 'totally.valid@email.com';

		cache[email] = new Date('1995-06-28').getTime();

		expect(allowedToEmail(email, cache)).to.be.true;
	});
});
