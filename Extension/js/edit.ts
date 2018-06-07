let XmlTools = {
    Parser: function (XmlString:string) {
        let parser = new DOMParser();
        parser.parseFromString(XmlString, "text/xml");
    },
    readXml: function (FilePath:string, callable:((res:string)=>void)) {
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
                        console.log(e)
                    })
            })
            .catch(function (val) {
                console.log(val)
            });
    }
};

let templateEngine= {
    getEngine:function(files:string[],path?:string){
        let elementStrings=[],elementDom;
        //get temps into string[]
        if(path){
            if(!(/\/$/.exec(path))){
                path += "/"
            }
            files.forEach(function (ele) {
                XmlTools.readXml(path+ele,function (res) {
                    elementStrings.push({value:res,name:ele.replace('.xml.tp','')})
                })
            });
        }
        else{
            files.forEach(function (ele) {
                XmlTools.readXml(ele,function (res) {
                    elementStrings.push({value:res,name:ele.replace('.xml.tp','')});
                })
            })
        }
        //
    }
};

