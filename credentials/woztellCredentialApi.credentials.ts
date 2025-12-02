import {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
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

	async authenticate(credentials: ICredentialDataDecryptedObject, options: IHttpRequestOptions) {
		options.headers = options.headers || { 'Content-Type': 'application/json' };
		if ((options.baseURL || options.url)?.includes('api.whatsapp-cloud.woztell')) {
			const secret = {
				accessToken: credentials.publicApiAccessToken as string,
			};
			options.qs = options.qs || {};
			if (typeof options.qs === 'object') {
				Object.assign(options.qs, secret);
			}
		} else {
			const secret = {
				Authorization: ('Bearer ' + credentials.accessToken) as string,
			};
			if (typeof options.headers === 'object') {
				Object.assign(options.headers, secret);
			}
		}
		return options;
	}

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
