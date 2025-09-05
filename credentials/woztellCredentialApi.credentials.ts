import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class woztellCredentialApi implements ICredentialType {
	name = 'woztellCredentialApi';
	displayName = 'WOZTELL API';

	documentationUrl = 'https://doc.woztell.com/docs/documentations/settings/access-token';

	properties: INodeProperties[] = [
		// The credentials to get from user and save encrypted.
		// Properties can be defined exactly in the same way
		// as node properties.
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			hint: 'Please enable channel list permission.',
			default: '',
		},
		{
			displayName: 'WOZTELL Channel API',
			name: 'publicApiAccessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			description: 'Please configure the token to use the WOZTELL Channel API',
			hint: 'The token is located at WOZTELL -> Channels -> Channel(Edit) -> Advanced Access -> Access Tokens',
			default: '',
		},
	];

	// This credential is currently not used by any node directly
	// but the HTTP Request node can use it to make requests.
	// The credential is also testable due to the `test` property below
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
			// qs: {
			// 	accessToken: '={{$credentials.accessToken}}',
			// },
		},
	};

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://open.api.woztell.com/v3',
			method: 'POST',
			body: JSON.stringify({
				query:
					'query getChannels($first: IntMax100, $type: String, $search: String) {\n  apiViewer {\n    channels(first: $first, type: $type, search: $search) {\n      edges {\n        node {\n          _id\n          name\n          type\n        }\n      }\n    }\n  }\n}\n',
				variables: { first: 1, type: 'whatsapp-cloud', search: '', sortBy: { _id: -1 } },
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'errors[0].message',
					value: 'User is not authenticated.',
					message: 'Invalid access token',
				},
			},
		],
	};
}
