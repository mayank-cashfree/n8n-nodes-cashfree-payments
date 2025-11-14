import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import * as crypto from 'crypto';

export class CashfreePayments implements INodeType {
	// Helper method to generate encrypted signature
	private static generateEncryptedSignature(clientIdWithTimestamp: string, publicKeyContent: string): string {
		try {
			// Clean the public key content exactly like Java - remove headers, footers, and ALL whitespace
			const cleanedPublicKey = publicKeyContent
				.replace(/-----BEGIN PUBLIC KEY-----/g, '')
				.replace(/-----END PUBLIC KEY-----/g, '')
				.replace(/\s+/g, '');

			// Create public key from base64 decoded bytes (matches Java's X509EncodedKeySpec)
			const publicKey = crypto.createPublicKey({
				key: Buffer.from(cleanedPublicKey, 'base64'),
				format: 'der',
				type: 'spki',
			});

			// Use OAEP with SHA-1 padding (matches Java's "RSA/ECB/OAEPWithSHA-1AndMGF1Padding")
			const encryptedData = crypto.publicEncrypt(
				{
					key: publicKey,
					padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
					oaepHash: 'sha1',
				},
				Buffer.from(clientIdWithTimestamp, 'utf8')
			);

			return encryptedData.toString('base64');
		} catch (error) {
			throw new Error(`Failed to generate signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	// Helper method to create client ID with timestamp
	private static createClientIdWithTimestamp(clientId: string): string {
		const epochTimestamp = Math.floor(Date.now() / 1000);
		return `${clientId}.${epochTimestamp}`;
	}

	// Helper method to get payout base URL
	private static getPayoutBaseUrl(environment: string): string {
		return environment === 'sandbox'
			? 'https://sandbox.cashfree.com'
			: 'https://payout-api.cashfree.com';
	}

	// Helper method to get authorization token for payout operations
	private static async getPayoutAuthToken(clientId: string, clientSecret: string, publicKey: string, environment: string): Promise<string> {
		try {
			// Validate inputs
			if (!clientId || clientId.trim() === '') {
				throw new Error('Payout Client ID is empty or missing');
			}
			if (!clientSecret || clientSecret.trim() === '') {
				throw new Error('Payout Client Secret is empty or missing');
			}
			if (!publicKey || publicKey.trim() === '') {
				throw new Error('Payout Public Key is empty or missing');
			}

			const clientIdWithTimestamp = CashfreePayments.createClientIdWithTimestamp(clientId);
			const signature = CashfreePayments.generateEncryptedSignature(clientIdWithTimestamp, publicKey);

			const baseUrl = CashfreePayments.getPayoutBaseUrl(environment);

			const response = await fetch(`${baseUrl}/payout/v1/authorize`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Client-Id': clientId.trim(),
					'X-Client-Secret': clientSecret.trim(),
					'X-Cf-Signature': signature,
				},
			});

			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(`Authorization failed: ${response.status} - ${errorData}`);
			}

			const authData: any = await response.json();

			// Extract token from SUCCESS response
			if (authData.status === 'SUCCESS' && authData.data && authData.data.token) {
				return authData.data.token;
			}

			// Handle error responses
			if (authData.status === 'ERROR') {
				throw new Error(`Cashfree API Error: ${authData.message} (${authData.subCode})`);
			}

			throw new Error(`No valid token found in authorization response: ${JSON.stringify(authData)}`);
		} catch (error) {
			throw new Error(`Failed to get authorization token: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	description: INodeTypeDescription = {
		displayName: 'Cashfree Payments',
		name: 'cashfreePayments',
		icon: 'file:icon1.svg',
		group: ['transform'],
		version: 1,
		description: 'Interact with Cashfree Payments API',
		defaults: {
			name: 'Cashfree Payments',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'cashfreeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Create Order',
						value: 'createOrder',
						description: 'Create a new order',
						action: 'Create a new order',
					},
					{
						name: 'Create Payment Link',
						value: 'createPaymentLink',
						description: 'Create a payment link',
						action: 'Create a payment link',
					},
					{
						name: 'Cancel Payment Link',
						value: 'cancelPaymentLink',
						description: 'Cancel an existing payment link',
						action: 'Cancel a payment link',
					},
					{
						name: 'Fetch Payment Link Details',
						value: 'fetchPaymentLinkDetails',
						description: 'Fetch Payment Link Details',
						action: 'Fetch Payment Link Details',
					},
					{
						name: 'Get Orders for Payment Link',
						value: 'getOrdersForPaymentLink',
						description: 'Get orders associated with a payment link',
						action: 'Get orders for payment link',
					},
					{
						name: 'Create Refund',
						value: 'createRefund',
						description: 'Create a refund for an order',
						action: 'Create a refund',
					},
					{
						name: 'Get All Refunds for Order',
						value: 'getAllRefundsForOrder',
						description: 'Get all refunds associated with an order',
						action: 'Get all refunds for order',
					},
					{
						name: 'Create Cashgram',
						value: 'createCashgram',
						description: 'Create a Cashgram payout link',
						action: 'Create a Cashgram',
					},
					{
						name: 'Deactivate Cashgram',
						value: 'deactivateCashgram',
						description: 'Deactivate an existing Cashgram payout link',
						action: 'Deactivate a Cashgram',
					},
				],
				default: 'createOrder',
				noDataExpression: true,
			},

			// Order properties
			{
				displayName: 'Order Amount',
				name: 'orderAmount',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: 0,
				required: true,
			},
			{
				displayName: 'Order Currency',
				name: 'orderCurrency',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: 'INR',
				required: true,
			},
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Customer Phone',
				name: 'customerPhone',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Customer Email',
				name: 'customer_email_order',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'Customer email address (3-100 characters)',
			},
			{
				displayName: 'Customer Name',
				name: 'customer_name_order',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'Name of the customer (3-100 characters)',
			},
			{
				displayName: 'Customer Bank Account Number',
				name: 'customer_bank_account_number_order',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'Customer bank account. Required for TPV (Third Party Verification) (3-20 characters)',
			},
			{
				displayName: 'Customer Bank IFSC',
				name: 'customer_bank_ifsc_order',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'Customer bank IFSC. Required for TPV (Third Party Verification)',
			},
			{
				displayName: 'Customer Bank Code',
				name: 'customer_bank_code_order',
				type: 'options',
				options: [
					{ name: 'State Bank of India (3003)', value: '3003' },
					{ name: 'Punjab National Bank (3005)', value: '3005' },
					{ name: 'Bank of Baroda (3006)', value: '3006' },
					{ name: 'Central Bank of India (3010)', value: '3010' },
					{ name: 'Bank of India (3012)', value: '3012' },
					{ name: 'Indian Overseas Bank (3016)', value: '3016' },
					{ name: 'Allahabad Bank (3019)', value: '3019' },
					{ name: 'Andhra Bank (3020)', value: '3020' },
					{ name: 'Corporation Bank (3021)', value: '3021' },
					{ name: 'Indian Bank (3022)', value: '3022' },
					{ name: 'Oriental Bank of Commerce (3023)', value: '3023' },
					{ name: 'Punjab & Sind Bank (3024)', value: '3024' },
					{ name: 'Syndicate Bank (3026)', value: '3026' },
					{ name: 'UCO Bank (3027)', value: '3027' },
					{ name: 'Union Bank of India (3028)', value: '3028' },
					{ name: 'United Bank of India (3029)', value: '3029' },
					{ name: 'Vijaya Bank (3030)', value: '3030' },
					{ name: 'Dena Bank (3031)', value: '3031' },
					{ name: 'ICICI Bank (3032)', value: '3032' },
					{ name: 'HDFC Bank (3033)', value: '3033' },
					{ name: 'Axis Bank (3038)', value: '3038' },
					{ name: 'Kotak Mahindra Bank (3039)', value: '3039' },
					{ name: 'IndusInd Bank (3040)', value: '3040' },
					{ name: 'Yes Bank (3042)', value: '3042' },
					{ name: 'IDBI Bank (3044)', value: '3044' },
					{ name: 'Federal Bank (3054)', value: '3054' },
					{ name: 'South Indian Bank (3055)', value: '3055' },
					{ name: 'Karur Vysya Bank (3058)', value: '3058' },
					{ name: 'Canara Bank (3086)', value: '3086' },
					{ name: 'IDFC First Bank (3087)', value: '3087' },
					{ name: 'Bandhan Bank (3088)', value: '3088' },
					{ name: 'City Union Bank (3089)', value: '3089' },
					{ name: 'DCB Bank (3090)', value: '3090' },
					{ name: 'Dhanlaxmi Bank (3091)', value: '3091' },
					{ name: 'Lakshmi Vilas Bank (3092)', value: '3092' },
					{ name: 'RBL Bank (3098)', value: '3098' },
					{ name: 'Jammu & Kashmir Bank (3115)', value: '3115' },
					{ name: 'Tamilnad Mercantile Bank (3117)', value: '3117' },
					{ name: 'ESAF Small Finance Bank (7001)', value: '7001' },
				],
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'Customer bank code for TPV (Third Party Validation) with NetBanking. Required along with customer_bank_account_number and customer_bank_ifsc for TPV payments.',
			},
			{
				displayName: 'Order ID',
				name: 'order_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'Order identifier in your system. Alphanumeric, "_" and "-" only (3-45 characters)',
			},
			{
				displayName: 'Order Note',
				name: 'order_note',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'Order note for reference (3-200 characters)',
			},
			{
				displayName: 'Order Expiry Time',
				name: 'order_expiry_time',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'ISO 8601 format. Example: 2021-07-02T10:20:12+05:30',
				placeholder: 'YYYY-MM-DDTHH:MM:SS+05:30',
			},
			{
				displayName: 'Return URL',
				name: 'return_url_order',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'URL to redirect customer after payment completion (max 250 characters)',
			},
			{
				displayName: 'Notify URL',
				name: 'notify_url_order',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'HTTPS URL for server-to-server notifications (max 250 characters)',
			},
			{
				displayName: 'Payment Methods',
				name: 'payment_methods_order',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'Comma-separated values: cc,dc,ccc,ppc,nb,upi,paypal,app,paylater,cardlessemi,dcc',
				placeholder: 'cc,dc,upi,nb',
			},
			{
				displayName: 'Cart Details',
				name: 'cart_details',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '{}',
				description: 'Complete cart details including cart items, shipping address, billing address, and shipping charges for One Click Checkout integration.',
				placeholder: '{"cart_items": [{"item_id": "cart_id_1", "item_name": "T Shirt", "item_description": "Test Description", "item_original_unit_price": 100, "item_discounted_unit_price": 90, "item_quantity": 2, "item_currency": "INR"}], "shipping_address": {"full_name": "John Doe", "country": "India", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "address_line_1": "123 Main St", "address_line_2": "Apt 4B"}, "billing_address": {"full_name": "John Doe", "country": "India", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "address_line_1": "123 Main St", "address_line_2": "Apt 4B"}, "shipping_charge": 50}',
			},
			{
				displayName: 'Customer Note',
				name: 'customer_note',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'Note from customer',
			},
			{
				displayName: 'Terminal (SoftPOS)',
				name: 'terminal',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '{}',
				description: 'Terminal configuration for SoftPOS orders. Assigns order to specific agent/terminal. Example: {"terminal_id": "cf_terminal_id"} or {"terminal_phone_no": "9876543210"}',
				placeholder: '{"terminal_id": "cf_terminal_id", "terminal_phone_no": "9876543210"}',
			},
			{
				displayName: 'Enable One Click Checkout',
				name: 'enable_one_click_checkout',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: false,
				description: 'Enable One Click Checkout feature',
			},
			{
				displayName: 'Enable Verify and Pay',
				name: 'enable_verify_and_pay',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: false,
				description: 'Enable Verify and Pay feature',
			},
			{
				displayName: 'Idempotency Key',
				name: 'idempotency_key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: '',
				description: 'A unique identifier for safe retries. If the request fails or times out, you can safely retry it using the same key to avoid duplicate orders.',
				placeholder: 'UUID format recommended (e.g., 3c90c3cc-0d44-4b50-8888-8dd25736052a)',
			},

			// Payment Link properties
			{
				displayName: 'Customer Email',
				name: 'customer_email',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Customer Name',
				name: 'customer_name',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
			},
			{
				displayName: 'Customer Phone',
				name: 'customer_phone',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Customer Bank Account Number',
				name: 'customer_bank_account_number',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
				description: 'Customer bank account number (optional)',
			},
			{
				displayName: 'Customer Bank IFSC Code',
				name: 'customer_bank_ifsc',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
				description: 'Customer bank IFSC code (optional)',
			},
			{
				displayName: 'Customer Bank Code',
				name: 'customer_bank_code',
				type: 'options',
				options: [
					{ name: 'State Bank of India (3003)', value: '3003' },
					{ name: 'Punjab National Bank (3005)', value: '3005' },
					{ name: 'Bank of Baroda (3006)', value: '3006' },
					{ name: 'Central Bank of India (3010)', value: '3010' },
					{ name: 'Bank of India (3012)', value: '3012' },
					{ name: 'Indian Overseas Bank (3016)', value: '3016' },
					{ name: 'Allahabad Bank (3019)', value: '3019' },
					{ name: 'Andhra Bank (3020)', value: '3020' },
					{ name: 'Corporation Bank (3021)', value: '3021' },
					{ name: 'Indian Bank (3022)', value: '3022' },
					{ name: 'Oriental Bank of Commerce (3023)', value: '3023' },
					{ name: 'Punjab & Sind Bank (3024)', value: '3024' },
					{ name: 'Syndicate Bank (3026)', value: '3026' },
					{ name: 'UCO Bank (3027)', value: '3027' },
					{ name: 'Union Bank of India (3028)', value: '3028' },
					{ name: 'United Bank of India (3029)', value: '3029' },
					{ name: 'Vijaya Bank (3030)', value: '3030' },
					{ name: 'Dena Bank (3031)', value: '3031' },
					{ name: 'ICICI Bank (3032)', value: '3032' },
					{ name: 'HDFC Bank (3033)', value: '3033' },
					{ name: 'Axis Bank (3038)', value: '3038' },
					{ name: 'Kotak Mahindra Bank (3039)', value: '3039' },
					{ name: 'IndusInd Bank (3040)', value: '3040' },
					{ name: 'Yes Bank (3042)', value: '3042' },
					{ name: 'IDBI Bank (3044)', value: '3044' },
					{ name: 'Federal Bank (3054)', value: '3054' },
					{ name: 'South Indian Bank (3055)', value: '3055' },
					{ name: 'Karur Vysya Bank (3058)', value: '3058' },
					{ name: 'Canara Bank (3086)', value: '3086' },
					{ name: 'IDFC First Bank (3087)', value: '3087' },
					{ name: 'Bandhan Bank (3088)', value: '3088' },
					{ name: 'City Union Bank (3089)', value: '3089' },
					{ name: 'DCB Bank (3090)', value: '3090' },
					{ name: 'Dhanlaxmi Bank (3091)', value: '3091' },
					{ name: 'Lakshmi Vilas Bank (3092)', value: '3092' },
					{ name: 'RBL Bank (3098)', value: '3098' },
					{ name: 'Jammu & Kashmir Bank (3115)', value: '3115' },
					{ name: 'Tamilnad Mercantile Bank (3117)', value: '3117' },
					{ name: 'ESAF Small Finance Bank (7001)', value: '7001' },
				],
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
				description: 'Customer bank code (optional)',
			},
			{
				displayName: 'Link ID',
				name: 'link_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Link Amount',
				name: 'link_amount',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: 100,
				required: true,
			},
			{
				displayName: 'Link Purpose',
				name: 'link_purpose',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Link Currency',
				name: 'link_currency',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: 'INR',
			},
			{
				displayName: 'Link Expiry Time',
				name: 'link_expiry_time',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
				description: 'ISO 8601 format. Example: 2021-07-02T10:20:12+05:30',
				placeholder: 'YYYY-MM-DDTHH:MM:SS+05:30',
			},
			{
				displayName: 'Return URL',
				name: 'return_url',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
			},
			{
				displayName: 'Notify URL',
				name: 'notify_url',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
			},
			{
				displayName: 'Payment Methods',
				name: 'payment_methods',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
				description: 'Allowed payment modes for this link. Pass comma-separated values among following options - "cc", "dc", "ccc", "ppc", "nb", "upi", "paypal", "app". Leave it blank to show all available payment methods',
				placeholder: 'cc,dc,upi,nb',
			},
			{
				displayName: 'Allow UPI Intent',
				name: 'upi_intent',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: false,
			},
			{
				displayName: 'Link Notes',
				name: 'link_notes',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '{}',
				description: 'Custom key-value pairs for internal tracking. Example: {"order_id": "ORD123", "internal_ref": "CUST456"}',
				placeholder: '{"key1": "value1", "key2": "value2"}',
			},
			{
				displayName: 'Idempotency Key',
				name: 'payment_link_idempotency_key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createPaymentLink'],
					},
				},
				default: '',
				description: 'A unique identifier for safe retries. If the request fails or times out, you can safely retry it using the same key to avoid duplicate payment links.',
				placeholder: 'UUID format recommended (e.g., 3c90c3cc-0d44-4b50-8888-8dd25736052a)',
			},

			// Cancel Payment Link properties
			{
				displayName: 'Link ID',
				name: 'cancel_link_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['cancelPaymentLink'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the payment link to cancel',
			},
			{
				displayName: 'Request ID',
				name: 'cancel_request_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['cancelPaymentLink'],
					},
				},
				default: '',
				description: 'Request ID for the API call. Can be used to resolve tech issues. Communicate this in your tech related queries to Cashfree.',
			},
			{
				displayName: 'Idempotency Key',
				name: 'cancel_idempotency_key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['cancelPaymentLink'],
					},
				},
				default: '',
				description: 'An idempotency key is a unique identifier you include with your API call. If the request fails or times out, you can safely retry it using the same key to avoid duplicate actions.',
				placeholder: 'UUID format recommended',
			},

			// Fetch Payment Link Details properties
			{
				displayName: 'Link ID',
				name: 'fetch_details_link_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['fetchPaymentLinkDetails'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the payment link to fetch details for',
			},
			{
				displayName: 'Request ID',
				name: 'fetch_details_request_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['fetchPaymentLinkDetails'],
					},
				},
				default: '',
				description: 'Request ID for the API call. Can be used to resolve tech issues. Communicate this in your tech related queries to Cashfree.',
			},
			{
				displayName: 'Idempotency Key',
				name: 'fetch_details_idempotency_key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['fetchPaymentLinkDetails'],
					},
				},
				default: '',
				description: 'An idempotency key is a unique identifier you include with your API call. If the request fails or times out, you can safely retry it using the same key to avoid duplicate actions.',
				placeholder: 'UUID format recommended',
			},

			// Get Orders properties
			{
				displayName: 'Link ID',
				name: 'get_orders_link_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getOrdersForPaymentLink'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the payment link to get orders for',
			},
			{
				displayName: 'Request ID',
				name: 'get_orders_request_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getOrdersForPaymentLink'],
					},
				},
				default: '',
				description: 'Request ID for the API call. Can be used to resolve tech issues. Communicate this in your tech related queries to Cashfree.',
			},
			{
				displayName: 'Idempotency Key',
				name: 'get_orders_idempotency_key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getOrdersForPaymentLink'],
					},
				},
				default: '',
				description: 'An idempotency key is a unique identifier you include with your API call. If the request fails or times out, you can safely retry it using the same key to avoid duplicate actions.',
				placeholder: 'UUID format recommended',
			},
			{
				displayName: 'Order Status Filter',
				name: 'get_orders_status',
				type: 'options',
				options: [
					{
						name: 'All orders',
						value: 'ALL',
					},
					{
						name: 'Only paid orders',
						value: 'PAID',
					},
				],
				displayOptions: {
					show: {
						operation: ['getOrdersForPaymentLink'],
					},
				},
				default: 'PAID',
				description: 'What status of orders you want to fetch. ALL - seen as all orders, PAID - seen as only paid orders',
			},

			// Refund properties
			{
				displayName: 'Order ID',
				name: 'refund_order_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createRefund'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Refund Amount',
				name: 'refund_amount',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['createRefund'],
					},
				},
				default: 1,
				required: true,
			},
			{
				displayName: 'Refund ID',
				name: 'refund_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createRefund'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Refund Note',
				name: 'refund_note',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createRefund'],
					},
				},
				default: '',
				description: 'Refund note for reference',
			},
			{
				displayName: 'Refund Speed',
				name: 'refund_speed',
				type: 'options',
				options: [
					{
						name: 'Standard',
						value: 'STANDARD',
					},
					{
						name: 'Instant',
						value: 'INSTANT',
					},
				],
				displayOptions: {
					show: {
						operation: ['createRefund'],
					},
				},
				default: 'STANDARD',
			},
			{
				displayName: 'Request ID',
				name: 'x_request_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createRefund'],
					},
				},
				default: '',
				description: 'Request ID for the API call. Can be used to resolve tech issues. Communicate this in your tech related queries to Cashfree.',
			},
			{
				displayName: 'Idempotency Key',
				name: 'x_idempotency_key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createRefund'],
					},
				},
				default: '',
				description: 'An idempotency key is a unique identifier you include with your API call. If the request fails or times out, you can safely retry it using the same key to avoid duplicate actions.',
				placeholder: 'UUID format recommended',
			},

			// Get Refunds properties
			{
				displayName: 'Order ID',
				name: 'get_refunds_order_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getAllRefundsForOrder'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the order to get refunds for',
			},
			{
				displayName: 'Request ID',
				name: 'get_refunds_request_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getAllRefundsForOrder'],
					},
				},
				default: '',
				description: 'Request ID for the API call. Can be used to resolve tech issues. Communicate this in your tech related queries to Cashfree.',
			},
			{
				displayName: 'Idempotency Key',
				name: 'get_refunds_idempotency_key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getAllRefundsForOrder'],
					},
				},
				default: '',
				description: 'An idempotency key is a unique identifier you include with your API call. If the request fails or times out, you can safely retry it using the same key to avoid duplicate actions.',
				placeholder: 'UUID format recommended',
			},

			// Cashgram properties
			{
				displayName: 'Cashgram ID',
				name: 'cashgram_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createCashgram'],
					},
				},
				default: '',
				required: true,
				placeholder: 'CG_001',
				description: 'Unique identifier for the Cashgram (alphanumeric, 3-50 characters)',
			},
			{
				displayName: 'Amount',
				name: 'cashgram_amount',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['createCashgram'],
					},
				},
				default: 1,
				required: true,
				description: 'Amount in INR',
			},
			{
				displayName: 'Name',
				name: 'cashgram_name',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createCashgram'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Email',
				name: 'cashgram_email',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createCashgram'],
					},
				},
				default: '',
				required: true,
				placeholder: 'customer@example.com',
				description: 'Valid email address of the recipient',
			},
			{
				displayName: 'Phone',
				name: 'cashgram_phone',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createCashgram'],
					},
				},
				default: '',
				required: true,
				placeholder: '9999999999',
				description: 'Phone number of the recipient (10 digits, without country code)',
			},
			{
				displayName: 'Link Expiry',
				name: 'cashgram_link_expiry',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createCashgram'],
					},
				},
				default: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				required: false,
				description: 'Expiry date for the Cashgram link (YYYY-MM-DD format). Maximum 30 days from date of creation.',
			},
			{
				displayName: 'Remarks',
				name: 'cashgram_remarks',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createCashgram'],
					},
				},
				default: 'Cashgram payout',
				required: false,
				description: 'Additional remarks for the Cashgram',
			},
			{
				displayName: 'Notify Customer',
				name: 'cashgram_notify_customer',
				type: 'options',
				options: [
					{
						name: 'Yes',
						value: 1,
					},
					{
						name: 'No',
						value: 0,
					},
				],
				displayOptions: {
					show: {
						operation: ['createCashgram'],
					},
				},
				default: 1,
				required: false,
				description: 'Whether to notify the customer about the Cashgram (1 = Yes, 0 = No)',
			},

			// Deactivate Cashgram properties
			{
				displayName: 'Cashgram ID',
				name: 'deactivate_cashgram_id',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['deactivateCashgram'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the Cashgram to deactivate',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('cashfreeApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				// Validate credentials based on operation type
				if (operation === 'createCashgram' || operation === 'deactivateCashgram') {
					if (!credentials.payoutClientId || !credentials.payoutClientSecret || !credentials.payoutPublicKey) {
						throw new Error('Payout Client ID, Client Secret, and Public Key are required for Cashgram operations. Please configure them in the credentials.');
					}
				} else {
					// For all other operations (Payment Gateway), require Client ID and Secret
					if (!credentials.clientId || !credentials.clientSecret) {
						throw new Error('Client ID and Client Secret are required for Payment Gateway operations (orders, payment links, refunds). Please configure them in the credentials.');
					}
				}

				let responseData: any;
				const baseUrl = credentials.environment === 'sandbox' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';

				if (operation === 'createOrder') {
					const orderAmount = this.getNodeParameter('orderAmount', i) as number;
					const orderCurrency = this.getNodeParameter('orderCurrency', i) as string;
					const customerId = this.getNodeParameter('customerId', i) as string;
					const customerPhone = this.getNodeParameter('customerPhone', i) as string;

					// Build customer_details object
					const customerDetails: any = {
						customer_id: customerId,
						customer_phone: customerPhone,
					};

					// Add optional customer fields if provided
					const customerEmail = this.getNodeParameter('customer_email_order', i, '') as string;
					const customerName = this.getNodeParameter('customer_name_order', i, '') as string;
					const customerBankAccount = this.getNodeParameter('customer_bank_account_number_order', i, '') as string;
					const customerBankIfsc = this.getNodeParameter('customer_bank_ifsc_order', i, '') as string;
					const customerBankCode = this.getNodeParameter('customer_bank_code_order', i, '') as string;

					if (customerEmail && customerEmail.trim() !== '') customerDetails.customer_email = customerEmail;
					if (customerName && customerName.trim() !== '') customerDetails.customer_name = customerName;
					if (customerBankAccount && customerBankAccount.trim() !== '') customerDetails.customer_bank_account_number = customerBankAccount;
					if (customerBankIfsc && customerBankIfsc.trim() !== '') customerDetails.customer_bank_ifsc = customerBankIfsc;
					if (customerBankCode && customerBankCode.trim() !== '') customerDetails.customer_bank_code = customerBankCode;

					// Build main order body
					const body: any = {
						order_currency: orderCurrency,
						order_amount: orderAmount,
						customer_details: customerDetails,
					};

					// Add optional order fields if provided
					const orderId = this.getNodeParameter('order_id', i, '') as string;
					const orderNote = this.getNodeParameter('order_note', i, '') as string;
					const orderExpiryTime = this.getNodeParameter('order_expiry_time', i, '') as string;
					const returnUrl = this.getNodeParameter('return_url_order', i, '') as string;
					const notifyUrl = this.getNodeParameter('notify_url_order', i, '') as string;
					const paymentMethods = this.getNodeParameter('payment_methods_order', i, '') as string;
					const customerNote = this.getNodeParameter('customer_note', i, '') as string;
					const enableOneClickCheckout = this.getNodeParameter('enable_one_click_checkout', i, false) as boolean;
					const enableVerifyAndPay = this.getNodeParameter('enable_verify_and_pay', i, false) as boolean;
					const idempotencyKey = this.getNodeParameter('idempotency_key', i, '') as string;

					if (orderId) body.order_id = orderId;
					if (orderNote) body.order_note = orderNote;
					if (orderExpiryTime) body.order_expiry_time = orderExpiryTime;
					if (returnUrl) body.return_url = returnUrl;
					if (notifyUrl) body.notify_url = notifyUrl;
					if (paymentMethods) body.payment_methods = paymentMethods;

					// Add cart_details for One Click Checkout integration if provided
					try {
						const cartDetailsParam = this.getNodeParameter('cart_details', i, '{}') as string;
						const cartDetails = typeof cartDetailsParam === 'string' ? JSON.parse(cartDetailsParam) : cartDetailsParam;

						// Only add cart_details to body if it has content (not empty object)
						if (Object.keys(cartDetails).length > 0) {
							body.cart_details = cartDetails;
						}
					} catch (error) {
						throw new Error(`Invalid JSON format for cart_details: ${error instanceof Error ? error.message : 'Unknown error'}`);
					}

					if (customerNote) body.customer_note = customerNote;
					if (enableOneClickCheckout) body.enable_one_click_checkout = enableOneClickCheckout;
					if (enableVerifyAndPay) body.enable_verify_and_pay = enableVerifyAndPay;

					// Build terminal object for SoftPOS if provided
					try {
						const terminalParam = this.getNodeParameter('terminal', i, '{}') as string;
						const terminal = typeof terminalParam === 'string' ? JSON.parse(terminalParam) : terminalParam;

						// Only add terminal to body if it has content (not empty object)
						if (Object.keys(terminal).length > 0) {
							body.terminal = terminal;
						}
					} catch (error) {
						throw new Error(`Invalid JSON format for terminal: ${error instanceof Error ? error.message : 'Unknown error'}`);
					}

					// Prepare headers
					const headers: any = {
						'Content-Type': 'application/json',
						'x-api-version': credentials.apiVersion,
						'x-client-id': credentials.clientId,
						'x-client-secret': credentials.clientSecret,
					};

					// Add idempotency key to headers if provided
					if (idempotencyKey) {
						headers['x-idempotency-key'] = idempotencyKey;
					}

					const response = await this.helpers.request({
						method: 'POST',
						url: `${baseUrl}/orders`,
						headers,
						body,
						json: true,
					});

					responseData = response;
				} else if (operation === 'createPaymentLink') {
					// Get link notes as JSON object
					let linkNotes: any = {};
					try {
						const linkNotesParam = this.getNodeParameter('link_notes', i, '{}') as string;
						linkNotes = typeof linkNotesParam === 'string' ? JSON.parse(linkNotesParam) : linkNotesParam;
					} catch (error) {
						throw new Error(`Invalid JSON format for link_notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
					}

					const paymentLinkIdempotencyKey = this.getNodeParameter('payment_link_idempotency_key', i, '') as string;

					const body: any = {
						customer_details: {
							customer_email: this.getNodeParameter('customer_email', i, '') as string,
							customer_name: this.getNodeParameter('customer_name', i, '') as string,
							customer_phone: this.getNodeParameter('customer_phone', i, '') as string,
							customer_bank_account_number: this.getNodeParameter('customer_bank_account_number', i, '') as string,
							customer_bank_ifsc: this.getNodeParameter('customer_bank_ifsc', i, '') as string,
							customer_bank_code: this.getNodeParameter('customer_bank_code', i, '') as string,
						},
						link_amount: this.getNodeParameter('link_amount', i) as number,
						link_currency: this.getNodeParameter('link_currency', i, 'INR') as string,
						link_id: this.getNodeParameter('link_id', i) as string,
						link_purpose: this.getNodeParameter('link_purpose', i) as string,
						link_expiry_time: this.getNodeParameter('link_expiry_time', i, '') as string,
						link_meta: {
							notify_url: this.getNodeParameter('notify_url', i) as string,
							return_url: this.getNodeParameter('return_url', i) as string,
							payment_methods: this.getNodeParameter('payment_methods', i) as string,
							upi_intent: this.getNodeParameter('upi_intent', i) as boolean,
						},
						link_notes: linkNotes,
					};

					// Remove empty fields
					if (!body.link_expiry_time) delete body.link_expiry_time;
					if (!body.link_meta.payment_methods) delete body.link_meta.payment_methods;
					if (!body.customer_details.customer_bank_account_number || body.customer_details.customer_bank_account_number.trim() === '') delete body.customer_details.customer_bank_account_number;
					if (!body.customer_details.customer_bank_ifsc || body.customer_details.customer_bank_ifsc.trim() === '') delete body.customer_details.customer_bank_ifsc;
					if (!body.customer_details.customer_bank_code || body.customer_details.customer_bank_code.trim() === '') delete body.customer_details.customer_bank_code;

					// Prepare headers
					const headers: any = {
						'Content-Type': 'application/json',
						'x-api-version': credentials.apiVersion,
						'x-client-id': credentials.clientId,
						'x-client-secret': credentials.clientSecret,
					};

					// Add idempotency key to headers if provided
					if (paymentLinkIdempotencyKey) {
						headers['x-idempotency-key'] = paymentLinkIdempotencyKey;
					}

					const response = await this.helpers.request({
						method: 'POST',
						url: `${baseUrl}/links`,
						headers,
						body,
						json: true,
					});

					responseData = response;
				} else if (operation === 'cancelPaymentLink') {
					const linkId = this.getNodeParameter('cancel_link_id', i) as string;
					const requestId = this.getNodeParameter('cancel_request_id', i, '') as string;
					const idempotencyKey = this.getNodeParameter('cancel_idempotency_key', i, '') as string;

					const headers: any = {
						'Content-Type': 'application/json',
						'x-api-version': credentials.apiVersion,
						'x-client-id': credentials.clientId,
						'x-client-secret': credentials.clientSecret,
					};

					if (requestId) headers['x-request-id'] = requestId;
					if (idempotencyKey) headers['x-idempotency-key'] = idempotencyKey;

					const response = await this.helpers.request({
						method: 'POST',
						url: `${baseUrl}/links/${linkId}/cancel`,
						headers,
						json: true,
					});

					responseData = response;
				} else if (operation === 'fetchPaymentLinkDetails') {
					const linkId = this.getNodeParameter('fetch_details_link_id', i) as string;
					const requestId = this.getNodeParameter('fetch_details_request_id', i, '') as string;
					const idempotencyKey = this.getNodeParameter('fetch_details_idempotency_key', i, '') as string;

					const headers: any = {
						'Content-Type': 'application/json',
						'x-api-version': credentials.apiVersion,
						'x-client-id': credentials.clientId,
						'x-client-secret': credentials.clientSecret,
					};

					if (requestId) headers['x-request-id'] = requestId;
					if (idempotencyKey) headers['x-idempotency-key'] = idempotencyKey;

					const response = await this.helpers.request({
						method: 'GET',
						url: `${baseUrl}/links/${linkId}`,
						headers,
						json: true,
					});

					responseData = response;
				} else if (operation === 'getOrdersForPaymentLink') {
					const linkId = this.getNodeParameter('get_orders_link_id', i) as string;
					const requestId = this.getNodeParameter('get_orders_request_id', i, '') as string;
					const idempotencyKey = this.getNodeParameter('get_orders_idempotency_key', i, '') as string;
					const status = this.getNodeParameter('get_orders_status', i, 'PAID') as string;

					const headers: any = {
						'x-api-version': credentials.apiVersion,
						'x-client-id': credentials.clientId,
						'x-client-secret': credentials.clientSecret,
					};

					if (requestId) headers['x-request-id'] = requestId;
					if (idempotencyKey) headers['x-idempotency-key'] = idempotencyKey;

					const response = await this.helpers.request({
						method: 'GET',
						url: `${baseUrl}/links/${linkId}/orders?status=${status}`,
						headers,
						json: true,
					});

					responseData = response;
				} else if (operation === 'createRefund') {
					const orderId = this.getNodeParameter('refund_order_id', i) as string;
					const refundAmount = this.getNodeParameter('refund_amount', i) as number;
					const refundId = this.getNodeParameter('refund_id', i) as string;
					const refundNote = this.getNodeParameter('refund_note', i) as string;
					const refundSpeed = this.getNodeParameter('refund_speed', i) as string;
					const xRequestId = this.getNodeParameter('x_request_id', i, '') as string;
					const xIdempotencyKey = this.getNodeParameter('x_idempotency_key', i, '') as string;

					const body = {
						refund_amount: refundAmount,
						refund_id: refundId,
						refund_note: refundNote,
						refund_speed: refundSpeed,
					};

					const headers: any = {
						'Content-Type': 'application/json',
						'x-api-version': credentials.apiVersion,
						'x-client-id': credentials.clientId,
						'x-client-secret': credentials.clientSecret,
					};

					if (xRequestId) headers['x-request-id'] = xRequestId;
					if (xIdempotencyKey) headers['x-idempotency-key'] = xIdempotencyKey;

					const response = await this.helpers.request({
						method: 'POST',
						url: `${baseUrl}/orders/${orderId}/refunds`,
						headers,
						body,
						json: true,
					});

					responseData = response;
				} else if (operation === 'getAllRefundsForOrder') {
					const orderId = this.getNodeParameter('get_refunds_order_id', i) as string;
					const requestId = this.getNodeParameter('get_refunds_request_id', i, '') as string;
					const idempotencyKey = this.getNodeParameter('get_refunds_idempotency_key', i, '') as string;

					const headers: any = {
						'x-api-version': credentials.apiVersion,
						'x-client-id': credentials.clientId,
						'x-client-secret': credentials.clientSecret,
					};

					if (requestId) headers['x-request-id'] = requestId;
					if (idempotencyKey) headers['x-idempotency-key'] = idempotencyKey;

					const response = await this.helpers.request({
						method: 'GET',
						url: `${baseUrl}/orders/${orderId}/refunds`,
						headers,
						json: true,
					});

					responseData = response;
				} else if (operation === 'createCashgram') {
					// Get payout authorization token
					const authToken = await CashfreePayments.getPayoutAuthToken(
						String(credentials.payoutClientId).trim(),
						String(credentials.payoutClientSecret).trim(),
						credentials.payoutPublicKey as string,
						credentials.environment as string
					);

					const cashgramData = {
						cashgramId: this.getNodeParameter('cashgram_id', i) as string,
						amount: this.getNodeParameter('cashgram_amount', i) as number,
						name: this.getNodeParameter('cashgram_name', i) as string,
						email: this.getNodeParameter('cashgram_email', i) as string,
						phone: this.getNodeParameter('cashgram_phone', i) as string,
						linkExpiry: this.getNodeParameter('cashgram_link_expiry', i) as string,
						remarks: this.getNodeParameter('cashgram_remarks', i) as string,
						notifyCustomer: this.getNodeParameter('cashgram_notify_customer', i) as number,
					};

					const payoutBaseUrl = CashfreePayments.getPayoutBaseUrl(credentials.environment as string);

					const response = await fetch(`${payoutBaseUrl}/payout/v1/createCashgram`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${authToken}`,
						},
						body: JSON.stringify({
							cashgramId: cashgramData.cashgramId,
							amount: cashgramData.amount,
							name: cashgramData.name,
							email: cashgramData.email,
							phone: cashgramData.phone,
							linkExpiry: cashgramData.linkExpiry,
							remarks: cashgramData.remarks,
							notifyCustomer: cashgramData.notifyCustomer
						}),
					});

					if (!response.ok) {
						const errorData = await response.text();
						throw new NodeApiError(this.getNode(), {
							message: `Cashgram creation failed: ${response.status} - ${errorData}`,
						});
					}

					responseData = await response.json();
				} else if (operation === 'deactivateCashgram') {
					// Get payout authorization token
					const authToken = await CashfreePayments.getPayoutAuthToken(
						credentials.payoutClientId as string,
						credentials.payoutClientSecret as string,
						credentials.payoutPublicKey as string,
						credentials.environment as string
					);

					const cashgramId = this.getNodeParameter('deactivate_cashgram_id', i) as string;

					const payoutBaseUrl = CashfreePayments.getPayoutBaseUrl(credentials.environment as string);

					const response = await fetch(`${payoutBaseUrl}/payout/v1/deactivateCashgram`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${authToken}`,
						},
						body: JSON.stringify({
							cashgramId: cashgramId,
						}),
					});

					if (!response.ok) {
						const errorData = await response.text();
						throw new NodeApiError(this.getNode(), {
							message: `Cashgram deactivation failed: ${response.status} - ${errorData}`,
						});
					}

					responseData = await response.json();
				} else {
					throw new NodeApiError(this.getNode(), {
						message: `Unknown operation: ${operation}`,
					});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: errorMessage }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
