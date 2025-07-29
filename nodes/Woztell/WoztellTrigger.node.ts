import {
	IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	NodeConnectionType,
} from 'n8n-workflow';
import { v4 as uuidv4 } from 'uuid';

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
				path: '={{$parameter["path"]}}',
				isFullPath: true,
			},
		],
		properties: [
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: uuidv4(),
				required: true,
				placeholder: 'webhook',
				description: 'The path for the webhook URL',
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
						description: '',
						displayOptions: {
							show: {},
						},
					},
					{
						displayName: 'Event Type',
						name: 'eventType',
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
		const filterFields = this.getNodeParameter('filterFields') as IDataObject;
		const { channelId, eventType } = filterFields;

		if (!channelId && !eventType) {
			return {
				workflowData: [this.helpers.returnJsonArray(bodyData)],
			};
		}

		// filter
		if (channelId && channelId !== bodyData?.channelId) {
			const res = this.getResponseObject();
			res.status(400).json({ message: 'ChannelId is not valid' });
			throw new Error('ChannelId is not valid');
		}
		if (eventType && eventType !== bodyData?.eventType) {
			const res = this.getResponseObject();
			res.status(400).json({ message: 'EventType is not valid' });
			throw new Error('EventType is not valid');
		}

		return {
			workflowData: [this.helpers.returnJsonArray(bodyData)],
		};
	}
}
