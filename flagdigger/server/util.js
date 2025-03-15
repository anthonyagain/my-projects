function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function onEvent(eventName, currentEventName, func) {
  if(eventName === currentEventName) {
		func();
	}
}

let isObject = (item) => item && typeof item === 'object' && !(item instanceof Date) && !Array.isArray(item);

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function deepMerge(target, source) {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
     if (isObject(source[key])) {
       if (!(key in target))
         Object.assign(output, { [key]: source[key] });
       else
         output[key] = deepMerge(target[key], source[key]);
     } else {
       Object.assign(output, { [key]: source[key] });
     }
    });
  }
  return output;
}

module.exports = {
  "sleep": sleep,
  "onEvent": onEvent,
  "deepMerge": deepMerge
}
