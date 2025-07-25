import {
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	NodeConnectionType,
} from 'n8n-workflow';

export class WoztellTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Woztell Trigger',
		name: 'woztellTrigger',
		// icon: 'file:woztell.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Handle events via webhooks',
		defaults: {
			name: 'Woztell Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		// credentials: [
		// 	{
		// 		name: 'woztellTriggerApi',
		// 		required: true,
		// 	},
		// ],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'lastNode',
				responseData: 'allEntries',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Channel ID',
						name: 'channelId',
						type: 'string',
						default: '',
						description: '',
						displayOptions: {
							show: {},
						},
					},
					{
						displayName: 'Recipient ID',
						name: 'recipientId',
						type: 'string',
						default: '',
						description: '',
						displayOptions: {
							show: {},
						},
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		if (!bodyData) {
			const channelId = this.getNodeParameter('channelId', '') as string;
			const recipientId = this.getNodeParameter('recipientId', '') as string;
			return {
				workflowData: [this.helpers.returnJsonArray({ channelId, recipientId })],
			};
		}

		return {
			workflowData: [this.helpers.returnJsonArray(bodyData)],
		};
	}
}
