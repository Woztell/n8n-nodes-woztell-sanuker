import set from 'lodash/set';
import {
	DeclarativeRestApiSettings,
	FieldType,
	IDataObject,
	IExecutePaginationFunctions,
	IExecuteSingleFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodePropertyOptions,
	IRequestOptions,
	JsonObject,
	jsonParse,
	jsonStringify,
	NodeApiError,
	ResourceMapperFields,
} from 'n8n-workflow';
import { getChannelQuery, getChannelsQuery, getMemberIdQuery, getTreesQuery } from './BaseQueries';

export const WOZTELL_CREDENTIALS_TYPE = 'woztellCredentialApi';

export const WOZTELL_BASE_URL = 'https://open.api.woztell.com/v3';
export const WOZTELL_BOT_BASE_URL = 'https://bot.api.woztell.com/';
const WOZTELL_PUBLIC_API_URL = 'https://api.whatsapp-cloud.woztell.sanuker.com/v1.2/api';

async function apiRequest(
	this: ILoadOptionsFunctions | IExecuteSingleFunctions,
	method: IHttpRequestMethods,
	url: string,
	body: object,
	auth: 'accessToken' | 'publicApiAccessToken' = 'accessToken',
	option: IDataObject = {},
): Promise<any> {
	let headers = {};

	const credentials = await this.getCredentials(WOZTELL_CREDENTIALS_TYPE);
	if (auth === 'publicApiAccessToken') {
		url = `${url}&accessToken=${credentials[auth]}`;
	}

	if (auth === 'accessToken') {
		headers = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${credentials[auth]}`,
		};
	}

	const options: IRequestOptions = {
		headers,
		method,
		body: jsonStringify(body),
		url: url || WOZTELL_BASE_URL,
	};

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	try {
		return await this.helpers.request(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * convert response to array
 * @param this
 * @param requestOptions
 * @returns
 */
export async function getResponse(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const response = this.getNodeParameter('response', null, { ensureType: 'json' });

	if (!requestOptions.body) {
		requestOptions.body = {};
	}

	set(requestOptions.body as IDataObject, 'response', [response]);
	return requestOptions;
}

export async function getResponses(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const responses = this.getNodeParameter('responses', {}) as Record<
		string,
		Array<{
			detail: string;
		}>
	>;

	if (!responses.response?.length) {
		throw new TypeError('Responses - Messsage type not found');
	}

	if (!requestOptions.body) {
		requestOptions.body = {};
	}

	const result = responses.response.reduce((memo: any[], r) => {
		const resp = jsonParse(r.detail) as IDataObject;
		if (Object.keys(resp).length) {
			memo.push(jsonParse(r.detail));
		}
		return memo;
	}, []);

	if (!result.length) {
		throw new TypeError('Responses - Messsage type not found');
	}

	set(requestOptions.body as IDataObject, 'responses', result);
	return requestOptions;
}

export async function getMatedata(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
) {
	const metadata = this.getNodeParameter('metadata', {}) as Record<
		string,
		Array<{
			name: string;
			value: string;
		}>
	>;

	if (!metadata.metadataValues?.length) {
		return requestOptions;
	}

	if (!requestOptions.body) {
		requestOptions.body = {};
	}

	const meta = metadata.metadataValues.reduce((memo: any, r) => {
		memo[r.name] = r.value;
		return memo;
	}, {});

	set(requestOptions.body as IDataObject, 'meta', meta);
	return requestOptions;
}

export const sanitizeRecipientId = (recipientId: string) => recipientId.replace(/[\-\(\)\+]/g, '');

export async function cleanRecipientId(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const recipientId = sanitizeRecipientId(this.getNodeParameter('recipientId') as string);

	if (!requestOptions.body) {
		requestOptions.body = {};
	}

	set(requestOptions.body as IDataObject, 'recipientId', recipientId);

	return requestOptions;
}

/**
 * pagination
 * @param this
 * @param requestData
 * @returns
 */
export async function handleOptionsPagination(
	this: IExecutePaginationFunctions,
	requestData: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	const responseData: INodeExecutionData[] = [];
	requestData.options.body = requestData.options.body || {};
	let hasNextPage = true;
	let responseItem: any = {
		edges: [],
		pageInfo: {},
	};

	do {
		const pageResponseData: INodeExecutionData[] = await this.makeRoutingRequest(requestData);
		const item = pageResponseData[0].json as {
			edges: any[];
			pageInfo: { totalCount: number; endCursor: string; hasNextPage: boolean };
		};

		responseItem.edges.push(...item.edges);
		responseItem.pageInfo = item.pageInfo;

		const endCursor = item.pageInfo.endCursor;
		hasNextPage = item.pageInfo.hasNextPage;
		set(requestData.options.body as IDataObject, 'variables.after', endCursor);
	} while (hasNextPage);

	responseData.push({ json: responseItem });
	return responseData;
}

// ------------------------------------
//         methods: loadOptions
// ------------------------------------

export async function getLanguageTemplate(
	this: ILoadOptionsFunctions | IExecuteSingleFunctions,
): Promise<Template | null> {
	const template = this.getNodeParameter('template', '') as Record<string, any>;

	if (!template.value) {
		return null;
	}

	const language = this.getNodeParameter('language', '', { extractValue: true }) as string;
	if (!language) {
		return null;
	}

	const result = jsonParse(template.value) as TemplateCollection;
	const languageTemplate = result.templates.find((r) => r.language === language);
	if (!languageTemplate) {
		return null;
	}

	return languageTemplate;
}

export async function getLanguages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const template = this.getNodeParameter('template', {}) as Record<string, any>;
	if (!template.value) {
		return [];
	}

	const result = jsonParse(template.value) as TemplateCollection;

	return result.statuses
		.filter((r) => r.status === 'APPROVED')
		.map((r) => {
			return {
				name: r.language,
				value: r.language,
				type: 'string',
			};
		});
}

export async function getWABAInfo(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const channel = this.getNodeParameter('channel', {}) as IDataObject;
	if (!channel?.value) {
		return [];
	}
	const channelId = channel.value;
	const result = await apiRequest.call(this, 'POST', '', {
		query: getChannelQuery,
		variables: { channelId, sortBy: { _id: -1 } },
	});

	if (!result) {
		return [];
	}
	const data = jsonParse(result) as any;
	const node = data?.data?.apiViewer?.channels?.edges?.[0]?.node;
	if (!node) {
		return [];
	}
	const defaultEnv = node.environments.find((r: any) => r.name === 'default');
	if (!defaultEnv) {
		return [];
	}

	// const namespace = defaultEnv.integration.meta.namespace;
	// const integrationId = defaultEnv.integration._id;
	const wabaId = defaultEnv.integration.meta.wabaId;
	// return [
	// 	{
	// 		name: wabaId,
	// 		value: jsonStringify({
	// 			namespace,
	// 			integrationId,
	// 			wabaId,
	// 		}),
	// 	},
	// ];

	return [
		{
			name: wabaId,
			value: wabaId,
		},
	];
}

// ------------------------------------
//         methods: resourceMapping
// ------------------------------------

export async function getMappingVariables(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	let result: {
		format?: any;
		name: string;
		value: string;
		type: string;
	}[] = [];

	const languageTemplate = await getLanguageTemplate.call(this);
	if (!languageTemplate) {
		return { fields: [] };
	}
	const body = languageTemplate.components.find((r) => r.type === 'BODY');
	if (body && body.example?.body_text?.[0]?.length) {
		body?.example?.body_text?.[0].forEach((r: string, i: number) => {
			result.push({
				name: `Variable #${i + 1}`,
				value: `variable${i + 1}`,
				type: 'string',
			});
		});
	}

	const fields = await Promise.all(
		result.map(async (r) => {
			const type: FieldType = 'string';
			const options = undefined;

			return {
				id: r.name,
				displayName: r.name,
				required: true,
				defaultMatch: false,
				display: true,
				type,
				options,
			};
		}),
	);
	return { fields };
}

export async function getMappingHeaders(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const languageTemplate = await getLanguageTemplate.call(this);
	if (!languageTemplate) {
		return { fields: [] };
	}
	const header = languageTemplate.components.find((r) => r.type === 'HEADER');
	if (!header?.format || !['IMAGE', 'DOCUMENT', 'VIDEO'].includes(header.format)) {
		return { fields: [] };
	}

	const type: FieldType = 'string';
	const fields = [
		{
			id: 'url',
			displayName: `${header.format} URL`,
			required: true,
			defaultMatch: false,
			display: true,
			type,
			options: undefined,
		},
	];

	return { fields };
}

export async function getMappingButtons(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const languageTemplate = await getLanguageTemplate.call(this);
	if (!languageTemplate) {
		return { fields: [] };
	}
	const buttons = languageTemplate.components.find((r) => r.type === 'BUTTONS');
	if (!buttons || !buttons?.buttons?.length) {
		return { fields: [] };
	}

	const result = buttons?.buttons
		.filter((r: any) => r.type === 'FLOW' || r.type === 'QUICK_REPLY')
		.map((r: any) => {
			return {
				name: `Payload(${r.type} - ${r.text})`,
				value: `${r.type} - ${r.text}`,
			};
		});

	const type: FieldType = 'string';
	const fields = await Promise.all(
		result.map(async (r: { value: any; name: any }) => {
			const options = undefined;

			return {
				id: r.value,
				displayName: r.name,
				required: true,
				defaultMatch: false,
				display: true,
				type,
				options,
			};
		}),
	);
	return { fields };
}

// ------------------------------------------------------
//         methods: setParams - before send request
// ------------------------------------------------------

export async function setParamsWABAInfo(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const wabaInfo = this.getNodeParameter('wabaId', null, { ensureType: 'json' }) as IDataObject;

	if (!requestOptions.body) {
		requestOptions.body = {};
	}

	set(requestOptions.body as IDataObject, 'namespace', wabaInfo?.namespace);
	set(requestOptions.body as IDataObject, 'integrationId', wabaInfo?.integrationId);
	set(requestOptions.body as IDataObject, 'wabaId', wabaInfo?.wabaId);
	return requestOptions;
}

export async function setParamsContent(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const template = this.getNodeParameter('template', {}) as Record<string, any>;
	if (!template.value) {
		return requestOptions;
	}

	const result = jsonParse(template.value) as TemplateCollection;
	if (!result.name) {
		return requestOptions;
	}

	if (!requestOptions.body) {
		requestOptions.body = {};
	}

	set(requestOptions.body as IDataObject, 'response[0].type', 'TEMPLATE');
	// set(requestOptions.body as IDataObject, 'languagePolicy', 'deterministic');
	set(requestOptions.body as IDataObject, 'response[0].elementName', result.name);
	return requestOptions;
}

export async function setParamsComponents(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const languageTemplate = await getLanguageTemplate.call(this);
	if (!languageTemplate) {
		return requestOptions;
	}

	if (!requestOptions.body) {
		requestOptions.body = {};
	}

	let components: {
		type: string;
		parameters:
			| { type: string; text: string }[]
			| { [x: number]: { link: string }; type: any }[]
			| { type: string; payload?: string; action?: any }[];
		sub_type?: any;
		index?: string;
	}[] = [];

	languageTemplate.components.forEach((r) => {
		if (r.type === 'HEADER' && ['IMAGE', 'DOCUMENT', 'VIDEO'].includes(r?.format)) {
			const headerParams = this.getNodeParameter('headers', {}) as Record<
				string,
				{
					url: string;
				}
			>;
			if (headerParams.value?.url) {
				components.push({
					type: 'header',
					parameters: [
						{
							type: r.format.toLowerCase(),
							[r.format.toLowerCase()]: {
								link: headerParams.value.url,
							},
						},
					],
				});
			}
		}
		if (r.type === 'BODY') {
			const bodyParams = this.getNodeParameter('variables', {}, { ensureType: 'json' }) as Record<
				string,
				Record<string, string>
			>;
			let parameters = [];
			for (let i in bodyParams.value) {
				parameters.push({
					type: 'text',
					text: bodyParams.value[i],
				});
			}
			components.push({
				type: 'body',
				parameters,
			});
		}
		if (r.type === 'BUTTONS') {
			const buttonParams = this.getNodeParameter('buttons', {}, { ensureType: 'json' }) as Record<
				string,
				Record<string, string>
			>;

			r.buttons.forEach((v: any, i: number) => {
				if (v.type === 'QUICK_REPLY') {
					const payload = buttonParams.value[`${v.type} - ${v.text}`];
					components.push({
						type: 'button',
						sub_type: v.type.toLowerCase(),
						index: i + '',
						parameters: [
							{
								type: 'payload',
								payload,
							},
						],
					});
				}

				if (v.type === 'FLOW') {
					const payload = buttonParams.value[`${v.type} - ${v.text}`].trim();
					components.push({
						type: 'button',
						sub_type: v.type.toLowerCase(),
						index: i + '',
						parameters: [
							{
								type: 'action',
								action: {
									flow_token: payload ? `${v.flow_id}:${payload}` : v.flow_id,
								},
							},
						],
					});
				}
			});
		}
	});

	set(requestOptions.body as IDataObject, 'response[0].components', components);
	return requestOptions;
}

export async function setParamsMemberId(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const externalId = this.getNodeParameter('externalId', '') as String;
	const channel = this.getNodeParameter('channel', {}) as IDataObject;
	const channelId = channel.value;

	if (!externalId || !channelId) {
		throw new TypeError('ChannelId and externalId are required');
	}

	const result = await apiRequest.call(this, 'POST', '', {
		query: getMemberIdQuery,
		variables: {
			externalId,
			channelId,
		},
	});

	const data = jsonParse(result) as any;
	const memberId = data?.data?.apiViewer?.member?._id;

	if (!memberId) {
		throw new TypeError('Failed to get memberId');
	}

	if (!requestOptions.body) {
		requestOptions.body = {};
	}

	set(requestOptions.body as IDataObject, 'variables.memberId', memberId);
	return requestOptions;
}

// -----------------------------------
//         methods: listSearch
// -----------------------------------

export async function searchChannels(
	this: ILoadOptionsFunctions,
	search?: string,
	// paginationToken?: string,
): Promise<INodeListSearchResult> {
	let variables = {
		first: 10,
		search,
		sortBy: { _id: -1 },
	};

	const operation = this.getNodeParameter('operation', '') as string;
	if (operation === 'sendTemplates') {
		set(variables, 'type', 'whatsapp-cloud');
	}

	const result = await apiRequest.call(this, 'POST', '', {
		query: getChannelsQuery,
		variables,
	});

	const data = jsonParse(result) as any;
	const results = data?.data?.apiViewer?.channels?.edges?.map((r: any) => {
		return {
			name: `${r?.node?.name}(${r?.node?._id})`,
			value: r?.node?._id,
		};
	});

	return {
		results,
	};
}

export async function searchTemplates(
	this: ILoadOptionsFunctions,
	search?: string,
	// paginationToken?: string,
): Promise<INodeListSearchResult> {
	const wabaId = this.getNodeParameter('wabaId', '') as string;
	const first = 10;

	let query = `wabaId=${wabaId}&first=${first}&status=["APPROVED"]`;
	if (search?.trim().length) {
		query += `&name=${search}`;
	}

	const result = await apiRequest.call(
		this,
		'GET',
		`${WOZTELL_PUBLIC_API_URL}/whatsapp-message-templates?${query}`,
		{},
		'publicApiAccessToken',
	);

	const data = jsonParse(result) as any;
	if (!data.ok) {
		return { results: [] };
	}

	const results = data?.data?.map((r: any) => {
		return {
			name: `${r?.name}`,
			value: jsonStringify(r),
		};
	});

	return {
		results,
	};
}

export async function searchTrees(
	this: ILoadOptionsFunctions,
	search?: string,
	// paginationToken?: string,
): Promise<INodeListSearchResult> {
	let variables = {
		first: 10,
		search,
		sortBy: { _id: -1 },
	};

	const result = await apiRequest.call(this, 'POST', '', {
		query: getTreesQuery,
		variables,
	});

	const data = jsonParse(result) as any;
	const results = data?.data?.apiViewer?.trees?.edges?.map((r: any) => {
		return {
			name: `${r?.node?.name}(${r?.node?._id})`,
			value: r?.node?._id,
		};
	});

	return {
		results,
	};
}

// -----------------------------------
//         types
// -----------------------------------

type Template = {
	language: string;
	status: string;
	rejected_reason: string;
	components: any[];
};

type TemplateCollection = {
	id: string;
	name: string;
	category: string;
	languages: string[];
	statuses: Array<{ language: string; status: string }>;
	templates: Template[];
};
