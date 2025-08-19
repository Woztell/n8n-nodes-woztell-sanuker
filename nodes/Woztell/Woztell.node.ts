import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { botAPINodeFields, botAPIOperations } from './BotAPIDescription';
import {
	getLanguages,
	getMappingButtons,
	getMappingHeaders,
	getMappingVariables,
	getWABAInfo,
	searchChannels,
	searchTemplates,
	WOZTELL_BASE_URL,
	WOZTELL_CREDENTIALS_TYPE,
} from './GenericFunctions';
import { memberAPINodeFields, memberAPIOperations } from './MemberAPIDescription';

export class Woztell implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Woztell',
		name: 'woztell',
		icon: 'file:woztell.svg',
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
					{
						name: 'Member',
						value: 'memberAPI',
					},
				],
				default: 'botAPI',
				disabledOptions: {
					hideOnCloud: true,
				},
			},
			...memberAPIOperations,
			...botAPIOperations,
			...botAPINodeFields,
			...memberAPINodeFields,
		],
	};

	methods = {
		loadOptions: {
			getLanguages,
			getWABAInfo,
		},
		resourceMapping: {
			getMappingVariables,
			getMappingHeaders,
			getMappingButtons,
		},
		listSearch: {
			searchChannels,
			searchTemplates,
		},
	};
}
