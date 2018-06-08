import getURL = chrome.extension.getURL;


let XmlTools = {
    Parser: function (XmlString: string) {
        let parser = new DOMParser();
        parser.parseFromString(XmlString, "text/xml");
    },
    readXml: function (FilePath: string, callable: ((res: string) => void)) {
        let decoder = new TextDecoder("utf8");
        fetch(FilePath)
            .then(function (resp) {
                let reader = resp.body.getReader();
                let local = '';
                reader
                    .read()
                    .then(function readAll(val) {
                        if (val.done === true) {
                            console.log("finished reading");
                            callable(local);
                            return
                        }
                        local += decoder.decode(val.value);
                        return reader.read().then(readAll)
                    })
                    .catch(function (e) {
                        console.log("err while reading");
                        console.log(e);

                    })
            })
            .catch(function (val) {
                console.log(val)
            });
    }
};
let UserDataDefault = {
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

enum ReqMethod {
    GET = "GET",
    POST = "POST"
}

class ReqHeaders {
    headers: { name: string, value: string }[];

    constructor(headers: { name: string, value: string } []) {
        this.headers = headers
    }

    addHeader(name: string, value: string) {
        this.headers.push({name, value})
    }
}

class ConstantWait {
    public length: Number;

    constructor(length: number) {
        this.length = length;
    }
}

enum ReqProtocol {
    http = "http",
    https = "https"
}

class ReqUrl {
    private urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/i;
    private argumentsRegex = /\?((([\w\+%]+=[\w\+%]+)&)+)?([\w\+%]+=[\w\+%]+)/i;
    private protocolRegex = /^https?/i;
    private hostRegex = /\/\/[\w.]+(?=\/)?/i;
    private readonly urlString: string;
    public argumentsString: string;
    public argumentsObjects = [];
    public Protocol: ReqProtocol;
    public hostString: string;

    constructor(urlString: string) {
        if (this.urlRegex.test(urlString)) {
            this.urlString = urlString;
        } else {
            throw "not validated url"
        }
        this.getProtocol();
        this.getArguments();
        this.getHostString();
    }

    private getProtocol() {
        let ProString = this.protocolRegex.exec(this.urlString)[0];
        if (ProString.toLowerCase() == "https") {
            this.Protocol = ReqProtocol.https;
        } else if (ProString.toLowerCase() == "http") {
            this.Protocol = ReqProtocol.http;
        }
    }

    private getArguments() {
        if (this.urlString.match(this.argumentsRegex)) {
            this.argumentsString = (
                this.urlString
                    .match(this.argumentsRegex)[0]
            ).replace("?", "");
            let localA = this.argumentsString.split("&");
            let localArray = [];
            localA.forEach(function (ele) {
                let local = ele.split("=");
                let localB = {name: '', value: ''};
                localB.name = local[0];
                localB.value = local[1];
                localArray.push(localB);
            });
            this.argumentsObjects = localArray
        }
    }

    private getHostString() {
        this.hostString = this.urlString.match(this.hostRegex)[0].replace("//", "")
    }
}

class RequestElement {
    url: ReqUrl;
    method: ReqMethod;
    headers: ReqHeaders;
    wait: ConstantWait;

    constructor(url: string, method: string, headers: ReqHeaders, wait: ConstantWait) {
        this.url = new ReqUrl(url);
        if (method.toLowerCase() == "post") {
            this.method = ReqMethod.POST
        } else if (method.toLowerCase() == "get") {
            this.method = ReqMethod.GET
        } else {
            throw "method not found"
        }
        this.headers = headers;
        this.wait = wait;
    }
}

class Requests {
    public requests = [];

    newRequest(url: string, method: string, headers: ReqHeaders, wait: ConstantWait): void {
        this.requests.push(new RequestElement(url, method, headers, wait))
    }
}

let TemplateEngine = {
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
        let IF = 0;
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "TestElements.xml.tp", function (res) {
            TemplateEngine.Templates.TestElements = res;
            IF++;
            if(IF==6){
                TemplateEngine.fillUp();
            }
        });
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "TestBody.xml.tp", function (res) {
            TemplateEngine.Templates.TestBody = res;
            IF++;
            if(IF==6){
                TemplateEngine.fillUp();
            }
        });
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "HTTPArguments.xml.tp", function (res) {
            TemplateEngine.Templates.HTTPArguments = res;
            IF++;
            if(IF==6){
                TemplateEngine.fillUp();
            }
        });
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "TestPlan.xml.tp", function (res) {
            TemplateEngine.Templates.TestPlan = res;
            IF++;
            if(IF==6){
                TemplateEngine.fillUp();
            }
        });
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "HeaderElement.xml.tp", function (res) {
            TemplateEngine.Templates.HeaderElement = res;
            IF++;
            if(IF==6){
                TemplateEngine.fillUp();
            }
        });
        XmlTools.readXml(TemplateEngine.JmxTemplatePath + "/" + "ConstantTimer.xml.tp", function (res) {
            TemplateEngine.Templates.ConstantTimer = res;
            IF++;
            if(IF==6){
                TemplateEngine.fillUp();
            }
        })
    },
    JmxTemplatePath: chrome.runtime.getURL("/JmxTemplate"),
    fillUp: function () {
        TemplateEngine.current = TemplateEngine.Templates.TestPlan;
        for (let i = 0; i < 4; i++) {
            TemplateEngine.current=TemplateEngine.current.format(TemplateEngine.Templates);
        }
        TemplateEngine.onDataReady.fire();
    },
    onDataReady:{
        listensers:[()=>{}],
        fire:function () {
            TemplateEngine.onDataReady.listensers.forEach(function (ele) {
                ele();
            })
        },
        addEventListener:function (listener:()=>{}) {
            TemplateEngine.onDataReady.listensers.push(listener)
        }
    }
};
let myReqs = new Requests();
myReqs.newRequest(
    "https://www.stackoverflow.com/questions/2140627/javascript-case-insensitive-string-comparison?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa&text=Hello+G%C3%BCnter"
    , "get"
    , new ReqHeaders([
            {name: "csrfToken", value: "7d91fe1563bf8f1f1dbe3bf8db53af0f8bc0a8e8"},
            {name: "eventSource", value: "Login:LoginScreen:LoginDV:submit_act"}
        ]
    ), new ConstantWait(1)
);
myReqs.newRequest("http://www.google.com", "get", new ReqHeaders([]), new ConstantWait(0));
console.log(myReqs);
TemplateEngine.init();
