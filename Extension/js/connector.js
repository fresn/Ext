let myId="123";
let messPort;
let TopReqS=null;
chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name===myId);
    messPort=port;
    port.onMessage.addListener(function (message,port) {
        console.assert(message.topReqS);
        TopReqS=message.topReqS;
    })
});
function getTopReqS() {
    messPort.postMessage({command:"getTopReqS"});
    return (function checkReq() {
        console.log("checking");
        if(TopReqS!=null){
            return TopReqS
        }else {
            return checkReq();
        }
    })()
}

(function () {
    let newElement=document.createElement("div");
    newElement.setAttribute("hidden","true");
    newElement.innerText=ReqAnalysis.getTopLevel();
    return document.getElementsByTagName("body")[0].appendChild(newElement)
})();
