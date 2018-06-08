let reg1=/(?<!\$){.+?}/;

XmlTools = {
    Parser: function (XmlString) {
        let parser = new DOMParser();
        parser.parseFromString(XmlString, "text/xml");
    },
    readXml: function (FilePath, callable) {
        let decoder = new TextDecoder("utf8");
        fetch(FilePath)
            .then(function (resp) {
                let reader = resp.body.getReader();
                let local = '';
                reader
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
                console.log(val)
            });
    }
};

XmlTools.readXml("../JmxTemplate/TestElements.xml.tp",function (st) {
    console.log(reg1.exec(st));
});
