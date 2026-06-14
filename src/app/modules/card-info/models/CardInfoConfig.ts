import {ICardInfoConfig} from "../types/ICardInfoConfig";

export class CardInfoConfig implements ICardInfoConfig {
	constructor(config: ICardInfoConfig) {
		Object.assign(this, config);
	}

	public showWalletConnection: boolean = true;
	public showPaymentQR: boolean = false;
	public paymentAccount: string | null = null;
	public groupManagement: boolean = false;
}
