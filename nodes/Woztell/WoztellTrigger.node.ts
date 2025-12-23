import {
	IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

export class WoztellTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WOZTELL Trigger',
		name: 'woztellTrigger',
		icon: 'file:woztell.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Handle WOZTELL events via webhooks',
		defaults: {
			name: 'WOZTELL Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'lastNode',
				responseData: 'allEntries',
				path: `={{$parameter["path"] || $nodeId}}`,
				isFullPath: true,
			},
		],
		properties: [
			{
				displayName: 'Webhook Path',
				name: 'path',
				type: 'string',
				default: '',
				description: 'The path for the webhook URL',
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				default: 'woztellEvent',
				options: [
					{
						name: 'WOZTELL Event',
						value: 'woztellEvent',
					},
				],
			},
			{
				displayName: 'Filter Fields',
				name: 'filterFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Channel ID',
						name: 'channelId',
						type: 'string',
						default: '',
						displayOptions: {
							show: {},
						},
					},
					{
						displayName: 'Event Type',
						name: 'eventType',
						type: 'string',
						default: '',
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
		const filterFields = this.getNodeParameter('filterFields') as IDataObject;
		const { channelId, eventType } = filterFields;

		if (!channelId && !eventType) {
			return {
				workflowData: [this.helpers.returnJsonArray(bodyData)],
			};
		}

		// filter
		if (channelId && channelId !== bodyData?.channel) {
			const res = this.getResponseObject();
			res.status(400).json({ message: 'ChannelId is not valid' });
			throw new NodeOperationError(this.getNode(), 'ChannelId is not valid');
		}
		if (eventType && (eventType as string).toUpperCase() !== bodyData?.eventType) {
			const res = this.getResponseObject();
			res.status(400).json({ message: 'EventType is not valid' });
			throw new NodeOperationError(this.getNode(), 'EventType is not valid');
		}

		return {
			workflowData: [this.helpers.returnJsonArray(bodyData)],
		};
	}
}
