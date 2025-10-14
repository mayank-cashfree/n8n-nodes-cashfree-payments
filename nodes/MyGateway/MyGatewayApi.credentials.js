class MyGatewayApi {
    name = 'MyGatewayApi';
    displayName = 'My Gateway API';
    properties = [
        {
            displayName: 'API Key (Client ID)',
            name: 'apiKey',
            type: 'string',
            default: '',
        },
        {
            displayName: 'API Secret (Client Secret)',
            name: 'apiSecret',
            type: 'password',
            default: '',
        },
    ];
}

module.exports = { MyGatewayApi };