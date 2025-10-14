# n8n-nodes-cashfree-payments

This is an n8n community node that provides integration with Cashfree Payments API. It allows you to interact with Cashfree's payment gateway services directly from your n8n workflows.

![n8n.io - Workflow Automation](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-logo.png)

## Features

- **Create Orders**: Generate payment orders for transactions
- **Payment Links**: Create, cancel, and fetch payment link details
- **Refunds**: Process refunds for completed orders
- **Cashgrams**: Create payout links for customers
- **Multi-environment**: Support for both sandbox and production environments

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-cashfree-payments` in **Enter npm package name**.
4. Agree to the [risks](https://docs.n8n.io/integrations/community-nodes/risks/) of using community nodes: select **I understand the risks of installing unverified code from a public source**.
5. Select **Install**.

After installing the node, you can use it like any other node in your workflows.

### Manual installation

To get started with local development:

1. Clone this repository
2. Install dependencies: `pnpm install`
3. Build the node: `pnpm build`
4. Link to n8n: `pnpm link`

## Credentials

This node requires Cashfree API credentials. You'll need to create credentials with the following information:

- **Client ID**: Your Cashfree Payment Gateway Client ID
- **Client Secret**: Your Cashfree Payment Gateway Client Secret
- **Payout Authorization Token**: Required only for Cashgram operations
- **API Version**: Default is "2025-01-01"
- **Environment**: Choose between "sandbox" and "production"

You can obtain these credentials from your [Cashfree Dashboard](https://merchant.cashfree.com/).

## Operations

### Create Order
Creates a new payment order with specified amount, currency, and customer details.

### Create Payment Link
Generates a payment link that can be shared with customers for online payments.

### Cancel Payment Link
Cancels an existing payment link using its ID.

### Fetch Payment Link Details
Retrieves detailed information about a specific payment link.

### Create Refund
Processes refunds for completed orders with options for standard or instant refund speed.

### Create Cashgram
Creates payout links for sending money to customers (requires Payout Authorization Token).

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Cashfree API Documentation](https://docs.cashfree.com/reference)
- [Cashfree Dashboard](https://merchant.cashfree.com/)

## Version history

### 1.0.0
- Initial release
- Support for orders, payment links, refunds, and cashgrams
- Multi-environment support (sandbox/production)
- Comprehensive error handling

## License

[MIT](https://github.com/your-username/n8n-nodes-cashfree-payments/blob/master/LICENSE.md)
