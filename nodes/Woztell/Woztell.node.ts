import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { botAPINodeFields, botAPIOperations } from './BotAPIDescription';
import { WOZTELL_BASE_URL } from './GenericFunctions';

const WOZTELL_CREDENTIALS_TYPE = 'woztellCredential';

export class Woztell implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Woztell',
		name: 'woztell',
		// icon: 'file:woztell.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{ $parameter["resource"] + ": " + $parameter["operation"] }}',
		description: 'Access Woztell API',
		defaults: {
			name: 'Woztell',
		},
		usableAsTool: true,
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: WOZTELL_CREDENTIALS_TYPE,
				required: true,
			},
		],
		requestDefaults: {
			baseURL: WOZTELL_BASE_URL,
			url: '',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Bot API',
						value: 'botAPI',
					},
				],
				default: 'botAPI',
				disabledOptions: {
					hideOnCloud: true,
				},
				// displayOptions: {
				// 	hideOnCloud: true,
				// },
			},
			...botAPIOperations,
			...botAPINodeFields,
		],
	};
}
