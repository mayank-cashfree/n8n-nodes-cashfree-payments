import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class CashfreeApi implements ICredentialType {
	name = 'cashfreeApi';

	displayName = 'Cashfree API';

	documentationUrl = 'https://docs.cashfree.com/reference';

	properties: INodeProperties[] = [
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: 'Cashfree Payment Gateway Client ID (required for all operations)',
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
			description: 'Cashfree Payment Gateway Client Secret (required for all operations)',
		},
		{
			displayName: 'Payout Authorization Token',
			name: 'payoutAuthToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: false,
			description: 'Authorization token for Cashfree Payout API (only required for Cashgram operations)',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '2025-01-01',
			required: false,
			description: 'API Version for Payment Gateway operations (uses default if not specified)',
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
	];
}
