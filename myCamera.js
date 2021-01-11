let videoConstraints = null;
let videoConstraintsText = "";
let audioConstraints = null;
let audioConstraintsText = "";


let localStream;    // 自分の映像ストリームを保存しておく変数
let audioTrack = null;
let videoTrack = null;


const c_audioContext = new AudioContext(); // chromeでは、後続のresume で有効化される
const c_gainNode = c_audioContext.createGain(); // マイク音量（感度）調整用

const c_elemEvent_input = new Event('input');




//音声認識
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition || webkitSpeechRecognition || SpeechRecognition;


let recognition = null;
let recognitionRestartableFlg = true;

function settingRecognition(){
  if(!('SpeechRecognition' in window)){
      return false;
  }else{ //音声認識の初期化
    recognition = new SpeechRecognition();
    if(recognition){
        recognition.lang = 'ja-JP';
        recognition.interimResults = true; // 暫定結果も返す
        recognition.continuous = true;
        
        recognition.addEventListener('start', (event) => {
           recognitionRestartableFlg = true;
           elemCheckBox_ResultRecognition.checked = true;
        })
        recognition.addEventListener('end', (event) => {
            addMessageOfRecognitionErr();
            if (recognitionRestartableFlg) {
                recognition.start();
                recognitionRestartableFlg = false;
                elemCheckBox_ResultRecognition.checked = false;
                elemText_ResultRecognitionStatus.innerHTML="";
                console.log("Recognition end(restart).");
            }else{
                console.log("Recognition end.");
            }
        })
        recognition.addEventListener('result', (event) => {
            let finalTranscript = ''; //確定結果
            let interimTranscript = ''; // 暫定(灰色)の認識結果
            for (let i = event.resultIndex; i < event.results.length; i++) {
              let transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
                recognitionRestartableFlg = true;
                console.log("Recognition final."+interimTranscript);
                interimTranscript="";
              } else {
                interimTranscript = transcript;
                recognitionRestartableFlg = false;
              }
            }
            if(!recognitionRestartableFlg){
                console.log("Recognition continue.");
            }
            addMessageOfRecognition(finalTranscript,interimTranscript);
            
        })
        recognition.addEventListener('nomatch', (event) => {
            addMessageOfRecognitionErr();
            console.log("Recognition NoMatch:"+event.error);
        })
        recognition.addEventListener('error', (event) => {
            addMessageOfRecognitionErr();
            console.log("RecognitionError:"+event.error);
        })
        recognition.addEventListener('soundstart', (event) => {
            elemText_ResultRecognitionStatus.innerHTML="●";
        })
        recognition.addEventListener('soundend', (event) => {
            elemText_ResultRecognitionStatus.innerHTML="○";
        })
        
        
        
        
        
        
        // recognition.stop();
        // recognition.start(); https://developer.mozilla.org/ja/docs/Web/API/SpeechRecognition
    }
  }
}
function addMessageOfRecognition(msg1,msg2){
    let maxcount = 50; //最大文字数
    const datetimeNow = new Date();
    let strTime = " ("+ datetimeNow.getHours()+":"+datetimeNow.getMinutes()+")";
    
    if(msg1!=""){
      if(elemTextArea_ResultRecognition){
          let msg = elemTextArea_ResultRecognition.value;
          msg += (strTime+msg1);
          if(msg.length>maxcount){ msg=msg.slice( 0-maxcount ); }
          elemTextArea_ResultRecognition.value = msg;
      }
    }
    if(elemTextArea_ResultRecognitionP){
        elemTextArea_ResultRecognitionP.innerHTML = msg2;
    }
}
function addMessageOfRecognitionErr(){
    let msg='';
    if(elemTextArea_ResultRecognitionP){
        msg=elemTextArea_ResultRecognitionP.innerHTML;
        elemTextArea_ResultRecognitionP.innerHTML="";
    }
    addMessageOfRecognition(msg,"");
}

function buildVideoConstraintsJSON() {
  try {
    videoConstraints = JSON.parse(videoConstraintsText);
  } catch(error) {
    handleError(error);
  }
}
function buildAudioConstraintsJSON() {
  try {
    audioConstraints = JSON.parse(audioConstraintsText);
  } catch(error) {
    handleError(error);
  }
}
function getCurrentSettings() {
  if (videoTrack) {
    videoConstraintsText = JSON.stringify(videoTrack.getSettings(), null, 2);
  }
  if (audioTrack) {
    audioConstraintsText = JSON.stringify(audioTrack.getSettings(), null, 2);
  }
}
videoConstraintsText = '{ "width": {"max":1280}, "height": {"max":720} ,"frameRate": { "ideal": 5, "max": 10 } }';
audioConstraintsText = '{ "sampleSize": 8, "channelCount": 1, "echoCancellation": false}';





// カメラ／マイクにアクセスするためのメソッドを取得しておく
navigator.mediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
   getUserMedia: function(c) {
     return new Promise(function(y, n) {
       (navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia).call(navigator, c, y, n);
     });
   }
} : null);
if (!navigator.mediaDevices) {
  console.log("getUserMedia() not supported.");
}


 
// DOM要素の構築が終わった場合に呼ばれるイベント
// - DOM要素に結びつく設定はこの中で行なう

let elemStream_SW;
let elemStream_SW_Msg;
let elemVideo;
let elemVideo_SW;
let elemRange_VideoFrameRate;
let elemRange_VideoFrameRateCurVal;
let elemMic_SW;
let elemRange_microphoneLevel;
let elemRange_microphoneLevelCurVal;
let elemVolume_SW
let elemRange_VolumeLevel;
let elemRange_VolumeLevelCurVal;
let elemCheckBox_micProperties;
let elemRadio_micEchoCancel;
let elemTextArea_ResultRecognition;
let elemTextArea_ResultRecognitionP;
let elemCheckBox_ResultRecognition;
let elemText_ResultRecognitionStatus;


$(function() {

  elemStream_SW =  document.getElementById('my-stream_sw');
  elemStream_SW_Msg =  document.getElementById('my-stream_sw_message');
  elemVideo = document.getElementById('my-video');
  elemVideo_SW=  document.getElementById('my-video_sw');
  elemRange_VideoFrameRate = document.getElementById('my-video_rate');
  elemRange_VideoFrameRateCurVal = document.getElementById('my-video_rate_currentValue');
  elemMic_SW =  document.getElementById('my-mic_sw');
  elemRange_microphoneLevel = document.getElementById('my-microphoneLevel');
  elemRange_microphoneLevelCurVal = document.getElementById('my-microphoneLevel_currentValue');
  elemVolume_SW =  document.getElementById('my-volume_sw');
  elemRange_VolumeLevel = document.getElementById('my-volumeLevel');
  elemRange_VolumeLevelCurVal = document.getElementById('my-volumeLevel_currentValue');
  elemCheckBox_micProperties = document.getElementsByName("my-checkbox_microphoneProps");
  elemRadio_micEchoCancel= document.getElementsByName("my-radio_microphoneEchoCancel");
  elemTextArea_ResultRecognition = document.getElementById("textarea_ResultRecognition");
  elemTextArea_ResultRecognitionP= document.getElementById("textarea_ResultRecognition_pre");
  elemCheckBox_ResultRecognition = document.getElementById("my-checkbox_recordRecognition");
  elemText_ResultRecognitionStatus = document.getElementById("text_ResultRecognition_status");



  if(elemCheckBox_ResultRecognition){
    let flg=0
    if('SpeechRecognition' in window){
      settingRecognition(); //音声認識の初期化
      if(recognition){
                elemCheckBox_ResultRecognition.addEventListener('change', function(e){
                    if(e.target.checked){
                      recognition.start();
                    }else{
                      recognitionRestartableFlg=false;
                      recognition.stop();
                    }
                });
                flg=1;
      }
    }
    if(flg==0){ // 初期化失敗
         elemCheckBox_ResultRecognition.checked = false;
         elemCheckBox_ResultRecognition.disabled = true;
    }else{
         elemCheckBox_ResultRecognition.checked = false;
         elemCheckBox_ResultRecognition.disabled = false;
    }
  }
  
  

   //elemStream_SW =  document.getElementById('my-stream_sw');
   //elemStream_SW_Msg =  document.getElementById('my-stream_sw_message');
   if(elemStream_SW){
     elemStream_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         if(e.target.value!=0){
             e.target.value=0;
             e.target.innerText = "ON";
             if(elemStream_SW_Msg){elemStream_SW_MsginnerText="停止中";}
         }else{
             e.target.value=1;
             e.target.innerText = "OFF";
             if(elemStream_SW_Msg){elemStream_SW_MsginnerText="送信中";}
         }
         
         initVideoConstraints(elemStream_SW);
     });
   }




   //elemVideo_SW =  document.getElementById('my-video_sw');
   if(elemVideo_SW){
     elemVideo_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         if(e.target.value!=0){
             e.target.value=0;
             e.target.innerText = "ON";
             
             changAbleStream(localStream.getVideoTracks(),false);//Off
         }else{
             e.target.value=1;
             e.target.innerText = "OFF";
             
             changAbleStream(localStream.getVideoTracks(),true);//On
         }
         e.target.removeAttribute("disabled");
     });
   }

   //elemRange_VideoFrameRate = document.getElementById('my-video_rate');
   //elemRange_VideoFrameRateCurVal = document.getElementById('my-video_rate_currentValue');
   if(elemRange_VideoFrameRate){
     elemRange_VideoFrameRate.addEventListener('input', function(e){
         update_elemRange_VideoFrameRateCurVal();
         changeVideoConstraints();
     });
     elemRange_VideoFrameRate.dispatchEvent(c_elemEvent_input);
   }
   
   
   
   //elemMic_SW =  document.getElementById('my-mic_sw');
   if(elemMic_SW){
     elemMic_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         if(e.target.value!=0){
             e.target.value=0;
             e.target.innerText = "ON";
             
             if(localStream){
                 changAbleStream(localStream.getAudioTracks(),false);//Off
             }
         }else{
             e.target.value=1;
             e.target.innerText = "OFF";
             
             if(localStream){
                 changAbleStream(localStream.getAudioTracks(),true);//On
             }
         }
         e.target.removeAttribute("disabled");
     });
   }
   //elemRange_microphoneLevel = document.getElementById('my-microphoneLevel');
   //elemRange_microphoneLevelCurVal = document.getElementById('my-microphoneLevel_currentValue');
   if(elemRange_microphoneLevel){
     elemRange_microphoneLevel.addEventListener('input', function(e){
         update_elemRange_microphoneLevelCurVal();
         
         if(c_gainNode){
             c_gainNode.gain.value = e.target.value;
         }
         
     });
     
     elemRange_microphoneLevel.value = c_gainNode.gain.value; // 初期値
     elemRange_microphoneLevel.dispatchEvent(c_elemEvent_input);
   }
   
   
   
   
   
   
   
   
   //elemVolume_SW =  document.getElementById('my-volume_sw');
   if(elemVolume_SW){
     elemVolume_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         if(e.target.value!=0){ //Offにする
             e.target.value=0;
             e.target.innerText = "ON";

         }else{ // Onにする
             e.target.value=1;
             e.target.innerText = "Mute";
         }
         if(elemVideo){
             if(e.target.value==0){
                 elemVideo.setAttribute("muted", true);
                 elemVideo.muted = true;
             }else{
                 elemVideo.muted = false;
                 elemVideo.removeAttribute("muted");
                 
            //   c_audioContext.resume().then(() => { console.log('Playback audioContext resumed successfully');});
                 
             }
         }
         e.target.removeAttribute("disabled");
     });
   }
   //elemRange_VolumeLevel = document.getElementById('my-volumeLevel');
   //elemRange_VolumeLevelCurVal = document.getElementById('my-volumeLevel_currentValue');
   if(elemRange_VolumeLevel){
     elemRange_VolumeLevel.addEventListener('input', function(e){
         if(elemRange_VolumeLevelCurVal){
             elemRange_VolumeLevelCurVal.innerText = e.target.value;
         }
         if(elemVideo){
             elemVideo.volume = e.target.value;
         }
     });
     elemRange_VolumeLevel.dispatchEvent(c_elemEvent_input);
   }
   
   
   
   //elemCheckBox_micProperties = document.getElementsByName("my-checkbox_microphoneProps");
   if(elemCheckBox_micProperties){
     for (let i = 0; i < elemCheckBox_micProperties.length; i++){
       elemCheckBox_micProperties[i].addEventListener('change', function(e){
         allDisabledElement(elemCheckBox_micProperties,true);
         changeAudioConstraints();
         setTimeout(function(e){ allDisabledElement(elemCheckBox_micProperties,false);}, 1000); // 処理実行直後1秒間は続けて処理を行わない
       });
     }
   }
   //elemRadio_micEchoCancel= document.getElementsByName("my-radio_microphoneEchoCancel");
   if(elemRadio_micEchoCancel){
     for (let i = 0; i < elemRadio_micEchoCancel.length; i++){
       elemRadio_micEchoCancel[i].addEventListener('change', function(e){
         allDisabledElement(elemRadio_micEchoCancel,true);
         changeAudioConstraints();
         setTimeout(function(e){ allDisabledElement(elemRadio_micEchoCancel,false);}, 1000); // 処理実行直後1秒間は続けて処理を行わない
       });
     }
   }
   
   
   
   
   //changeVideoConstraints();
   
});
function allDisabledElement(tgt,flg){
   if(tgt){if(tgt.length){
       for (let i = 0; i < tgt.length; i++){
           if(flg){
               tgt[i].setAttribute("disabled", true);
           }else{
               tgt[i].removeAttribute("disabled");
           }
       }
   }}
}
function update_elemRange_VideoFrameRateCurVal(){
   if(elemRange_VideoFrameRate){
         if(elemRange_VideoFrameRateCurVal){
             elemRange_VideoFrameRateCurVal.innerText = elemRange_VideoFrameRate.value;
         }
   }
}
function update_elemRange_microphoneLevelCurVal(){
   if(elemRange_microphoneLevel){
         if(elemRange_microphoneLevelCurVal){
             elemRange_microphoneLevelCurVal.innerText = elemRange_microphoneLevel.value;
         }
   }
}


function startVideo(triggerElem = null) {

    // カメラ／マイクのストリームを取得する
    navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints
    }).then(function(stream) {
        
        audioTracks = stream.getAudioTracks();
        videoTracks = stream.getVideoTracks();
        if (audioTracks.length) {
            audioTrack = audioTracks[0];
        }
        if (videoTracks.length) {
            videoTrack = videoTracks[0];
        }
        
        let newDestination=null;
        //マイクからの音量に増幅を掛ける（新しいストリームを新規に作成）
        if (audioTrack!=null) {
            const micSource = c_audioContext.createMediaStreamSource(stream);
            newDestination = c_audioContext.createMediaStreamDestination();
            micSource.connect(c_gainNode);
            c_gainNode.connect(newDestination);
        }
        
        //新規に作成した音声ストリームに、映像ストリームを付加
        localStream = null;
        if(newDestination==null){
            if (videoTrack!=null) {
                localStream = stream;
            }
        }else{
            if (videoTrack!=null) {
                newDestination.stream.addTrack(videoTrack);
                localStream = newDestination.stream;
            }
        }
        
        
        // 送出許可されたもののみを有効にする
        let flg=false;
        if(elemMic_SW){
            if(elemMic_SW.value!=0){
                flg=true;
            }
        }
        changAbleStream(localStream.getAudioTracks(),flg)
        
        flg=false;
        if(elemVideo_SW){
            if(elemVideo_SW.value!=0){
                flg=true;
            }
        }
        changAbleStream(localStream.getVideoTracks(),flg)
        
        
        
        
        
        if(localStream != null){
            
            //ストリーム保存
            //const mediaRecorder = new MediaRecorder(localStream);
            
            
            
            
            
            //ブラウザ上に表示する
            if(elemVideo){
                try {
                    elemVideo.srcObject = localStream;
                } catch (error) {
                    let url = window.URL.createObjectURL(localStream);
                    elemVideo.prop('src', url); // video要素のsrcに設定することで、映像を表示する
                }
            }
            
            
        }

        
    }).then(function() {
        new Promise(function(resolve) {
          elemVideo.onloadedmetadata = resolve;
        });
    }).then(function() {
        getCurrentSettings();
        CheckEnable_videoTrack(triggerElem , 3);
        
        c_audioContext.resume().then(() => { console.log('Playback audioContext resumed successfully');}); //Chromeのセキュリティ設定
        
    }).catch(function(err) {
      console.log(err.name + ": " + err.message);
    });


}



function stopVideo(triggerElem = null){
  if (videoTrack) {
    videoTrack.stop();
  }
  if (audioTrack) {
    audioTrack.stop();
  }

  videoTrack = audioTrack = null;
  try {
     elemVideo.srcObject = null;
  } catch (error) {
     elemVideo.prop('src', null);
  }
  
  
  resurrectionBtnElem(triggerElem);
};




function changAbleStream(streamTracks , enableFlg){
    // 渡されたストリームのトラックに、送出許可を設定する
    if(streamTracks){
        if (streamTracks.length) {
            streamTracks[0].enabled = enableFlg;
        }
    }
}





function resurrectionBtnElem(triggerElems){
    let tgtary;
    if(triggerElems.foreach){
        tgtary=triggerElems
    }else{
        tgtary=[triggerElems];
    }
    tgtary.forEach(triggerElem => {
        if(typeof(triggerElem)=="object"){
          if(triggerElem.type){
            if(triggerElem.type="button"){
              if(triggerElem.disabled){
                triggerElem.removeAttribute("disabled");
              }
            }
          }
        }
    });
}


function CheckEnable_videoTrack(triggerElem = null , loop=0){
    let flg=loop;
    if(videoTrack){
        flg -= 1;
    }
    
    if(flg<0){
        resurrectionBtnElem(triggerElem);
    }else{
        setTimeout(function(){CheckEnable_videoTrack(triggerElem , flg)}, 1000);
    }
}

function initVideoConstraints(triggerElem = null){  // ストリームのon/off制御
   let flg=0;
   
   if(elemStream_SW){
       if(elemStream_SW.value==0){ //Off
           getCurrentSettings();
           if(videoConstraints){
               videoConstraints = false;
               flg=1;
           }
           if(audioConstraints){
               audioConstraints = false;
               flg=1;
           }
           if(flg!=0){
               stopVideo(triggerElem);
           }
       }else{   // if(elemStream_SW.value!=0){ //On
           if(!videoConstraints){
               buildVideoConstraintsJSON();
               changeVideoConstraintsPt();
               flg=1;
           }
           if(!audioConstraints){
               buildAudioConstraintsJSON();
               changeAudioConstraintsPt();
               flg=1;
           }
           if(flg!=0){
               startVideo(triggerElem);
               
               if(elemRange_VideoFrameRate){
                   elemRange_VideoFrameRate.value = videoConstraints.frameRate.ideal;
                   //update_elemRange_VideoFrameRateCurVal();
                   elemRange_VideoFrameRate.dispatchEvent(c_elemEvent_input);
               }
           }

       }
       
   }
   
   if(flg==1){
       //変更あり
   }
}

function changeAudioConstraintsPt(){
   let flg=0;
   
   if(audioConstraints){
         
         if(elemCheckBox_micProperties){
         
             
             for (let i = 0; i < elemCheckBox_micProperties.length; i++){
                 
                 switch (elemCheckBox_micProperties[i].value) {
                   case "again":
                     if(audioConstraints.autoGainControl != elemCheckBox_micProperties[i].checked ){ 
                         audioConstraints.autoGainControl = elemCheckBox_micProperties[i].checked;
                         flg=1;
                     }
                   break;
                   case "noize":
                     if(audioConstraints.noiseSuppression != elemCheckBox_micProperties[i].checked ){ 
                         audioConstraints.noiseSuppression = elemCheckBox_micProperties[i].checked;
                         flg=1;
                     }
                   break;
                   default:
                   break;
                 }
                 
             }

         }
         
         if(elemRadio_micEchoCancel){
             let strvl ="";
             for (let i = 0; i < elemRadio_micEchoCancel.length; i++){
                 if(elemRadio_micEchoCancel[i].checked){ 
                     strvl = elemRadio_micEchoCancel[i].value; break;
                 }
             }
             
             if(strvl=="none"){
                 if(audioConstraints.echoCancellation){
                     audioConstraints.echoCancellation=false;
                     flg=1;
                 }
             }else{
                 if(!audioConstraints.echoCancellation){
                     audioConstraints.echoCancellation=true;
                     flg=1;
                 }
                 if(audioConstraints.echoCancellationType != strvl){
                     audioConstraints.echoCancellationType = strvl;
                     flg=1;  // "system" or "browser"
                 }
             }
         }
         
   }
   
   return flg;
}
function changeAudioConstraints(triggerElem = null){
   let flg=changeAudioConstraintsPt();
   if(flg==1){
       if(audioTrack){
           if(audioConstraints){
                   audioTrack.applyConstraints(audioConstraints); // 設定変更を実施
           }
       }
   }
}

function changeVideoConstraintsPt(){
   let flg=0;
   
   if(videoConstraints){
         if(elemRange_VideoFrameRate){
         
             if(elemRange_VideoFrameRate.value != videoConstraints.frameRate){
                 videoConstraints.frameRate.ideal = elemRange_VideoFrameRate.value;
                 videoConstraints.frameRate.max = elemRange_VideoFrameRate.value+5;
                 flg=1;
             }
         }
   }
   
   return flg;
}
function changeVideoConstraints(triggerElem = null){
   let flg=changeVideoConstraintsPt();
   if(flg==1){
       if(videoTrack){
           if(videoConstraints){
                   changeVideoConstraints_delay();
           }
       }
   }
}
let changeVideoConstraints_id=0; // 0:実行可能、それ以外:実行保留期間中
let changeVideoConstraints_flg=0; // 0以外：Constraintsの設定変更要求あり
function changeVideoConstraints_delay(mode=0){
    if(mode==0){
         changeVideoConstraints_flg=1; //更新すべきﾃﾞｰﾀがある
    }
    if(changeVideoConstraints_flg!=0){
        if(changeVideoConstraints_id==0){ //実行可能
            changeVideoConstraints_flg=0;
            videoTrack.applyConstraints(videoConstraints); // 設定変更を実施
            getCurrentSettings(); // 設定をテキストに保存
            changeVideoConstraints_id = setTimeout(function(){
                changeVideoConstraints_id=0;
                changeVideoConstraints_delay(1);    }, 1000); // 処理実行直後1秒間は続けて処理を行わない
        }
    }
}
