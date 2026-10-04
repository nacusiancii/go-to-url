// Anything that looks like an address is opened; everything else is searched.
function toUrl(input) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(input) && !/^[^/]+:\d+/.test(input)) return input;
  if (/\s/.test(input)) return null;
  if (/^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-f:]+\])(:\d+)?(\/|$)/i.test(input)) return "http://" + input;
  if (/^[^/]+\.[a-z]{2,}(:\d+)?(\/|$)/i.test(input)) return "https://" + input;
  return null;
}
