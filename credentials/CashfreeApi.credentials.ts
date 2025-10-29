import type {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest
} from 'n8n-workflow';

export class CashfreeApi implements ICredentialType {
	name = 'cashfreeApi';

	displayName = 'Cashfree API';

	documentationUrl = 'https://docs.cashfree.com/reference';

	properties: INodeProperties[] = [
		{
			displayName: 'Operation Type',
			name: 'operationType',
			type: 'options',
			options: [
				{
					name: 'Payment Gateway Operations',
					value: 'paymentGateway',
					description: 'For orders, payment links, refunds',
				},
				{
					name: 'Payout Operations (Cashgram)',
					value: 'payout',
					description: 'For Cashgram and payout operations',
				},
			],
			default: 'paymentGateway',
			required: true,
			description: 'Select the type of operations you want to perform',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Sandbox',
					value: 'sandbox',
				},
				{
					name: 'Production',
					value: 'production',
				},
			],
			default: 'sandbox',
			required: true,
			description: 'Environment to use for API calls',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operationType: ['paymentGateway'],
				},
			},
			description: 'Cashfree Payment Gateway Client ID (required for payment gateway operations)',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					operationType: ['paymentGateway'],
				},
			},
			description: 'Cashfree Payment Gateway Client Secret (required for payment gateway operations)',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '2023-08-01',
			required: false,
			displayOptions: {
				show: {
					operationType: ['paymentGateway'],
				},
			},
			description: 'API Version for Payment Gateway operations',
		},
		{
			displayName: 'Payout Authorization Token',
			name: 'payoutAuthToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					operationType: ['payout'],
				},
			},
			description: 'Authorization token for Cashfree Payout API (required for Cashgram operations)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-Client-Id': '={{$credentials.operationType === "payout" ? "" : $credentials.clientId}}',
				'X-Client-Secret': '={{$credentials.operationType === "payout" ? "" : $credentials.clientSecret}}',
				'x-api-version': '={{$credentials.operationType === "payout" ? "" : ($credentials.apiVersion || "2023-08-01")}}',
				'Authorization': '={{$credentials.operationType === "paymentGateway" ? "" : ("Bearer " + $credentials.payoutAuthToken)}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.environment === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com"}}',
			url: '/pg/orders?limit=1',
			method: 'GET',
			headers: {
				'X-Client-Id': '={{$credentials.clientId}}',
				'X-Client-Secret': '={{$credentials.clientSecret}}',
				'x-api-version': '={{$credentials.apiVersion || "2025-01-01"}}',
			},
		},
	};
}
