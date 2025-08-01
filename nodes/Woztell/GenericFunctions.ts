import set from 'lodash/set';
import {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	jsonParse,
} from 'n8n-workflow';

export const WOZTELL_BASE_URL = 'https://open.api.woztell.com/v3';
export const WOZTELL_BOT_BASE_URL = 'https://bot.api.woztell.com/';

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
		return requestOptions;
	}

	if (!requestOptions.body) {
		requestOptions.body = {};
	}

	const result = responses.response.reduce((memo: any[], r) => {
		memo.push(jsonParse(r.detail));
		return memo;
	}, []);

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

export const getCursorPaginator = (
	extractItems: (items: INodeExecutionData[]) => INodeExecutionData[],
) => {
	return async function cursorPagination(
		this: IExecutePaginationFunctions,
		requestOptions: DeclarativeRestApiSettings.ResultOptions,
	): Promise<INodeExecutionData[]> {
		let executions: INodeExecutionData[] = [];
		let responseData: INodeExecutionData[];
		let nextCursor: string | undefined = undefined;
		const returnAll = this.getNodeParameter('returnAll', true) as boolean;

		do {
			(requestOptions.options.body as IDataObject).cursor = nextCursor;
			responseData = await this.makeRoutingRequest(requestOptions);
			const lastItem = responseData[responseData.length - 1].json;
			nextCursor = (lastItem.records as IDataObject)?.cursor as string | undefined;
			executions = executions.concat(extractItems(responseData));
		} while (returnAll && nextCursor);

		return executions;
	};
};

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
	const resourceMapping: { [key: string]: string } = {
		channels: 'data.apiViewer.channels',
	};
	const rootProperty = resourceMapping.channels;

	requestData.options.body = requestData.options.body || {};
	let responseTotal = 0;
	let hasNextPage = true;

	do {
		const pageResponseData: INodeExecutionData[] = await this.makeRoutingRequest(requestData);
		const item = pageResponseData[0].json[rootProperty] as [
			{
				edges: [];
				pageInfo: { totalCount: number; endCursor: string; hasNextPage: boolean };
			},
		];
		item[0].edges.forEach((r) => responseData.push({ json: r }));

		const endCursor = item[0].pageInfo.endCursor;
		hasNextPage = item[0].pageInfo.hasNextPage;
		Object.assign(requestData.options.body, {
			variables: { first: 2, search: '', endCursor, sortBy: { _id: -1 } },
		});
		responseTotal = (item[0].pageInfo.totalCount as number) || 0;
	} while (responseTotal > responseData.length && hasNextPage);

	return responseData;
}
