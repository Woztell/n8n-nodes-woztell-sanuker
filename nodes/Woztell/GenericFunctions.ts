import set from 'lodash/set';
import { IDataObject, IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

export const WOZTELL_BASE_URL = 'https://open.api.woztell.com/v3';
export const WOZTELL_BOT_BASE_URL = 'https://bot.api.woztell.com/';

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
	const response = this.getNodeParameter('response', null, { ensureType: 'json' });

	if (!requestOptions.body) {
		requestOptions.body = {};
	}

	set(requestOptions.body as IDataObject, 'response', [response]);
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
