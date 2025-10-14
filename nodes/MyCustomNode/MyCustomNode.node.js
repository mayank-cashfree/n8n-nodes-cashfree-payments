class MyCustomNode {
    constructor() {
        this.description = {
            displayName: 'My Custom Node',
            name: 'myCustomNode',
            icon: 'file:my-icon.svg',
            group: ['transform'],
            version: 1,
            description: 'This is a test node',
            defaults: {
                name: 'My Custom Node',
            },
            inputs: ['main'],
            outputs: ['main'],
            properties: [],
        };
    }

    async execute() {
        return this.prepareOutputData([]);
    }
}

module.exports = { MyCustomNode };
