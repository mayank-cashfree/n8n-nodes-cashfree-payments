
# n8n-nodes-cashfree-payments

![Cashfree Payments](./nodes/CashfreePayments/Cashfree-Logo.png)

Integrate [Cashfree Payments](https://www.cashfree.com/) seamlessly into your n8n workflows. **Trusted by 800,000+ businesses** across India and globally for payments, payouts, and financial automation.


## Features

- 🔗 **Payment Links**: Create, cancel, and track payment links with notifications
- 📦 **Order Management**: Complete order lifecycle with 25+ customization options
- 💰 **Smart Refunds**: Automated refunds with instant and standard processing
- 🏦 **Cashgram Payouts**: Secure payout links for vendors and partners
- 🌐 **Multi-environment**: Seamless sandbox to production workflows
- 🔍 **Real-time Tracking**: Request IDs and idempotency for debugging

## Perfect For

- **E-commerce**: Auto-generate payment links, track orders, handle refunds
- **SaaS/Subscriptions**: Manage recurring payments and plan upgrades  
- **Marketplaces**: Automate vendor payouts and split payments
- **Support Teams**: Streamline refund processing and reconciliation
- **AI Workflows**: Embed payment automation in larger business processes

## Quick Start

### Installation
1. Go to **Settings > Community Nodes** in n8n
2. Select **Install** 
3. Enter `n8n-nodes-cashfree-payments`
4. Accept the community node risks and select **Install**

### Credentials
Get your credentials from the [Cashfree Dashboard](https://merchant.cashfree.com/):
- **Client ID** & **Client Secret**: For payment operations
- **Payout Authorization Token**: For Cashgram operations (optional)
- **Environment**: Choose sandbox or production

## Available Operations

| Operation | Description |
|-----------|-------------|
| **Create Order** | Generate payment orders with customer details and preferences |
| **Create Payment Link** | Generate shareable payment links with expiration and notifications |
| **Cancel Payment Link** | Cancel existing payment links |
| **Fetch Payment Link Details** | Get detailed information about payment links |
| **Get Orders for Payment Link** | Retrieve orders associated with payment links |
| **Create Refund** | Process refunds with standard or instant speed |
| **Get All Refunds for Order** | Retrieve complete refund history |
| **Create Cashgram** | Generate payout links for vendors/partners |
| **Deactivate Cashgram** | Deactivate existing payout links |

## Resources

- [Cashfree API Documentation](https://docs.cashfree.com/reference)
- [n8n Community Nodes Guide](https://docs.n8n.io/integrations/community-nodes/)
- [Cashfree Dashboard](https://merchant.cashfree.com/)

---

**Version 1.0.0** | Full Cashfree Payments integration with order management, payment links, refunds, and Cashgram payouts | [MIT License](LICENSE.md)
