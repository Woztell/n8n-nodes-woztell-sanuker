import { type INodeProperties } from 'n8n-workflow';

import {
	addMemberTags,
	getConversationHistoryQuery,
	getMemberInfoQuery,
	getMembersQuery,
} from './BaseQueries';
import { handleOptionsPagination, setParamsMemberId } from './GenericFunctions';

export const memberAPIOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		noDataExpression: true,
		name: 'operation',
		type: 'options',
		placeholder: '',
		options: [
			{
				name: 'Get Members',
				value: 'getMembers',
				action: 'Get Members',
				routing: {
					request: {
						body: {
							query: getMembersQuery,
							variables: {
								tagFilters: [{ operator: 'IN' }],
								first: '={{$parameter.maxResults || 100}}',
								channelId: '={{$parameter.channel}}',
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
				name: 'Member Tagging',
				value: 'memberTagging',
				action: 'Member Tagging',
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
				action: 'Get Member Info',
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
						],
					},
				},
			},
			{
				name: 'Get Conversation History',
				value: 'getConversationHistory',
				action: 'Get Conversation History',
				routing: {
					request: {
						body: {
							query: getConversationHistoryQuery,
							variables: {
								channelId: '={{$parameter.channel}}',
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
									property: 'data.apiViewer.conversationHistory.edges',
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
		displayName: 'Tag Filters',
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
		displayName: 'Limit',
		name: 'maxResults',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getMembers'],
				returnAll: [false],
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
		displayName: 'Cursor',
		name: 'after',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['getMembers'],
				returnAll: [false],
			},
		},
		default: '',
		placeholder: 'NjNkM2UwNzRiY2JlM2Q4M2RjMW123456',
		description: 'pageInfo.endCursor',
		routing: {
			send: {
				type: 'body',
				property: 'variables.after',
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
			},
		},
		displayOptions: {
			show: {
				resource: ['memberAPI'],
				operation: ['memberTagging', 'getMemberInfo', 'getConversationHistory'],
			},
		},
	},
	// {
	// 	displayName: 'ExternalIds',
	// 	name: 'externalIds',
	// 	type: 'string',
	// 	default: '',
	// 	required: true,
	// 	description: 'ID in integration. E.g. PSID on Facebook, phone number on WhatsApp, etc',
	// 	hint: 'When entering a phone number, make sure to include the country code',
	// 	requiresDataPath: 'multiple',
	// 	routing: {
	// 		send: {
	// 			type: 'body',
	// 			property: 'variables.input.externalIds',
	// 		},
	// 	},
	// 	displayOptions: {
	// 		show: {
	// 			resource: ['memberAPI'],
	// 			operation: ['memberTagging'],
	// 			batchUpdate: [
	// 				{
	// 					_cnd: {
	// 						eq: true,
	// 					},
	// 				},
	// 			],
	// 		},
	// 	},
	// },
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		required: true,
		description: 'Enter tags, separated by commas',
		placeholder: 'n8n,Good',
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

export const memberAPINodeFields: INodeProperties[] = [
	...getMembersNodeFields,
	...taggingNodeFields,
];
