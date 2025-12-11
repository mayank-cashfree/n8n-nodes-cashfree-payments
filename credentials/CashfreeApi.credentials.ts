import type {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties
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
			default: '2025-01-01',
			required: false,
			displayOptions: {
				show: {
					operationType: ['paymentGateway'],
				},
			},
			description: 'API Version for Payment Gateway operations',
		},
		{
			displayName: 'Payout Client ID',
			name: 'payoutClientId',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operationType: ['payout'],
				},
			},
			description: 'Client ID for Cashfree Payout API (required for Cashgram operations)',
		},
		{
			displayName: 'Payout Client Secret',
			name: 'payoutClientSecret',
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
			description: 'Client Secret for Cashfree Payout API (required for Cashgram operations)',
		},
		{
			displayName: 'Payout Public Key',
			name: 'payoutPublicKey',
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
			description: 'Public Key for Cashfree Payout API (required for Cashgram operations). Include the full key with headers.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-Client-Id': '={{$credentials.clientId}}',
				'X-Client-Secret': '={{$credentials.clientSecret}}',
				'x-api-version': '={{$credentials.apiVersion || "2025-01-01"}}',
			},
		},
	};

	// Authentication will be validated during actual API operations
}
