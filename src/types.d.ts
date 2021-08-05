declare interface nodemailerResponse {
	accepted: string[];
	rejected: string[];
	response: string;
}

declare type MyCache = {
	[email: string]: number;
};

declare type BlockedIP = string;
declare type BlockList = BlockedIP[];
