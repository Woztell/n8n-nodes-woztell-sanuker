import { type INodeProperties } from 'n8n-workflow';

import {
	addMemberTags,
	getConversationHistoryQuery,
	getIntegrations,
	getMemberInfoQuery,
	getMembersQuery,
} from './BaseQueries';
import { getMemberFolderId, handleOptionsPagination, setParamsMemberId } from './GenericFunctions';

export const memberAPIOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		noDataExpression: true,
		name: 'operation',
		type: 'options',
		placeholder: '',
		options: [
			{
				name: 'Get Members By Tags',
				value: 'getMembers',
				action: 'Get members by tags',
				routing: {
					request: {
						body: {
							query: getMembersQuery,
							variables: {
								tagFilters: [{ operator: 'IN' }],
								first: '={{$parameter.maxResults || 100}}',
								channelId: '={{$parameter.channel}}',
								after: '={{$parameter.cursor || ""}}',
							},
						},
					},
					send: {
						paginate: '={{ $parameter.returnAll }}',
					},
					operations: {
						pagination: handleOptionsPagination,
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data.apiViewer.members',
								},
							},
						],
					},
				},
			},
			{
				name: 'Set Member Tags',
				value: 'memberTagging',
				action: 'Set member tags',
				routing: {
					request: {
						body: {
							query: addMemberTags,
							variables: {
								input: {
									channel: '={{$parameter.channel}}',
								},
							},
						},
					},
				},
			},
			{
				name: 'Get Member Info',
				value: 'getMemberInfo',
				action: 'Get member info',
				routing: {
					request: {
						body: {
							query: getMemberInfoQuery,
							variables: {
								channelId: '={{$parameter.channel}}',
								externalId: '={{$parameter.externalId}}',
							},
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data.apiViewer.member',
								},
							},
							getMemberFolderId,
						],
					},
				},
			},
			{
				name: 'Get Conversation History',
				value: 'getConversationHistory',
				action: 'Get conversation history',
				routing: {
					request: {
						body: {
							query: getConversationHistoryQuery,
							variables: {
								channelId: '={{$parameter.channel}}',
								last: '={{$parameter.maxResults || 100}}',
								before: '={{$parameter.cursor || ""}}',
							},
						},
					},
					send: {
						preSend: [setParamsMemberId],
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data.apiViewer.conversationHistory',
								},
							},
						],
					},
				},
			},
		],
		default: 'getMembers',
		displayOptions: {
			show: {
				resource: ['memberAPI'],
			},
		},
		disabledOptions: {
			hideOnCloud: true,
		},
	},
];

export const getMembersNodeFields: INodeProperties[] = [
	// ----------------------------------
	//         type: getMembers
	// ----------------------------------
	{
		displayName: 'Tags, Comma Separation',
		name: 'tagFilters',
		type: 'string',
		required: true,
		description: 'Enter tags, separated by commas',
		default: '',
		routing: {
			send: {
				type: 'body',
				property: 'variables.tagFilters[0].tags',
				value: '={{$parameter.tagFilters.split(/,|，/).map(r => r.trim())}}',
			},
		},
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getMembers'],
			},
		},
	},
	{
		displayName: 'Get Folder',
		name: 'getFolder',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getMemberInfo'],
			},
		},
		default: false,
	},
	{
		displayName: 'Integration ID',
		name: 'integration',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getMemberInfo'],
				getFolder: [true],
			},
		},
		default: '',
		typeOptions: {
			// loadOptionsDependsOn: ['getFolder'],
			loadOptions: {
				routing: {
					request: {
						body: {
							query: getIntegrations,
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data.apiViewer.installedIntegrations',
								},
							},
							{
								type: 'filter',
								properties: {
									pass: '={{$responseItem.integrationId === "inbox"}}',
								},
							},
							{
								type: 'setKeyValue',
								properties: {
									name: '={{$responseItem.integrationId}}',
									value: '={{JSON.stringify($responseItem)}}',
								},
							},
						],
					},
				},
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getMembers'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit, up to 100',
		name: 'maxResults',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getMembers', 'getConversationHistory'],
			},
			hide: {
				returnAll: [true],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 100,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Cursor, Optional',
		name: 'cursor',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getMembers', 'getConversationHistory'],
			},
			hide: {
				returnAll: [true],
			},
		},
		default: '',
		description: 'PageInfo.cursor',
	},
];

export const taggingNodeFields: INodeProperties[] = [
	{
		displayName: 'ExternalId',
		name: 'externalId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID in integration. E.g. PSID on Facebook, phone number on WhatsApp, etc',
		hint: 'When entering a phone number, make sure to include the country code',
		requiresDataPath: 'single',
		routing: {
			send: {
				type: 'body',
				property: 'variables.input.externalId',
			},
		},
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['memberTagging', 'getMemberInfo', 'getConversationHistory'],
			},
		},
	},
	{
		displayName: 'Tags, Comma Separation',
		name: 'tags',
		type: 'string',
		required: true,
		description: 'Enter tags, separated by commas',
		placeholder: '',
		default: '',
		routing: {
			send: {
				type: 'body',
				property: 'variables.input.tags',
				value: '={{$parameter.tags.split(/,|，/).map(r => r.trim())}}',
			},
		},
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['memberTagging'],
			},
		},
	},
];

export const conversationHistoryNodeFields: INodeProperties[] = [
	{
		displayName: 'From',
		name: 'from',
		type: 'dateTime',
		default: '',
		description: 'Filter chats that were created after the set time',
		routing: {
			send: {
				type: 'body',
				property: 'variables.from',
				value: '={{Date.parse($parameter.from)}}',
			},
		},
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getConversationHistory'],
			},
		},
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'dateTime',
		description: 'Filter chats that were created before the set time',
		default: '',
		routing: {
			send: {
				type: 'body',
				property: 'variables.to',
				value: '={{Date.parse($parameter.to)}}',
			},
		},
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getConversationHistory'],
			},
		},
	},
];

export const memberAPINodeFields: INodeProperties[] = [
	...taggingNodeFields,
	...conversationHistoryNodeFields,
	...getMembersNodeFields,
];
