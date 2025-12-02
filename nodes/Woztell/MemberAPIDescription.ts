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
								after: '={{$parameter.options.cursor || ""}}',
							},
						},
					},
					send: {
						paginate: '={{ $parameter.options.returnAll }}',
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
				name: 'Get Member Info By ID',
				value: 'getMemberInfo',
				action: 'Get member info by id',
				routing: {
					request: {
						body: {
							query: getMemberInfoQuery,
							variables: {
								channelId: '={{$parameter.channel}}',
								externalId:
									'={{$parameter.externalId.replace(/[\-\(\)\+]/g, "").replaceAll(" ", "")}}',
							},
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data.apiViewer',
								},
							},
							getMemberFolderId,
						],
					},
				},
			},
			{
				name: 'Get Conversation History By ID',
				value: 'getConversationHistory',
				action: 'Get conversation history by id',
				routing: {
					request: {
						body: {
							query: getConversationHistoryQuery,
							variables: {
								channelId: '={{$parameter.channel}}',
								last: '={{$parameter.maxResults || 100}}',
								before: '={{$parameter.options.cursor || ""}}',
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
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Integration ID',
				name: 'integration',
				type: 'options',
				description:
					'If you want to know which folder this member is in, please select the Inbox option',
				default: '',
				typeOptions: {
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
		],
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getMemberInfo'],
			},
		},
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
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 100,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'PageInfo.cursor',
			},
		],
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getMembers'],
			},
		},
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
				value: '={{$parameter.externalId.replace(/[\-\(\)\+]/g, "").replaceAll(" ", "")}}',
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
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
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
						value: '={{Date.parse($parameter.options.from)}}',
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
						value: '={{Date.parse($parameter.options.to)}}',
					},
				},
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'PageInfo.cursor',
			},
		],
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
	...getMembersNodeFields,
	...conversationHistoryNodeFields,
];
