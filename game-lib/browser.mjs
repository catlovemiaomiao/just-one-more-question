import {handleModelRequest} from './relay.mjs';
import {connectionFor, validModel} from './connections.mjs';

// Reuse the same turn validation and independent live review in the browser.
// This Request is processed in memory: browser-game.invalid is never fetched.
// Only the selected provider's fixed HTTPS endpoint receives a network request.
export async function requestBrowserModel(input, key, fetcher = fetch) {
  if (typeof key !== 'string' || !/^[A-Za-z0-9_.-]{12,500}$/u.test(key)) throw Error('Enter your own valid API key.');
  const provider = connectionFor(input.provider);
  if (!provider || !validModel(provider.id, input.model)) throw Error('Unsupported provider or invalid model ID.');
  if (input.independentReview !== true) throw Error('Independent review is required.');
  const endpoint = provider.kind === 'gemini'
    ? provider.endpoint + encodeURIComponent(input.model) + ':generateContent'
    : provider.endpoint;
  const response = await handleModelRequest(new Request('https://browser-game.invalid/api/model', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + key},
    body: JSON.stringify(input),
  }), {
    fetcher: (url, init) => {
      if (url !== endpoint) throw Error('Unexpected model destination.');
      const headers = new Headers(init.headers);
      headers.delete('User-Agent'); // Browsers manage this header themselves.
      if (provider.kind === 'anthropic') headers.set('anthropic-dangerous-direct-browser-access', 'true');
      return fetcher(url, {
        ...init, headers, mode: 'cors', credentials: 'omit', cache: 'no-store',
        referrerPolicy: 'no-referrer',
      });
    },
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'The model could not reply. Round not counted.');
  return data;
}
