var getURL = chrome.extension.getURL;
var XmlTools = {
    Parser: function (XmlString) {
        var parser = new DOMParser();
        parser.parseFromString(XmlString, "text/xml");
    },
    readXml: function (FilePath, callable) {
        var decoder = new TextDecoder("utf8");
        fetch(FilePath)
            .then(function (resp) {
            var reader = resp.body.getReader();
            var local = '';
            reader
                .read()
                .then(function readAll(val) {
                if (val.done === true) {
                    console.log("finished reading");
                    callable(local);
                    return;
                }
                local += decoder.decode(val.value);
                return reader.read().then(readAll);
            })
                .catch(function (e) {
                console.log("err while reading");
                console.log(e);
            });
        })
            .catch(function (val) {
            console.log(val);
        });
    }
};
var UserDataDefault = {
    TestPlan: {
        TestName: "myTest",
        TestComments: "",
    },
    TestBody: {
        ThreadGroupName: "ThreadGroup",
        NumberOfThreads: 500,
        RampUpTime: 60,
        Loops: -1,
    },
    TestElements: {
        SamplerName: "SamplerName",
        SamplerDomain: "www.google.com",
        SamplerComment: "SamplerComment",
        ServerPort: "",
        SamplerProtocol: "https",
        SamplerPath: "/",
        SamplerMethod: "GET"
    },
    HeaderElement: {
        HeaderName: "HeaderName",
        HeaderValue: "HeaderValue"
    },
    ConstantTimer: {
        ConstantTimerName: "ConstantTimerName",
        ConstantTimerValue: 1
    },
    HTTPArguments: {
        ArgumentName: "ArgumentName",
        ArgumentValue: "ArgumentValue"
    }
};
var ReqMethod;
(function (ReqMethod) {
    ReqMethod["GET"] = "GET";
    ReqMethod["POST"] = "POST";
})(ReqMethod || (ReqMethod = {}));
var ReqHeaders = /** @class */ (function () {
    function ReqHeaders(headers) {
        this.headers = headers;
    }
    ReqHeaders.prototype.addHeader = function (name, value) {
        this.headers.push({ name: name, value: value });
    };
    return ReqHeaders;
}());
var ConstantWait = /** @class */ (function () {
    function ConstantWait(length) {
        this.length = length;
    }
    return ConstantWait;
}());
var ReqProtocol;
(function (ReqProtocol) {
    ReqProtocol["http"] = "http";
    ReqProtocol["https"] = "https";
})(ReqProtocol || (ReqProtocol = {}));
var ReqUrl = /** @class */ (function () {
    function ReqUrl(urlString) {
        this.urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/i;
        this.argumentsRegex = /\?((([\w\+%]+=[\w\+%]+)&)+)?([\w\+%]+=[\w\+%]+)/i;
        this.protocolRegex = /^https?/i;
        this.hostRegex = /\/\/[\w.]+(?=\/)?/i;
        this.argumentsObjects = [];
        if (this.urlRegex.test(urlString)) {
            this.urlString = urlString;
        }
        else {
            throw "not validated url";
        }
        this.getProtocol();
        this.getArguments();
        this.getHostString();
    }
    ReqUrl.prototype.getProtocol = function () {
        var ProString = this.protocolRegex.exec(this.urlString)[0];
        if (ProString.toLowerCase() == "https") {
            this.Protocol = ReqProtocol.https;
        }
        else if (ProString.toLowerCase() == "http") {
            this.Protocol = ReqProtocol.http;
        }
    };
    ReqUrl.prototype.getArguments = function () {
        if (this.urlString.match(this.argumentsRegex)) {
            this.argumentsString = (this.urlString
                .match(this.argumentsRegex)[0]).replace("?", "");
            var localA = this.argumentsString.split("&");
            var localArray_1 = [];
            localA.forEach(function (ele) {
                var local = ele.split("=");
                var localB = { name: '', value: '' };
                localB.name = local[0];
                localB.value = local[1];
                localArray_1.push(localB);
            });
            this.argumentsObjects = localArray_1;
        }
    };
    ReqUrl.prototype.getHostString = function () {
        this.hostString = this.urlString.match(this.hostRegex)[0].replace("//", "");
    };
    return ReqUrl;
}());
var RequestElement = /** @class */ (function () {
    function RequestElement(url, method, headers, wait) {
        this.url = new ReqUrl(url);
        if (method.toLowerCase() == "post") {
            this.method = ReqMethod.POST;
        }
        else if (method.toLowerCase() == "get") {
            this.method = ReqMethod.GET;
        }
        else {
            throw "method not found";
        }
        this.headers = headers;
        this.wait = wait;
    }
    return RequestElement;
}());
var Requests = /** @class */ (function () {
    function Requests() {
        this.requests = [];
    }
    Requests.prototype.newRequest = function (url, method, headers, wait) {
        this.requests.push(new RequestElement(url, method, headers, wait));
    };
    return Requests;
}());
var TemplateEngine = {
    current: "",
    AnchorPointRegex: /{.+}/,
    Templates: {
        TestElements: "",
        TestBody: "",
        HTTPArguments: "",
        TestPlan: "",
        HeaderElement: "",
        ConstantTimer: ""
    },
    init: function () {
        var IF = 0;
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "TestElements.xml.tp", function (res) {
            TemplateEngine.Templates.TestElements = res;
            IF++;
            if (IF == 6) {
                TemplateEngine.fillUp();
            }
        });
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "TestBody.xml.tp", function (res) {
            TemplateEngine.Templates.TestBody = res;
            IF++;
            if (IF == 6) {
                TemplateEngine.fillUp();
            }
        });
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "HTTPArguments.xml.tp", function (res) {
            TemplateEngine.Templates.HTTPArguments = res;
            IF++;
            if (IF == 6) {
                TemplateEngine.fillUp();
            }
        });
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "TestPlan.xml.tp", function (res) {
            TemplateEngine.Templates.TestPlan = res;
            IF++;
            if (IF == 6) {
                TemplateEngine.fillUp();
            }
        });
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "HeaderElement.xml.tp", function (res) {
            TemplateEngine.Templates.HeaderElement = res;
            IF++;
            if (IF == 6) {
                TemplateEngine.fillUp();
            }
        });
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "ConstantTimer.xml.tp", function (res) {
            TemplateEngine.Templates.ConstantTimer = res;
            IF++;
            if (IF == 6) {
                TemplateEngine.fillUp();
            }
        });
    },
    JmxTemplatePath: chrome.runtime.getURL("/JmxTemplate"),
    fillUp: function () {
        TemplateEngine.current = TemplateEngine.Templates.TestPlan;
        for (var i = 0; i < 4; i++) {
            TemplateEngine.current = TemplateEngine.current.format(TemplateEngine.Templates);
        }
        TemplateEngine.onDataReady.fire();
    },
    onDataReady: {
        listensers: [function () { }],
        fire: function () {
            TemplateEngine.onDataReady.listensers.forEach(function (ele) {
                ele();
            });
        },
        addEventListener: function (listener) {
            TemplateEngine.onDataReady.listensers.push(listener);
        }
    }
};
var myReqs = new Requests();
myReqs.newRequest("https://www.stackoverflow.com/questions/2140627/javascript-case-insensitive-string-comparison?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa&text=Hello+G%C3%BCnter", "get", new ReqHeaders([
    { name: "csrfToken", value: "7d91fe1563bf8f1f1dbe3bf8db53af0f8bc0a8e8" },
    { name: "eventSource", value: "Login:LoginScreen:LoginDV:submit_act" }
]), new ConstantWait(1));
myReqs.newRequest("http://www.google.com", "get", new ReqHeaders([]), new ConstantWait(0));
console.log(myReqs);
TemplateEngine.init();
chrome.runtime.sendMessage({ command: "getReqS" }, function (resp) {
    console.log(resp);
});
