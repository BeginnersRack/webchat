



const c_audioContext = new (window.AudioContext || window.webkitAudioContext)(); // chromeでは、後続のresume で有効化される
const c_gainNode = c_audioContext.createGain(); // マイク音量（感度）調整用

const c_elemEvent_input = new Event('input');





//音声認識
let flgEnableSpeechRecognition=false;

// var SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition || webkitSpeechRecognition || SpeechRecognition;
if(window.webkitSpeechRecognition){var SpeechRecognition = window.webkitSpeechRecognition}
else if(window.SpeechRecognition){var SpeechRecognition = window.SpeechRecognition}
else if(typeof webkitSpeechRecognition!=="undefined"){var SpeechRecognition = webkitSpeechRecognition}
else if(typeof SpeechRecognition!=="undefined"){var SpeechRecognition = SpeechRecognition}

if('SpeechRecognition' in window){
  if("function"==typeof SpeechRecognition){
     flgEnableSpeechRecognition=true;
  }
}

let recognition = null;
let recognitionRestartableFlg = true;


// ============ 初期化実行 ================

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


let soundOnlyFlg =false;
// DOM要素の構築が終わった場合に呼ばれるイベント
// - DOM要素に結びつく設定はこの中で行なう

let elemStream_SW;
let elemStream_SW_Msg;
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
let elemText_chatMessage;
let elemText_chatMessage_log;
let elemText_chatMessage_saveFN;
let elemText_chatMessage_saveBlobLink;

let elemRec_SW;
if(soundOnlyFlg){
  let elemAudio_myMic;
}else{
  let elemVideo;
  let elemVideo_SW;
  let elemRange_VideoFrameRate;
  let elemRange_VideoFrameRateCurVal;
}
let elemAddNewPeer_SW;
let elemText_myPeerId;
let elemText_myPeerId_copySW;
let elemDiv_streams;

document.addEventListener('DOMContentLoaded', function() {  // <<< $(function() {
    myOnload();
})
function myOnload(){
  elemStream_SW =  document.getElementById('my-stream_sw');
  elemStream_SW_Msg =  document.getElementById('my-stream_sw_message');
  elemMic_SW =  document.getElementById('my-mic_sw');
  elemRange_microphoneLevel = document.getElementById('my-microphoneLevel');
  elemRange_microphoneLevelCurVal = document.getElementById('my-microphoneLevel_currentValue');


  elemCheckBox_micProperties = document.getElementsByName("my-checkbox_microphoneProps");
  elemRadio_micEchoCancel= document.getElementsByName("my-radio_microphoneEchoCancel");
  elemTextArea_ResultRecognition = document.getElementById("textarea_ResultRecognition");
  elemTextArea_ResultRecognitionP= document.getElementById("textarea_ResultRecognition_pre");
  elemCheckBox_ResultRecognition = document.getElementById("my-checkbox_recordRecognition");
  elemText_ResultRecognitionStatus = document.getElementById("text_ResultRecognition_status");
  elemText_chatMessage = document.getElementById("textarea_chatMessage-input");
  elemText_chatMessage_SW = document.getElementById("textarea_chatMessage-input_sw");
  elemText_chatMessage_log = document.getElementById("textarea_chatMessage-log");
  elemText_chatMessage_saveSW = document.getElementById("textarea_chatMessage-logsave_sw");
  elemText_chatMessage_saveBlobLink = document.getElementById("textarea_chatMessage-save_bloblink");
  
  elemRec_SW =  document.getElementById('my-rec_sw');
  if(soundOnlyFlg){
      elemAudio_myMic = document.getElementById('my-audio');
  }else{
      elemVideo = document.getElementById('my-video');
      elemVideo_SW=  document.getElementById('my-video_sw');
      elemRange_VideoFrameRate = document.getElementById('my-video_rate');
      elemRange_VideoFrameRateCurVal = document.getElementById('my-video_rate_currentValue');
  }
  
  elemVolume_SW =  document.getElementById('my-volume_sw');
  elemRange_VolumeLevel = document.getElementById('my-volumeLevel');
  elemRange_VolumeLevelCurVal = document.getElementById('my-volumeLevel_currentValue');


  elemText_myPeerId = document.getElementById("my-peer-id");
  elemText_myPeerId_copySW = document.getElementById("my-peer-id-copy_sw");
  elemDiv_streams = document.getElementById("streams");
  elemAddNewPeer_SW = document.getElementById("my-addNewPeer");
  elemText_AddNewPeerID = document.getElementById("peer-id-input");

  
  
  

  if(elemCheckBox_ResultRecognition){
    let flg=0
    if(flgEnableSpeechRecognition){
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
  
  
   //elemText_chatMessage_SW = document.getElementById("textarea_chatMessage-input_sw");
   if(elemText_chatMessage_SW){
     elemText_chatMessage_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         
         let tgtmsg;
         if(elemText_chatMessage){
             tgtmsg = elemText_chatMessage.value;
             if(tgtmsg){if(tgtmsg!=""){
                   sendNewChatMessage(tgtmsg);
             }}
             elemText_chatMessage.value ="";
         }
         
         e.target.removeAttribute("disabled");
     });
   }

   //  elemText_chatMessage_saveSW = document.getElementById("textarea_chatMessage-save_sw");
   if(elemText_chatMessage_saveSW){
     elemText_chatMessage_saveSW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         
         saveChatMessageLog();
         
         e.target.removeAttribute("disabled");
     });
   }

   //  elemText_myPeerId_copySW = document.getElementById("my-peer-id-copy_sw");
   if(elemText_myPeerId_copySW){
     elemText_myPeerId_copySW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         
         if(elemText_myPeerId){
             elemText_myPeerId.readOnly=false;
             elemText_myPeerId.removeAttribute("readonly");
             
             elemText_myPeerId.select();
             document.execCommand("copy"); 
             getSelection().empty();
             
             elemText_myPeerId.setAttribute("readonly","");
             elemText_myPeerId.readOnly=true;
         }
         
         e.target.removeAttribute("disabled");
     });
   }






   // elemAddNewPeer_SW = document.getElementById("my-addNewPeer");
   if(elemAddNewPeer_SW){
     elemAddNewPeer_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         
         let tgtpeerid;
         if(elemText_AddNewPeerID){
             tgtpeerid = elemText_AddNewPeerID.value;
             if(tgtpeerid){
               if(tgtpeerid!=""){
                   addNewPeer(tgtpeerid);
               }
             }
             elemText_AddNewPeerID.value ="";
         }
         e.target.removeAttribute("disabled");
     });
   }

   //elemStream_SW =  document.getElementById('my-stream_sw');
   //elemStream_SW_Msg =  document.getElementById('my-stream_sw_message');
   if(elemStream_SW){
     elemStream_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         if(e.target.value!=0){
             e.target.value=0;
             e.target.innerText = "送信再開";
             if(elemStream_SW_Msg){elemStream_SW_MsginnerText="停止中";}
         }else{
             e.target.value=1;
             e.target.innerText = "送信停止";
             if(elemStream_SW_Msg){elemStream_SW_MsginnerText="送信中";}
         }
         
         initVideoConstraints(elemStream_SW);
     });
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
                 
                 if(soundOnlyFlg){
                     if(elemAudio_myMic){
                         if ('srcObject' in elemAudio_myMic) {
                             elemAudio_myMic.srcObject = localStream;
                         }else{
                             elemAudio_myMic.src = URL.createObjectURL(localStream);
                         }
                     }
                 }
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
//         if(elemVideo){
//             if(e.target.value==0){
//                 elemVideo.setAttribute("muted", true);
//                 elemVideo.muted = true;
//             }else{
//                 elemVideo.muted = false;
//                elemVideo.removeAttribute("muted");
//               
//            //   c_audioContext.resume().then(() => { console.log('Playback audioContext resumed successfully');});
//                 
//             }
//         }
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
//         if(elemVideo){
//             elemVideo.volume = e.target.value;
//         }
     });
     elemRange_VolumeLevel.dispatchEvent(c_elemEvent_input);
   }
   
   
   //elemRec_SW =  document.getElementById('my-rec_sw');
   if(elemRec_SW){
     elemRec_SW.innerText = "REC開始";
     elemRec_SW.addEventListener('click', function(e){
         e.target.setAttribute("disabled", true);
         if(e.target.value!=0){
             e.target.value=0;
             e.target.innerText = "REC開始";
             
             audioRecCommand(0);//停止
         }else{
             e.target.value=1;
             e.target.innerText = "REC終了";
             
             audioRecCommand(1);//開始
         }
         e.target.removeAttribute("disabled");
     });
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
   
   
   if(soundOnlyFlg){
       //  elemAudio_myMic = document.getElementById('my-audio');
       if(elemAudio_myMic){
         
              if ('srcObject' in elemAudio_myMic) {
                  elemAudio_myMic.srcObject = localStream;
              }else{
                  elemAudio_myMic.src = URL.createObjectURL(localStream);
              }
              elemAudio_myMic.setAttribute("autoplay",true);
              elemAudio_myMic.setAttribute("muted",true);
              elemAudio_myMic.volume = 0.3;
              elemAudio_myMic.controls="true";
              elemAudio_myMic.addEventListener('loadedmetadata', e => {
                  elemAudio_myMic.muted = "false";
              });
       }
   }else{
       //elemVideo = document.getElementById('my-video');
       if(elemVideo){
         elemVideo.addEventListener('volumechange', e => {
             if(typeof mediaRecorder=="object"){if(mediaRecorder){
                 if(mediaRecorder_micVolumeGain){ //マイクの音の録音用ゲインを設定しなおす。
                     mediaRecorder_micVolumeGain.value = elemVideo.volume; //Muteしていても値は取れる。
                 }
             }}
         });
       }
       
       //elemVideo_SW =  document.getElementById('my-video_sw');
       if(elemVideo_SW){
         elemVideo_SW.addEventListener('click', function(e){
             e.target.setAttribute("disabled", true);
             if(e.target.value!=0){
                 e.target.value=0;
                 e.target.innerText = "ON";
                 
                 if(localStream){if(localStream.getVideoTracks){ 
                     changAbleStream(localStream.getVideoTracks(),false); }} //Off
             }else{
                 e.target.value=1;
                 e.target.innerText = "OFF";
                 
                 if(localStream){if(localStream.getVideoTracks){ 
                     changAbleStream(localStream.getVideoTracks(),true); }} //On
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
       
   }
   
   // =============================
   // WebRTC 開始
   // =============================
   startMultiparty();
   
}



function update_elemRange_microphoneLevelCurVal(){
   if(elemRange_microphoneLevel){
         if(elemRange_microphoneLevelCurVal){
             elemRange_microphoneLevelCurVal.innerText = elemRange_microphoneLevel.value;
         }
   }
}
function update_elemRange_VideoFrameRateCurVal(){
   if(elemRange_VideoFrameRate){
         if(elemRange_VideoFrameRateCurVal){
             elemRange_VideoFrameRateCurVal.innerText = elemRange_VideoFrameRate.value;
         }
   }
}

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


//＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

function settingRecognition(){
  if(!(flgEnableSpeechRecognition)){
      return false;
  }else{ //音声認識の初期化
    recognition = new SpeechRecognition();
    if(recognition){
        recognition.lang = 'ja-JP';
        recognition.interimResults = true; // 暫定結果も返す
        recognition.continuous = true;
        
        recognition.addEventListener('start', (event) => { // onstart:リスニング開始
           recognitionRestartableFlg = true; // 再起動可（音声解析中でない）
           elemCheckBox_ResultRecognition.checked = true;
        })
        recognition.addEventListener('end', (event) => {
            addMessageOfRecognitionErr();
            if (recognitionRestartableFlg) {
                recognitionRestartableFlg = false; // 再起動不可（再起動中）
                recognition.start();
                elemCheckBox_ResultRecognition.checked = false;
                elemText_ResultRecognitionStatus.innerHTML="";
                console.log("Recognition end(restart).");
            }else{
                console.log("Recognition end.");
                let interimTranscript = '';
                
            }
        })
        recognition.addEventListener('result', (event) => {
            let finalTranscript = ''; //確定結果
            let interimTranscript = ''; // 暫定(灰色)の認識結果
            for (let i = event.resultIndex; i < event.results.length; i++) {
              let transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
                recognitionRestartableFlg = true;  // 再起動可（音声解析中でない）
                console.log("Recognition final."+interimTranscript);
                interimTranscript="";
              } else {
                interimTranscript = interimTranscript + transcript;
                recognitionRestartableFlg = false;  // 再起動不可（音声解析中）
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
            recognitionRestartableFlg = true;//stopメソッドにより発生するonendイベントで再起動させる
            recognition.stop();
        })
        
        
        
        
        
        // recognition.stop();
        // recognition.start(); https://developer.mozilla.org/ja/docs/Web/API/SpeechRecognition
    }
  }
}
function addMessageOfRecognition(msg1,msg2){
    let maxcount = 100; //表示最大文字数
    const datetimeNow = new Date();
    //let strTime = " ("+ datetimeNow.getHours()+":"+datetimeNow.getMinutes()+")";
    
    if(msg1!=""){
      if(elemTextArea_ResultRecognition){
          let msg = elemTextArea_ResultRecognition.value;
          //msg += (strTime+msg1);
          if(msg.length>maxcount){ msg=msg.slice( 0-maxcount ); }
          elemTextArea_ResultRecognition.value = msg;
      }
      sendNewChatMessage(msg1);
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

