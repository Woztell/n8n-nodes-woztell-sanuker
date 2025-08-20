import { type INodeProperties } from 'n8n-workflow';

import {
	getMatedata,
	getResponses,
	setParamsComponents,
	setParamsContent,
	WOZTELL_BOT_BASE_URL,
} from './GenericFunctions';
import { getNodesQuery } from './BaseQueries';

export const botAPIOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		noDataExpression: true,
		name: 'operation',
		type: 'options',
		placeholder: '',
		options: [
			{
				name: 'Send Responses',
				value: 'sendResponses',
				action: 'Send responses',
				routing: {
					request: {
						baseURL: WOZTELL_BOT_BASE_URL,
						url: '/sendResponses',
					},
				},
			},
			{
				name: 'Redirect Member to Node',
				value: 'redirectMemberToNode',
				action: 'Redirect member to node',
				routing: {
					request: {
						baseURL: WOZTELL_BOT_BASE_URL,
						url: '/redirectMemberToNode',
					},
				},
			},
			{
				name: 'Send Templates',
				value: 'sendTemplates',
				action: 'Send templates',
				routing: {
					request: {
						baseURL: WOZTELL_BOT_BASE_URL,
						url: '/sendResponses',
					},
				},
			},
		],
		default: 'sendResponses',
		displayOptions: {
			show: {
				resource: ['botAPI'],
			},
		},
		disabledOptions: {
			hideOnCloud: true,
		},
	},
	{
		displayName: 'Channel',
		name: 'channel',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		description: 'Channel in WOZTELL',
		required: true,
		requiresDataPath: 'single',
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchChannels',
					searchable: true,
					searchFilterRequired: false,
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
			},
		],
		displayOptions: {
			show: {
				resource: ['botAPI', 'memberAPI'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'channelId',
			},
		},
	},
	{
		displayName: 'RecipientId',
		name: 'recipientId',
		type: 'string',
		default: '',
		required: true,
		description:
			'Recipient ID in integration. E.g. PSID on Facebook, phone number on WhatsApp, etc',
		hint: 'When entering a phone number, make sure to include the country code',
		requiresDataPath: 'single',
		routing: {
			send: {
				type: 'body',
				// preSend: [cleanPhoneNumber],
				property: 'recipientId',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
			},
		},
	},
	{
		displayName: 'Responses',
		name: 'responses',
		type: 'fixedCollection',
		placeholder: 'Add Response',
		default: {},
		description:
			'The data you wish to send as a response. You can construct the response object by referencing from integration documentations or copy from Bot builder.',
		typeOptions: {
			multipleValues: true,
		},
		required: true,
		options: [
			{
				displayName: 'Response',
				name: 'response',
				values: [
					{
						displayName: 'Response(JSON)',
						name: 'detail',
						type: 'json',
						required: true,
						default: '{}',
					},
				],
			},
		],
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['sendResponses'],
			},
		},
		routing: {
			send: {
				type: 'body',
				preSend: [getResponses],
			},
		},
	},
];

export const redirectNodeFields: INodeProperties[] = [
	// ----------------------------------
	//         type: redirect
	// ----------------------------------

	{
		displayName: 'Tree',
		name: 'tree',
		type: 'resourceLocator',
		default: { mode: 'id', value: '' },
		required: true,
		modes: [
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
			},
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchTrees',
					searchable: true,
					searchFilterRequired: false,
				},
			},
		],
		description: 'Target tree you wish to redirect to',
		routing: {
			send: {
				type: 'body',
				property: 'redirect.tree',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['redirectMemberToNode'],
			},
		},
	},
	{
		displayName: 'Node CompositeId',
		name: 'redirectNodeCompositeId',
		type: 'options',
		required: true,
		typeOptions: {
			loadOptionsDependsOn: ['tree.value'],
			loadOptions: {
				routing: {
					request: {
						body: {
							query: getNodesQuery,
							variables: {
								treeIds: ['={{$parameter.tree}}'],
							},
						},
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data.apiViewer.nodes.edges',
								},
							},
							{
								type: 'setKeyValue',
								properties: {
									name: '={{$responseItem.node.name}} ({{$responseItem.node.compositeId}})',
									value: '={{$responseItem.node.compositeId}}',
								},
							},
						],
					},
				},
			},
		},
		default: '',
		description: 'Target node you wish to redirect to',
		routing: {
			send: {
				type: 'body',
				property: 'redirect.nodeCompositeId',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['redirectMemberToNode'],
			},
		},
	},
	{
		displayName: 'Run Pre Action',
		name: 'redirectRunPreAction',
		type: 'boolean',
		default: true,
		description: 'Whether to run Pre-actions after redirect; can be set as true or false',
		routing: {
			send: {
				type: 'body',
				property: 'redirect.runPreAction',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['redirectMemberToNode'],
				tree: [
					{
						_cnd: {
							exists: true,
						},
					},
				],
			},
		},
	},
	{
		displayName: 'Send Response',
		name: 'redirectSendResponse',
		type: 'boolean',
		default: true,
		description: 'Whether to send Response after redirect; can be set as true or false',
		routing: {
			send: {
				type: 'body',
				property: 'redirect.sendResponse',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['redirectMemberToNode'],
			},
		},
	},
	{
		displayName: 'Run Post Action',
		name: 'redirectRunPostAction',
		type: 'boolean',
		default: true,
		description: 'Whether to run post-actions after redirect; can be set as true or false',
		routing: {
			send: {
				type: 'body',
				property: 'redirect.runPostAction',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['redirectMemberToNode'],
			},
		},
	},
];

export const metaNodeFields: INodeProperties[] = [
	{
		displayName: 'Metadata',
		name: 'metadata',
		placeholder: 'Add Metadata',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: true,
		},
		description:
			'Meta object provided to the node. Meta object can be accessed in target node via this.agendaMeta.',
		options: [
			{
				name: 'metadataValues',
				displayName: 'Metadata',
				description: '',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						description: 'Name of the metadata key to add',
						default: '',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Value to set for the metadata key',
					},
				],
			},
		],
		displayOptions: {
			// the resources and operations to display this element with
			show: {
				resource: ['botAPI'],
				operation: [
					// comma-separated list of operation names
					'redirectMemberToNode',
				],
			},
		},
		routing: {
			send: {
				type: 'body',
				preSend: [getMatedata],
			},
		},
	},
];

export const templateFields: INodeProperties[] = [
	{
		displayName: 'WABA {Entity} Name or ID',
		name: 'wabaId',
		type: 'options',
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getWABAInfo',
			loadOptionsDependsOn: ['channel.value'],
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['sendTemplates'],
			},
		},
	},
	{
		displayName: 'Template',
		name: 'template',
		type: 'resourceLocator',
		default: { mode: 'list', value: [] },
		description: 'Message Template',
		required: true,
		modes: [
			{
				displayName: 'List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchTemplates',
					searchable: true,
					searchFilterRequired: false,
				},
			},
		],
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['sendTemplates'],
				channel: [
					{
						_cnd: {
							exists: true,
						},
					},
				],
				wabaId: [
					{
						_cnd: {
							exists: true,
						},
					},
				],
			},
		},
		routing: {
			send: {
				type: 'body',
				preSend: [setParamsContent],
			},
		},
	},
	{
		displayName: 'Language {Entity} Name or ID',
		name: 'language',
		type: 'options',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getLanguages',
			loadOptionsDependsOn: ['template.value'],
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['sendTemplates'],
				template: [
					{
						_cnd: {
							exists: true,
						},
					},
				],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'response[0].languageCode',
			},
		},
	},
	{
		displayName: 'Headers',
		name: 'headers', // The name used to reference the element UI within the code
		type: 'resourceMapper', // The UI element type
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		required: true,
		// See "Resource mapper type options interface" below for the full typeOptions specification
		typeOptions: {
			loadOptionsDependsOn: ['template.value', 'language'],
			resourceMapper: {
				resourceMapperMethod: 'getMappingHeaders',
				mode: 'add',
				fieldWords: {
					singular: 'header',
					plural: 'headers',
				},
				addAllFields: true,
				multiKeyMatch: false,
				supportAutoMap: false,
				valuesLabel: 'Header',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['sendTemplates'],
			},
		},
		routing: {
			send: {
				type: 'body',
				preSend: [setParamsComponents],
			},
		},
	},
	{
		displayName: 'Variables',
		name: 'variables', // The name used to reference the element UI within the code
		type: 'resourceMapper', // The UI element type
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		required: true,
		// See "Resource mapper type options interface" below for the full typeOptions specification
		typeOptions: {
			loadOptionsDependsOn: ['template.value', 'language'],
			resourceMapper: {
				resourceMapperMethod: 'getMappingVariables',
				mode: 'add',
				fieldWords: {
					singular: 'variable',
					plural: 'variables',
				},
				addAllFields: true,
				multiKeyMatch: false,
				supportAutoMap: false,
				valuesLabel: 'Body',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['sendTemplates'],
			},
		},
		routing: {
			send: {
				type: 'body',
				preSend: [setParamsComponents],
			},
		},
	},
	{
		displayName: 'Buttons',
		name: 'buttons', // The name used to reference the element UI within the code
		type: 'resourceMapper', // The UI element type
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		required: true,
		// See "Resource mapper type options interface" below for the full typeOptions specification
		typeOptions: {
			loadOptionsDependsOn: ['template.value', 'language'],
			resourceMapper: {
				resourceMapperMethod: 'getMappingButtons',
				mode: 'add',
				fieldWords: {
					singular: 'button',
					plural: 'buttons',
				},
				addAllFields: true,
				multiKeyMatch: false,
				supportAutoMap: false,
				valuesLabel: 'Buttons',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['sendTemplates'],
			},
		},
		routing: {
			send: {
				type: 'body',
				preSend: [setParamsComponents],
			},
		},
	},
	{
		displayName: 'Carousel',
		name: 'carousel',
		type: 'resourceMapper',
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		required: true,
		typeOptions: {
			loadOptionsDependsOn: ['template.value', 'language'],
			resourceMapper: {
				resourceMapperMethod: 'getMappingCarousel',
				mode: 'add',
				fieldWords: {
					singular: 'card',
					plural: 'cards',
				},
				addAllFields: true,
				multiKeyMatch: false,
				supportAutoMap: false,
				valuesLabel: 'Carousel',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
				operation: ['sendTemplates'],
			},
		},
		routing: {
			send: {
				type: 'body',
				preSend: [setParamsComponents],
			},
		},
	},
];

export const botAPINodeFields: INodeProperties[] = [
	...redirectNodeFields,
	...metaNodeFields,
	...templateFields,
];
