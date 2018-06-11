chrome.webRequest.onBeforeRequest.addListener(BeforeRequestHandler, {urls: []}, ['requestBody']);
chrome.webRequest.onBeforeSendHeaders.addListener(BeforeSendHeadersHandler, {urls: []}, ['requestHeaders']);
chrome.webRequest.onSendHeaders.addListener(SendHeadersHandler, {urls: []}, ['requestHeaders']);
chrome.webRequest.onHeadersReceived.addListener(HeadersReceivedHandler, {urls: []}, ['responseHeaders']);
chrome.webRequest.onAuthRequired.addListener(AuthRequiredHandler, {urls: []}, ['responseHeaders']);
chrome.webRequest.onBeforeRedirect.addListener(BeforeRedirectHandler, {urls: []}, ['responseHeaders']);
chrome.webRequest.onResponseStarted.addListener(ResponseStartedHandler, {urls: []}, ['responseHeaders']);
chrome.webRequest.onCompleted.addListener(CompletedHandler, {urls: []}, ['responseHeaders']);
chrome.webRequest.onErrorOccurred.addListener(ErrorOccurredHandler, {urls: []});
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    log(message);
    log(sender);
    if (message.command === "getReqS") {
        sendResponse(ReqAnalysis.getTopLevel());
    } else if (message.command === "startSampling") {
        ReqAnalysis.start();
        sendResponse({IfRunningStatus: IfRunningStatus})
    } else if (message.command === "stopSampling") {
        ReqAnalysis.stop();
        sendResponse({IfRunningStatus: IfRunningStatus})
    }
});
chrome.runtime.onMessageExternal.addListener(function (message, sender, sendResponse) {
    log(message);
    log(sender);
});
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.query({currentWindow: true, active: true}, function (cT) {
        console.log(cT)
    });
    let code="\"{name}\"".format({name:"Ian"});
    log(code);
    chrome.tabs.executeScript({
            code:
               "(function () {\n" +
               "    let newElement=document.createElement(\"div\");\n" +
               "    newElement.setAttribute(\"hidden\",\"true\");\n" +
               "    newElement.innerText=\'"+JSON.stringify(ReqAnalysis.getTopLevel())+"\'\n" +
               "    return document.getElementsByTagName(\"body\")[0].appendChild(newElement)\n" +
               "})();\n"
        },
        function (result) {
            console.log(result)
        }
    );
    ReqAnalysis.start();
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    log(tabId);
    log(changeInfo);
    log(tab);
});
let IfDebug = false;
let IfRunningStatus = false;
let IfTabId = "";

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

function log(string) {
    console.log(string)
}

let ReqAnalysis = {
    getErrReqS: function () {
        let db = TAFFY(ReqAnalysis.reqObjects);
        return db(function () {
            return this.TimeErrorOccurred
        }).get()
    },
    getTopLevel: function () {
        let db = TAFFY(ReqAnalysis.reqObjects);
        return db(function () {
            return (
                (this.type === 'main_frame' ||
                    this.type === 'sub_frame' ||
                    this.type === 'object' ||
                    this.type === 'xmlhttprequest') &&
                this.frameId === 0 &&
                !this.TimeErrorOccurred
            );
        }).get();
    },
    getUrls: function () {
        let db = TAFFY(ReqAnalysis.reqObjects);
        return db(function () {
            return (
                (this.type === 'main_frame' ||
                    this.type === 'sub_frame' ||
                    this.type === 'object' ||
                    this.type === 'xmlhttprequest') &&
                this.frameId === 0 &&
                !this.TimeErrorOccurred
            );
        }).get();
    },
    start: function () {
        ReqAnalysis.reqObjects = [];
        IfRunningStatus = true;
        chrome.tabs.query({currentWindow: true, active: true}, function (currentTab) {
            IfTabId = currentTab[0].id
        })

    },
    stop: function () {
        IfRunningStatus = false;
        IfTabId = "";
    },
    reqObjects: []
};

function BeforeRequestHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    if (IfRunningStatus && (detail.tabId === IfTabId)) {
        ReqAnalysis.reqObjects.push({
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
        })
    }


}

function BeforeSendHeadersHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(ReqAnalysis.reqObjects);
    let local = db({requestId: detail.requestId}).first();
    if (IfRunningStatus && local) {
        local.TimeBeforeSendHeaders = Date.now();
    }
}

function SendHeadersHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(ReqAnalysis.reqObjects);
    let local = db({requestId: detail.requestId}).first();
    if (IfRunningStatus && local) {
        local.TimeSendHeaders = Date.now();
        local.requestHeaders = detail.requestHeaders
    }
}

function HeadersReceivedHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(ReqAnalysis.reqObjects);
    let local = db({requestId: detail.requestId}).first();
    if (IfRunningStatus && local) {
        local.TimeHeadersReceived = Date.now();
    }
}

function AuthRequiredHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(ReqAnalysis.reqObjects);
    let local = db({requestId: detail.requestId}).first();
    if (IfRunningStatus && local) {
        local.TimeAuthRequired = Date.now();
    }
}

function BeforeRedirectHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(ReqAnalysis.reqObjects);
    let local = db({requestId: detail.requestId}).first();
    if (IfRunningStatus && local) {
        local.TimeBeforeRedirect = Date.now();
    }
}

function ResponseStartedHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(ReqAnalysis.reqObjects);
    let local = db({requestId: detail.requestId}).first();
    if (IfRunningStatus && local) {
        local.TimeResponseStarted = Date.now();
    }
}

function CompletedHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(ReqAnalysis.reqObjects);
    let local = db({requestId: detail.requestId}).first();
    if (IfRunningStatus && local) {
        local.TimeCompleted = Date.now();
        local.responseHeaders = detail.responseHeaders;
        local.statusCode = detail.statusCode;
    }
}

function ErrorOccurredHandler(detail) {
    if (IfDebug) {
        console.log(detail)
    }
    let db = TAFFY(ReqAnalysis.reqObjects);
    let local = db({requestId: detail.requestId}).first();
    if (IfRunningStatus && local) {
        local.TimeErrorOccurred = Date.now();
        local.statusCode = detail.statusCode;
    }
}

