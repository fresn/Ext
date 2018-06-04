chrome.webRequest.onBeforeRequest.addListener(BeforeRequestHandler,{urls:[]},['requestBody']);
chrome.webRequest.onBeforeSendHeaders.addListener(BeforeSendHeadersHandler,{urls:[]},['requestHeaders']);
chrome.webRequest.onSendHeaders.addListener(SendHeadersHandler,{urls:[]},['requestHeaders']);
chrome.webRequest.onHeadersReceived.addListener(HeadersReceivedHandler,{urls:[]},['responseHeaders']);
chrome.webRequest.onAuthRequired.addListener(AuthRequiredHandler,{urls:[]},['responseHeaders']);
chrome.webRequest.onBeforeRedirect.addListener(BeforeRedirectHandler,{urls:[]},['responseHeaders']);
chrome.webRequest.onResponseStarted.addListener(ResponseStartedHandler,{urls:[]},['responseHeaders']);
chrome.webRequest.onCompleted.addListener(CompletedHandler,{urls:[]},['responseHeaders']);
chrome.webRequest.onErrorOccurred.addListener(ErrorOccurredHandler,{urls:[]});

function BeforeRequestHandler(detail){
    console.log(detail)
}
function BeforeSendHeadersHandler(detail) {
    console.log(detail)
}
function SendHeadersHandler(detail) {
    console.log(detail)
}
function HeadersReceivedHandler(detail) {
    console.log(detail)
}
function AuthRequiredHandler(detail) {
    console.log(detail)
}
function BeforeRedirectHandler(detail) {
    console.log(detail)
}
function ResponseStartedHandler(detail) {
    console.log(detail)
}
function CompletedHandler(detail) {
    console.log(detail)
}
function ErrorOccurredHandler(detail){
    console.log(detail)
}