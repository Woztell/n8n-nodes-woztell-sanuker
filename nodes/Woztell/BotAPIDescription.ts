import { type INodeProperties } from 'n8n-workflow';

import { getMatedata, getResponses, WOZTELL_BOT_BASE_URL } from './GenericFunctions';

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
		],
		default: 'sendResponses',
		// routing: {
		// 	request: {
		// 		ignoreHttpStatusErrors: true,
		// 	},
		// 	send: {
		// 		// preSend: [setType],
		// 	},
		// 	output: { postReceive: [] },
		// },
		displayOptions: {
			show: {
				resource: ['botAPI'],
			},
			hideOnCloud: true,
		},
	},
	{
		displayName: 'Channel',
		name: 'channelId',
		type: 'options',
		typeOptions: {
			loadOptions: {
				routing: {
					request: {
						body: JSON.stringify({
							query:
								'query getChannels($first: IntMax100, $search: String) {\n  apiViewer {\n    channels(first: $first, search: $search) {\n      edges {\n        node {\n          _id\n          name\n          type\n        }\n      }\n    }\n  }\n}\n',
							variables: { first: 50, search: '', sortBy: { _id: -1 } },
						}),
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data.apiViewer.channels.edges',
								},
							},
							{
								type: 'setKeyValue',
								properties: {
									name: '={{$responseItem.node.name}} ({{$responseItem.node._id}})',
									value: '={{$responseItem.node._id}}',
								},
							},
						],
					},
				},
			},
		},
		default: '',
		placeholder: '',
		required: true,
		description: 'Channel ID in WOZTELL',
		routing: {
			send: {
				type: 'body',
				property: 'channelId',
			},
		},
		displayOptions: {
			show: {
				resource: ['botAPI'],
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
		displayName: 'Response',
		name: 'response',
		type: 'json',
		placeholder: '',
		required: true,
		default: '',
		description:
			'The data you wish to send as a response. You can construct the response object by referencing from integration documentations or copy from Bot builder.',
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
		type: 'string',
		required: true,
		description: 'Target tree you wish to redirect to.',
		default: '',
		routing: {
			send: {
				type: 'body',
				property: 'redirect.tree',
			},
		},
		displayOptions: {
			show: {
				operation: ['redirectMemberToNode'],
			},
		},
	},
	{
		displayName: 'Node CompositeId',
		name: 'redirectNodeCompositeId',
		type: 'string',
		required: true,
		default: '',
		description: 'Target node you wish to redirect to.',
		routing: {
			send: {
				type: 'body',
				property: 'redirect.nodeCompositeId',
			},
		},
		displayOptions: {
			show: {
				operation: ['redirectMemberToNode'],
			},
		},
	},
	{
		displayName: 'Run Pre Action',
		name: 'redirectRunPreAction',
		type: 'boolean',
		default: true,
		description: 'Redirect send response; can be set as true or false',
		routing: {
			send: {
				type: 'body',
				property: 'redirect.runPreAction',
			},
		},
		displayOptions: {
			show: {
				operation: ['redirectMemberToNode'],
			},
		},
	},
	{
		displayName: 'Send Response',
		name: 'redirectSendResponse',
		type: 'boolean',
		default: true,
		description: 'Redirect send response; can be set as true or false',
		routing: {
			send: {
				type: 'body',
				property: 'redirect.sendResponse',
			},
		},
		displayOptions: {
			show: {
				operation: ['redirectMemberToNode'],
			},
		},
	},
	{
		displayName: 'Run Post Action',
		name: 'redirectRunPostAction',
		type: 'boolean',
		default: true,
		description: 'Redirect execute post-action; can be set as true or false',
		routing: {
			send: {
				type: 'body',
				property: 'redirect.runPostAction',
			},
		},
		displayOptions: {
			show: {
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
		default: '',
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
						description: 'Name of the metadata key to add.',
						default: '',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Value to set for the metadata key.',
					},
				],
				// routing: {
				// 	send: {
				// 		type: 'body',
				// 		property: '={{meta.$name}}',
				// 		value: '={{meta.$value}}',
				// 	},
				// },
			},
		],
		displayOptions: {
			// the resources and operations to display this element with
			show: {
				operation: [
					// comma-separated list of operation names
					'redirectMemberToNode',
				],
			},
		},
		routing: {
			send: {
				type: 'body',
				// property: 'meta',
				preSend: [getMatedata],
				// value: '={{$parameter.metadataValues.value}}',
			},
		},
	},
];

export const botAPINodeFields: INodeProperties[] = [...redirectNodeFields, ...metaNodeFields];
