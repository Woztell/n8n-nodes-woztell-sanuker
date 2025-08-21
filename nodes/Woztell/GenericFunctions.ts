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
import { setTimeout } from 'timers/promises';

export const WOZTELL_CREDENTIALS_TYPE = 'woztellCredentialApi';

export const WOZTELL_BASE_URL = 'https://open.api.woztell.com/v3';
export const WOZTELL_BOT_BASE_URL = 'https://bot.api.woztell.com/';
const WOZTELL_PUBLIC_API_URL = 'https://api.whatsapp-cloud.woztell.sanuker.com/v1.2/api';

const MEDIA_TYPES = ['IMAGE', 'DOCUMENT', 'VIDEO'];

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

		// timeout
		await setTimeout(2000);
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
		variables: { channelId },
	});

	if (!result) {
		return [];
	}
	const data = jsonParse(result) as any;
	const node = data?.data?.apiViewer?.channel;
	if (!node) {
		return [];
	}
	const defaultEnv = node.environments.find((r: any) => r.name === 'default');
	if (!defaultEnv) {
		return [];
	}

	const wabaId = defaultEnv.integration.meta.wabaId;
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
	if (!header?.format || !MEDIA_TYPES.includes(header.format)) {
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

	const result = buttons?.buttons.reduce(
		(memo: { name: string; value: string }[], r: any, i: number) => {
			if (r.type === 'FLOW' || r.type === 'QUICK_REPLY') {
				memo.push({
					name: `Payload(${r.type} - ${r.text})`,
					value: `${r.type}-${i}`,
				});
			}
			return memo;
		},
		[],
	);

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

export async function getMappingCarousel(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const languageTemplate = await getLanguageTemplate.call(this);
	if (!languageTemplate) {
		return { fields: [] };
	}
	const carousel = languageTemplate.components.find((r) => r.type === 'CAROUSEL');
	if (!carousel?.cards?.length) {
		return { fields: [] };
	}

	const result = carousel.cards.reduce((memo: any[], r: any, i: number) => {
		if (r.components?.length) {
			r.components.forEach(
				(v: { type: string; format: string; buttons: { type: string; text: any }[] }) => {
					const cardIndex = `Card #${i + 1}:`;
					if (v.type === 'HEADER' && MEDIA_TYPES.includes(v.format)) {
						memo.push({
							name: `${cardIndex} ${v.format} ID`,
							value: `card${i + 1}Id`,
						});
					}
					if (v.type === 'BUTTONS') {
						v.buttons.forEach((z: { type: string; text: any }, index) => {
							if (z.type === 'QUICK_REPLY') {
								memo.push({
									name: `${cardIndex} Payload(${z.type} - ${z.text})`,
									value: `card${i + 1}${index}`,
								});
							}
						});
					}
				},
			);
		}
		return memo;
	}, []);

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
		parameters?: any[];
		sub_type?: any;
		index?: string;
		cards?: any[];
	}[] = [];

	languageTemplate.components.forEach((r) => {
		if (r.type === 'HEADER' && MEDIA_TYPES.includes(r?.format)) {
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
		if (r.type === 'BODY' && r.example) {
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
				if (v.type === 'QUICK_REPLY' || v.type === 'FLOW') {
					const payload = buttonParams.value[`${v.type}-${i}`];
					components.push({
						type: 'button',
						sub_type: v.type.toLowerCase(),
						index: i + '',
						parameters:
							v.type === 'QUICK_REPLY'
								? [
										{
											type: 'payload',
											payload,
										},
									]
								: [
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
		if (r.type === 'CAROUSEL' && r.cards?.length) {
			const subComponents: any[] = [];
			const carouselParams = this.getNodeParameter(
				'carousel',
				{},
				{ ensureType: 'json' },
			) as Record<string, Record<string, string>>;

			r.cards.forEach((v: any, i: number) => {
				const cardComponents: any[] = [];
				v.components?.forEach((z: { buttons: any; type: string; format: string }) => {
					if (z.type === 'HEADER' && MEDIA_TYPES.includes(z.format)) {
						cardComponents.push({
							type: 'header',
							parameters: [
								{
									type: z.format.toLowerCase(),
									[z.format.toLowerCase()]: {
										id: carouselParams.value[`card${i + 1}Id`],
									},
								},
							],
						});
					}
					if (z.type === 'BUTTONS') {
						z.buttons.forEach((y: { type: string }, yi: number) => {
							if (y.type === 'QUICK_REPLY') {
								const payload = carouselParams.value[`card${i + 1}${yi}`];
								cardComponents.push({
									type: 'button',
									sub_type: y.type,
									index: yi + '',
									parameters: [
										{
											type: 'payload',
											payload,
										},
									],
								});
							}
						});
					}
				});
				if (cardComponents.length) {
					subComponents.push({
						card_index: i,
						components: cardComponents,
					});
				}
			});
			components.push({
				type: 'CAROUSEL',
				cards: subComponents,
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
		first: 15,
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
	const results = data?.data?.apiViewer?.channels?.edges
		?.filter((r: any) => r?.node?.connected)
		.map((r: { node: { name: string; _id: string } }) => {
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
	if (!wabaId) {
		return { results: [] };
	}

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
