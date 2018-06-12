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
    console.log(message);
    console.log(sender);
    if (message.command === "getReqS") {
        sendResponse(ReqAnalysis.getTopLevel());
    } else if (message.command === "startSampling") {
        ReqAnalysis.start();
        onStartSimpling.fire();
    } else if (message.command === "stopSampling") {
        ReqAnalysis.stop();
        onStartSimpling.fire();
    } else if (message.command === "SamplingStatus") {
        sendResponse({IfRunningStatus: IfRunningStatus})
    }
});
chrome.runtime.onMessageExternal.addListener(function (message, sender, sendResponse) {
    if (message.command === "getReqS") {
        sendResponse({ReqS: ReqAnalysis.getTopLevel()})
    } else if (message.command = "getJmx") {

    }
});
onStartSimpling = {
    fire: function () {
        console.log("sending message : " + JSON.stringify({
            command: "IfRunningUpdate",
            IfRunningStatus: IfRunningStatus
        }));
        chrome.runtime.sendMessage({command: "IfRunningUpdate", IfRunningStatus: IfRunningStatus})
    }
};
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log("↓=====================Tab onUpdated=================↓");
    console.log(tabId);
    console.log(changeInfo);
    console.log(tab);
    console.log("↑=====================Tab onUpdated=================↑");
    if(changeInfo.status==="complete"){
        chrome.tabs.executeScript({code: "document.getElementById('" + chrome.app.getDetails().id + "');"}, function (result) {
            console.log("result");
            console.log(result);
            if (result !== null) {
                chrome.tabs.executeScript({
                    code:
                   "  let newScriptElement=document.createElement(\"script\");\n" +
                   "    newScriptElement.setAttribute(\"id\",'"+chrome.app.getDetails().id+"');\n" +
                   "    newScriptElement.innerText=\"let resTopS;\\n\" +\n" +
                   "        \"    function getTopReqS() {\\n\" +\n" +
                   "        \"        chrome.runtime.sendMessage('"+chrome.app.getDetails().id+"',{\\n\" +\n" +
                   "        \"            command:\\\"getReqS\\\"\\n\" +\n" +
                   "        \"        },function (response) {\\n\" +\n" +
                   "        \"            resTopS=response;\\n\" +\n" +
                   "        \"            console.log(response)\\n\" +\n" +
                   "        \"        })\\n\" +\n" +
                   "        \"    }\";\n" +
                   "    document.getElementsByTagName(\"body\")[0].appendChild(newScriptElement);"
                })
            }
        });
    }
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

        });




    },
    stop: function () {
        IfRunningStatus = false;
        IfTabId = "";
    },
    reqObjects: [],
    TopLevelReqSDetail: {
        ReqS: []
    },
    onTopLevelReqAdded: {
        fire: function () {
            console.log("new top level")
        }
    },
    onReqEnds: {
        fire: function () {
            let currentTopLevel = ReqAnalysis.getTopLevel();
            if (currentTopLevel.length !== ReqAnalysis.TopLevelReqSDetail.ReqS.length) {
                ReqAnalysis.TopLevelReqSDetail.ReqS = currentTopLevel;
                ReqAnalysis.onTopLevelReqAdded.fire();
            }

        }
    }
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
        ReqAnalysis.onReqEnds.fire();
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

