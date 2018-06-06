ReqSAnalyst = {};
chrome.runtime.sendMessage({command: "getReqS"}, function (response) {
    ReqSAnalyst.FullReqs = response;
});
chrome.runtime.sendMessage({command: "getReqCumS"}, function (response) {
    ReqSAnalyst.TargetReqs = response;
});
XmlTools = {
    Parser: function (XmlString) {
        let parser = new DOMParser();
        parser.parseFromString(XmlString,"text/xml");
    },
    readXml: function (url, callable) {
        let decoder = new TextDecoder("utf8");
        fetch(url)
            .then(function (resp) {
                let reader = resp.body.getReader();
                let local = '';
                return reader
                    .read()
                    .then(function readAll(val) {
                        if (val.done === true) {
                            return
                        }
                        local += decoder.decode(val.value);
                        return reader.read().then(readAll)
                    })
                    .catch(function (e) {
                        console.log("err while reading");
                        console.log(e)
                    })
                    .finally(
                        function () {
                            console.log("finished reading");
                            callable(local);
                        }
                    )
            })
            .catch(function (val) {
            });
    }
};



let myDoc;
XmlTools.readXml("../JmxTemplate/basic.xml", function (string) {
    myDoc=XmlTools.Parser(string);
});








function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}