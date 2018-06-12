document.addEventListener("DOMContentLoaded",function () {
    let startButton = document.getElementById("start");
    let stopButton = document.getElementById("stop");

    function statusRunning() {
        startButton.disabled=true;
        stopButton.disabled=false;
    }

    function statusStop() {
        startButton.disabled=false;
        stopButton.disabled=true;
    }

    startButton.addEventListener('click',function () {

        StartSimpling();
    });
    stopButton.addEventListener('click',function () {

        StopSimpling();
    });
    function AskForStatus(){
        chrome.runtime.sendMessage({command:"SamplingStatus"},function (response) {
            if(response.IfRunningStatus===true){
                statusRunning();
                console.log("status running")
            }else{
                statusStop();
                console.log("status stop")
            }
        });
    }
    function StartSimpling(){
        chrome.runtime.sendMessage({command:"startSampling"});
    }
    function StopSimpling(){
        chrome.runtime.sendMessage({command:"stopSampling"})
    }
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log(message);
        if (message.command === "IfRunningUpdate") {

            if(message.IfRunningStatus===true){
                statusRunning();
                console.log("status running")
            }else{
                statusStop();
                console.log("status stop")
            }
        }
    });
    AskForStatus();
});







