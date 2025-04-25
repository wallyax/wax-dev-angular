import {apiHtml} from './utils/api.js';

interface Options {
  apiKey?: string;
  rules?: Array<string>;
}

const runner = function (code: String, options: Options) {
  let config: Options = options;
  if (!config.apiKey || !config.apiKey.length) {
    throw new Error(
      'API Key is required to run wax-dev. Please reach out to https://developer.wallyax.com/ to get your API Key.'
    );
  }
  return new Promise((resolve, reject) => {
    fetch(apiHtml, {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      'Authorization': `${config.apiKey}`,
      },
      body: JSON.stringify({ element: code, rules: config.rules, isLinter: "true" }),
    })
      .then((response) => response.json())
      .then((data) => {
        resolve(data);
      })
      .catch((error) => reject(error));
  });
};

export default runner;