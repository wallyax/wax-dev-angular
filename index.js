const {apiHtml}= require('./src/utils/api.js');
const runner = (code, options) => {
  const styles = {
    Severe: 'color: #ffb3b3; font-weight: bold;',
    Moderate: 'color: #ffd500; font-weight: bold;',
    Minor: 'color: white; font-weight: bold;',
    default: 'font-weight:bold;'
  };

  return new Promise((resolve, reject) => {
    if (!options.apiKey || !options.apiKey.length) {
      return reject(new Error(
        'API Key is required to run wax-dev. Please reach out to https://developer.wallyax.com/ to get your API Key.'
      ));
    }

    try {
      fetch(apiHtml, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `${options.apiKey}`,
        },
        body: JSON.stringify({ element: code, rules: options.rules, isLinter: "true" }),
      })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.groupCollapsed('%cAccessibility Check Results', 'color:#FED600;');
          console.log(data?.error);
          return resolve([{ error: data?.error || `Error: ${response.status}` }]);
        }
        console.groupCollapsed('%cAccessibility Check Results', 'color:#FED600;');
        if(data && data?.responseCode==429){
          console.log('Too Many Requests')
          resolve(data);
        }
        else if (data && data.length > 0) {
          const groupedResults = data?.reduce((acc, item) => {
            if (!acc[item.severity]) {
              acc[item.severity] = [];
            }
            acc[item.severity].push(item);
            return acc;
          }, {});
          Object.keys(groupedResults).forEach((severity) => {
            console.groupCollapsed(`%c${severity}`, styles[severity] || styles.default);
            groupedResults[severity].forEach((issue) => {
              console.groupCollapsed(`Element: %c${issue.element}`, styles.default);
              const code = issue.code?.split('_')[0];
              if (code) {
                console.log('Code:', code);
              }
              const logItems = [
                { key: 'element', label: 'Element' },
                { key: 'message', label: 'Message' },
                { key: 'severity', label: 'Severity' },
                { key: 'groupData.why_issue', label: 'Impact' },
                { key: 'groupData.what_is_missing', label: 'What is missing' },
                { key: 'groupData.how_to_solve', label: 'How to fix' },
                { key: 'groupData.example_before', label: 'Example before' },
                { key: 'groupData.example_after', label: 'Example after' }
              ];
          
              logItems.forEach(({ key, label }) => {
                const keys = key.split('.');
                let value = issue;
                for (let k of keys) {
                  value = value?.[k];
                  if (value === undefined || value === null) break;
                }
                if (value !== undefined && value !== null && value !== '') {
                  console.log(`${label}:`, value);
                }
              });
              console.groupEnd();
            });
            console.groupEnd();
          });
        } else {
          console.log('No issues found');
        }
        console.groupEnd();
        const cleanedData = data.map((item) => {
          const {
            element,
            message,
            description,
            severity,
            code,
            groupData = {}
          } = item;
      
          const cleanedItem = {};
          if (element) cleanedItem.element = element;
          if (message) cleanedItem.message = message;
          if (severity) cleanedItem.severity = severity;
          if (groupData.why_issue) cleanedItem.impact = groupData.why_issue;
          if (groupData.what_is_missing) cleanedItem.what_is_missing = groupData.what_is_missing;
          if (groupData.how_to_solve) cleanedItem.how_to_fix = groupData.how_to_solve;
          if (description) cleanedItem.description = description;
          if (groupData.example_before) cleanedItem.example_before = groupData.example_before;
          if (groupData.example_after) cleanedItem.example_after = groupData.example_after;
          if (code) cleanedItem.code = code.split('_')[0].split(',')[0];
  
      
          return cleanedItem;
        });
        resolve(cleanedData);
      })
      .catch(error => {
        console.log('Error:', error);
        reject(error);
      });
    } catch (error) {
      console.log('Unexpected error:', error);
      reject(error);
    }
  });
};

const waxObserver = (options) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        console.log('DOM changed:', mutation);
        // Run your function when a mutation is detected
        runner(document.documentElement.outerHTML, options)
          .then(result => console.log('Runner result:', result))
          .catch(error => console.error('Runner error:', error));
      }
    });
  });

  // Start observing the entire document body for changes
  observer.observe(document.body, {
    childList: true,
    attributes: true,
    subtree: true
  });

  return observer;
};

module.exports = { runner, waxObserver };
