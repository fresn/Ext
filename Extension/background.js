chrome.webRequest.onBeforeRequest.addListener(BeforeRequestHandler, {urls: []}, ['requestBody']);
chrome.webRequest.onBeforeSendHeaders.addListener(BeforeSendHeadersHandler, {urls: []}, ['requestHeaders']);
chrome.webRequest.onSendHeaders.addListener(SendHeadersHandler, {urls: []}, ['requestHeaders']);
chrome.webRequest.onHeadersReceived.addListener(HeadersReceivedHandler, {urls: []}, ['responseHeaders']);
chrome.webRequest.onAuthRequired.addListener(AuthRequiredHandler, {urls: []}, ['responseHeaders']);
chrome.webRequest.onBeforeRedirect.addListener(BeforeRedirectHandler, {urls: []}, ['responseHeaders']);
chrome.webRequest.onResponseStarted.addListener(ResponseStartedHandler, {urls: []}, ['responseHeaders']);
chrome.webRequest.onCompleted.addListener(CompletedHandler, {urls: []}, ['responseHeaders']);
chrome.webRequest.onErrorOccurred.addListener(ErrorOccurredHandler, {urls: []});

let IfDebug = false;

TAFFY.extend("avg", function (c) {
    // This runs the query or returns the results if it has already run
    this.context({
        results: this.getDBI().query(this.context())
    });
    // setup the sum
    let total = 0;
    // loop over every record in the results and sum up the column.
    TAFFY.each(this.context().results, function (r) {
        total = total + r[c];
    });

    // divide the total by the number of records and return
    return total / this.context().results.length;
});


let reqObjects = [];


let ReqAnalysis = {
    getErrReqS: function () {
        let db = TAFFY(reqObjects);
        return db(function () {
            return this.TimeErrorOccurred
        }).get()
    },
    getTopLevel: function () {
        let db = TAFFY(reqObjects);
        return db(function () {
            return (
                (this.type === 'main_frame' ||
                    this.type === 'sub_frame' ||
                    this.type === 'object' ||
                    this.type === 'xmlhttprequest') &&
                this.frameId === 0&&
                !this.TimeErrorOccurred
            );
        }).get();
    },
    getUrls:function () {
        let db = TAFFY(reqObjects);
        return db(function () {
            return (
                (this.type === 'main_frame' ||
                    this.type === 'sub_frame' ||
                    this.type === 'object' ||
                    this.type === 'xmlhttprequest') &&
                this.frameId === 0&&
                !this.TimeErrorOccurred
            );
        }).get();
    }
};

function BeforeRequestHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    reqObjects.push({
        requestId: detail.requestId,
        TimeBeforeRequest: Date.now(),
        method: detail.method,
        url: detail.url,
        tabId: detail.tabId,
        type: detail.type,
        parentFrameId: detail.parentFrameId,
        initiator: detail.initiator,
        frameId: detail.frameId,
        getReqLength: function () {
            if (this.TimeBeforeRequest && this.TimeCompleted) {
                return this.TimeCompleted - this.TimeBeforeRequest
            } else {
                return null;
            }
        }
    });

    // db=TAFFY(reqObjects);
    // console.log(db({requestId:detail.requestId}).first())

}

function BeforeSendHeadersHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(reqObjects);
    let local = db({requestId: detail.requestId}).first();
    local.TimeBeforeSendHeaders = Date.now();
}

function SendHeadersHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(reqObjects);
    let local = db({requestId: detail.requestId}).first();
    local.TimeSendHeaders = Date.now();
    local.requestHeaders=detail.requestHeaders
}

function HeadersReceivedHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(reqObjects);
    let local = db({requestId: detail.requestId}).first();
    local.TimeHeadersReceived = Date.now();
}

function AuthRequiredHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(reqObjects);
    let local = db({requestId: detail.requestId}).first();
    local.TimeAuthRequired = Date.now();
}

function BeforeRedirectHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(reqObjects);
    let local = db({requestId: detail.requestId}).first();
    local.TimeBeforeRedirect = Date.now();
}

function ResponseStartedHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(reqObjects);
    let local = db({requestId: detail.requestId}).first();
    local.TimeResponseStarted = Date.now();
}

function CompletedHandler(detail) {
    if (true) {
        console.log(detail)
    }
    let db = TAFFY(reqObjects);
    let local = db({requestId: detail.requestId}).first();
    local.TimeCompleted = Date.now();
    local.responseHeaders=detail.responseHeaders;
    local.statusCode=detail.statusCode;
}

function ErrorOccurredHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(reqObjects);
    let local = db({requestId: detail.requestId}).first();
    local.TimeErrorOccurred = Date.now();
    local.statusCode=detail.statusCode;
}

