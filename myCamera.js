let videoConstraints = null;
let videoConstraintsText = "";
let audioConstraints = null;
let audioConstraintsText = "";


let localStream;    // 自分の映像ストリームを保存しておく変数
let audioTrack = null;
let videoTrack = null;


const c_audioContext = new (window.AudioContext || window.webkitAudioContext)(); // chromeでは、後続のresume で有効化される
const c_gainNode = c_audioContext.createGain(); // マイク音量（感度）調整用

const c_elemEvent_input = new Event('input');

let audioContextCtrls={};


//音声認識
if('SpeechRecognition' in window){
//対応
 let i=0;
}else{
//非対応
 let i=0;
}

// var SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition || webkitSpeechRecognition || SpeechRecognition;
if(window.webkitSpeechRecognition){var SpeechRecognition = window.webkitSpeechRecognition}
else if(window.SpeechRecognition){var SpeechRecognition = window.SpeechRecognition}
else if(typeof webkitSpeechRecognition!=="undefined"){var SpeechRecognition = webkitSpeechRecognition}
else if(typeof SpeechRecognition!=="undefined"){var SpeechRecognition = SpeechRecognition}

if('SpeechRecognition' in window){
//対応
 let i=0;
}else{
//非対応
 let i=0;
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
let elemText_chatMessage;
let elemText_chatMessage_log;
let elemText_chatMessage_saveFN;
let elemText_chatMessage_saveBlobLink;

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
  elemText_chatMessage = document.getElementById("textarea_chatMessage-input");
  elemText_chatMessage_SW = document.getElementById("textarea_chatMessage-input_sw");
  elemText_chatMessage_log = document.getElementById("textarea_chatMessage-log");
  elemText_chatMessage_saveSW = document.getElementById("textarea_chatMessage-logsave_sw");
  elemText_chatMessage_saveBlobLink = document.getElementById("textarea_chatMessage-save_bloblink");
  
  
  elemText_myPeerId = document.getElementById("my-peer-id");
  elemText_myPeerId_copySW = document.getElementById("my-peer-id-copy_sw");
  elemDiv_streams = document.getElementById("streams");
  elemAddNewPeer_SW = document.getElementById("my-addNewPeer");
  elemText_AddNewPeerID = document.getElementById("peer-id-input");

  
  
  

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
   
   
   startMultiparty();
   
}



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






// =====================================
let SkyWayPeer;
let connectedCalls={};  // 接続したコールを保存しておく連想配列変数
let connectedDatas={};  // 接続したchatデータコネクトを保存しておく連想配列変数

function startMultiparty(){
  
  // SkyWayのシグナリングサーバーへ接続する
  SkyWayPeer = getSkywayPeerInstance();
  
  // シグナリングサーバへの接続が確立したときに、このopenイベントが呼ばれる
  if(SkyWayPeer){
    SkyWayPeer.on('open', function(){
      // 自分のIDを表示する
      // - 自分のIDはpeerオブジェクトのidプロパティに存在する
      // - 相手はこのIDを指定することで、通話を開始することができる
      elemText_myPeerId.value = (SkyWayPeer.id).toString();
    });
    

    // 相手からデータ通信の接続要求イベントが来た場合、このconnectionイベントが呼ばれる
    // - 渡されるconnectionオブジェクトを操作することで、データ通信が可能
    SkyWayPeer.on('connection', function(dataConnection){
            createNewPeerSettingData(dataConnection)
    });

    // 相手からビデオ通話がかかってきた場合、このcallイベントが呼ばれる
    // - 渡されるcallオブジェクトを操作することで、ビデオ映像を送受信できる
    SkyWayPeer.on('call', function(callConnection){
            createNewPeerSettingCall(callConnection);
    });

    SkyWayPeer.on("close", () => {
      let i=0;
    });
  }
}
// 新しい接続先に此方から接続に行った場合
function addNewPeer(newPeerID){
  if(SkyWayPeer){
    
    // 相手と通話を開始して、自分のストリームを渡す
    sendStreamToPeer(newPeerID);
    
    // 相手へのデータ通信接続を開始する
    connectDataToPeer(newPeerID);
    
  }
}
function sendStreamToPeer(newPeerID){
    // 相手と通話を開始して、自分のストリームを渡す
    let call = SkyWayPeer.call(newPeerID, localStream);
    if(call){
        //call.on("open", function() {
            // 相手のストリームが渡された場合のイベントを設置する
            createNewPeerSettingCall(call);
        //})
    }
}
function connectDataToPeer(newPeerID){
    // 相手へのデータ通信接続を開始する
    let conn = SkyWayPeer.connect(newPeerID);

    if(conn){
        //conn.on("open", function() {
            createNewPeerSettingData(conn);
                
            // 相手のIDを表示する
            // - 相手のIDはconnectionオブジェクトのidプロパティに存在する
            //$("#peer-id").text(conn.remoteId);
        //});
        
    }
}
function createNewPeerSettingData(dataConnection){
    //新規の通信相手を設定する(data)
    
    // 切断時に利用するため、コネクションオブジェクトを保存しておく
      connectedDatas[dataConnection.remoteId] = dataConnection;
      
      // メッセージ受信イベントの設定
      dataConnection.on("data", function(data){
            recieveNewChatMessage(dataConnection.remoteId , data);
      });
      
      //先方から接続が切断された場合の処理
      dataConnection.on("close", function(data){
            let i=0;   // dummy
            deletePeerFromDataList(dataConnection.remoteId);
            deletePeerFromCallList(dataConnection.remoteId);//データ接続切断時は映像も切断する
      });
      
}
function createNewPeerSettingCall(callConnection){
    //新規の通信相手を設定する(Stream)
   
   // 切断時に利用するため、コールオブジェクトを保存しておく
   connectedCalls[callConnection.remoteId] = callConnection;
   
   // 映像表示用のHTML-Domを設置する
   if(!(document.getElementById('peervideo-'+callConnection.remoteId))){
      domAppendOrRemoveforPeer(1,callConnection.remoteId); //Dom生成
   }
   
   if(callConnection._options.payload){
       // 自分の映像ストリームを相手に渡す
       // - getUserMediaで取得したストリームオブジェクトを指定する
       if(!localStream) {
          localStream=new MediaStream();
       }
       callConnection.answer(localStream);
       
   }
   

      
      // 相手のストリームが渡された場合、このstreamイベントが呼ばれる
      // - 渡されるstreamオブジェクトは相手の映像についてのストリームオブジェクト
      let audioMixMode=0; // ビデオコントロールに任すなら０、自分でMixするなら1(動作しない?)
      callConnection.on('stream', function(stream){
          // 映像ストリームオブジェクトをURLに変換する
          // - video要素に表示できる形にするため変換している
          let tgtelem=document.getElementById('peervideo-'+callConnection.remoteId);
          if(tgtelem){
            let newstream = stream;
            if(audioMixMode==1){
                //ボリュームを追加
                let audioctx={};
                //audioctx.AudioContext = new (window.AudioContext || window.webkitAudioContext)();
                audioctx.gainNode = c_audioContext.createGain();
                audioContextCtrls[callConnection.remoteId] = audioctx; //配列に保持する
                let audioSource = c_audioContext.createMediaStreamSource(stream);//MediaStreamAudioSourceNodeが取れていない？
                audioSource.connect(audioctx.gainNode);
                audioctx.gainNode.gain.value =1;
                
                let newAudioStream = c_audioContext.createMediaStreamDestination();
                audioctx.gainNode.connect(newAudioStream);
                //
                
                //新規に作成した音声ストリームに、映像ストリームを付加
                if(newAudioStream){
                    let videoTrack=null;
                    let videoTracks = stream.getVideoTracks();
                    if (videoTracks.length) {
                        videoTrack = videoTracks[0];
                    }
                    if (videoTrack!=null) {
                        newAudioStream.stream.addTrack(videoTrack);
                    }
                    newstream = newAudioStream.stream;
                }
            }
            // エレメントへ付加する
            let oldBrowserFlg=-1;
            if ('srcObject' in tgtelem) {
              try {
                //$('#peervideo-'+callConnection.remoteId).srcObject = newstream;
                tgtelem.srcObject = newstream;
                oldBrowserFlg=0;
              } catch (error) {
                oldBrowserFlg=1;
              }
            }
            if(oldBrowserFlg!=0){
                var url = URL.createObjectURL(newstream);
                //$('#peervideo-'+callConnection.remoteId).prop('src', url);
                tgtelem.prop('src', url); // video要素のsrcに設定することで、映像を表示する
            }
            
            // HTML側で属性の指定をした場合は不要か
            tgtelem.addEventListener('loadedmetadata', e => {
                if(audioMixMode==1){
                    tgtelem.muted = true;
                }else{
                    tgtelem.volume = 0.3;
                    tgtelem.muted = false;
                    tgtelem.controls=true;
                }
                tgtelem.play();
            });


          }
      });

      //先方から接続が切断された場合の処理
      callConnection.on("close", () => {
          let i=0;  // dummy
          deletePeerFromCallList(callConnection.remoteId);
      });


}



function deletePeerFromCallList(tgtPeerID){
   
   if ((tgtPeerID in connectedCalls) == true) {
      
      // 切断時に利用するため保存しておいた コールオブジェクト
      let call = connectedCalls[tgtPeerID];
      
      //切断
      if(call) call.close();
      
      //接続先リストから削除する
      delete connectedCalls[tgtPeerID];
      
   }
   //Dom削除
   if ((tgtPeerID in connectedDatas) != true) {
       domAppendOrRemoveforPeer(0,tgtPeerID);
   }
   
}
function deletePeerFromDataList(tgtPeerID){
   
   if ((tgtPeerID in connectedDatas) == true) {
      
      // 切断時に利用するため保存しておいた コールオブジェクト
      let conn = connectedDatas[tgtPeerID];

      //切断
      if(conn) conn.close();
      
      //接続先リストから削除する
      delete connectedDatas[tgtPeerID];
      
   }
   //Dom削除
   if ((tgtPeerID in connectedCalls) != true) {
      domAppendOrRemoveforPeer(0,tgtPeerID);
   }
   
}






function getSkywayPeerInstance(){
    let ans;
    let varres;
    let strKey;
    
    const cookieName = "SkyWayKey";
    
    varres = prompt( "SkyWay key" , getCookie(cookieName) );
    if(varres){
        strKey=varres.toString();
        
        ans = new Peer({ key:strKey, debug: 3}); /* SkyWay keyを指定 */
        
        ans.on("open",(function(strKeyID){
            if(strKeyID){
               setCookie(cookieName,this.socket._key);
            }
        }))
    }
    
    return ans;
}
function getCookie(name){
    let strValue;
    const strCookiename = encodeURIComponent(name);
    
    let cookies = document.cookie.split(';');
    cookies.forEach(function(value) {
        let content = value.split('=');
        if(content[0]==strCookiename){
            strValue = content[1];
        }
    });
    return strValue;
}
function setCookie(strName,strValue,expireDay =3){
    let adddata;
    
    adddata = encodeURIComponent(strName) + "=" + encodeURIComponent(strValue);
    
    let expireTime =0;
    expireTime = 60*60*24; //１日の秒数
    expireTime *= expireDay;
    adddata =adddata + ";max-age=" + (expireTime.toString());
    
    document.cookie = adddata;

}



function domAppendOrRemoveforPeer(mode,strTgtPeerId){
  // Dom の <div id="streams">(=elemDiv_streams変数)内にPeer用のエレメントを追廃する
  //let strTgtPeerId = call.remoteId;
  let strvl;
  let elemvl;

  // 全削除
  let tgtElement = document.getElementById('div_peerid-'+strTgtPeerId);
  if(tgtElement){ 
      while (tgtElement.firstChild) tgtElement.removeChild(tgtElement.firstChild);
      tgtElement.remove(); 
  }

  //新規作成
  if(mode){if(strTgtPeerId!=""){
    let newelem = document.createElement("div");
    newelem.id="div_peerid-"+strTgtPeerId;
    elemDiv_streams.appendChild(newelem);
    let tgtElement = document.getElementById('div_peerid-'+strTgtPeerId);
    
    newelem = document.createElement("video");
    newelem.id="peervideo-"+ strTgtPeerId;
    newelem.setAttribute("autoplay",true);
    newelem.setAttribute("muted",true);
    tgtElement.appendChild(newelem);
    
    newelem = document.createElement("br");
    tgtElement.appendChild(newelem);
    
    newelem = document.createElement("span");
    newelem.id="peerid-"+ strTgtPeerId;
    tgtElement.appendChild(newelem);
    
    

    //削除用のボタンを追加する
    newelem = document.createElement("button");
    newelem.type="button";
    newelem.onclick=function(){
       deletePeerFromCallList(strTgtPeerId);
       deletePeerFromDataList(strTgtPeerId);
    };
    newelem.innerHTML="削除";
    tgtElement.appendChild(newelem);

    
    
    
    
    
    // 相手のIDを表示する
    elemvl = document.getElementById("peerid-" + strTgtPeerId);
    if(elemvl){
        //$("#peerid-" + strTgtPeerId).text(strTgtPeerId);
        elemvl.innerHTML = strTgtPeerId;
    }
    
  }}
  
  
}


// --------------------------
function sendNewChatMessage(tgtmsg){
    //チャットに送信する
    
    for (let key in connectedDatas) {
       let conn = connectedDatas[key];
       if(conn.open) conn.send(tgtmsg);
    }

    // 自分の画面に表示
    let tgtid = "";
    if(SkyWayPeer) { tgtid = SkyWayPeer.id; }
    recieveNewChatMessage(tgtid,tgtmsg)
    
}
// メッセージ受信イベントの設定
let chatMessage_logAry=[];
let chatMessage_saveCntMax=0;
function recieveNewChatMessage(strid,data) {
    // 画面に受信したメッセージを表示
    let strAdd;
    let strHM;
    let strYMDHM;
    
    let nowtime = new Date();
    strHM = "";
    strHM = strHM +strFormatTwoChar(nowtime.getHours()) + ":" ;
    strHM = strHM +strFormatTwoChar(nowtime.getMinutes());
    
    //strYMDHM = nowtime.getFullYear().toString() + "/" ;
    //strYMDHM = strYMDHM +strFormatTwoChar(nowtime.getMonth()+1) + "/" ;
    //strYMDHM = strYMDHM +strFormatTwoChar(nowtime.getDate()) + " " ;
    //strYMDHM = strYMDHM + strHM +":";
    //strYMDHM = strYMDHM +strFormatTwoChar(nowtime.getSeconds());
    
    
    strAdd = strHM +" "+ strid +"\n" + data+"\n";
    elemText_chatMessage_log.value += strAdd;
    
    elemText_chatMessage_log.scrollTop = elemText_chatMessage_log.scrollHeight;
    
    //保存
    let logobj={};
    logobj.rectime = nowtime;
    logobj.peerid = strid;
    logobj.data = data;
    
    chatMessage_logAry.push(logobj);
    
}
function strFormatTwoChar(intval) {
    let ans="";
    if (intval<10) ans = ans +"0";
    ans = ans + intval.toString();
    return ans
}




function chatMessage_saveFN_onchange(){
    saveChatMessageLog()
}
function saveChatMessageLog(){
    let filename;
    let blob;
    let strData;
    let strymd;

    let cntmax = -1;
    if(chatMessage_logAry){ cntmax=chatMessage_logAry.length; }
    if(cntmax>0){
        
        filename = "log.txt";
        if (filename!="") {
            
            if(1==2){
                let write_json=JSON.stringify(chatMessage_logAry);
                blob=new Blob([write_json], {type: 'application/json'});
            }else{
                
                strData="";
                for(let i=0;i<cntmax;i++){
                    let logobj=chatMessage_logAry[i];
                    
                    strymd = logobj.rectime.getFullYear().toString() + "/" ;
                    strymd = strymd +strFormatTwoChar(logobj.rectime.getMonth()+1) + "/" ;
                    strymd = strymd +strFormatTwoChar(logobj.rectime.getDate()) + " " ;
                    strymd = strymd +strFormatTwoChar(logobj.rectime.getHours()) + ":" ;
                    strymd = strymd +strFormatTwoChar(logobj.rectime.getMinutes()) + ":" ;
                    strymd = strymd +strFormatTwoChar(logobj.rectime.getSeconds());
                    
                    strData = strData + strymd;
                    
                    strData = strData + "," +logobj.peerid;
                    strData = strData + "," +logobj.data.replace(/\r?\n/g, ' ');
                    
                    strData = strData + "\n"
                }
                blob = new Blob([strData],{type:"text/plan"});
            }
            elemText_chatMessage_saveBlobLink.href = URL.createObjectURL(blob);
            elemText_chatMessage_saveBlobLink.download = filename;
            elemText_chatMessage_saveBlobLink.click();


            //保存したデータを配列から削除
            if(confirm('出力分をメモリから削除しますか')){
                 chatMessage_logAry.slice(0,cntmax)
            }
            
        }
    }

}


//  -----------

function startVideo(triggerElem = null) {

    // カメラ／マイクのストリームを取得する
    navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints
    }).then(function(stream) {
        
        let audioTracks = stream.getAudioTracks();
        let videoTracks = stream.getVideoTracks();
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
        
    }).then(function() {
        
        let testflg = localStream.active;
        
        for (let key in connectedDatas) {
           let flg=0;
           if (key in connectedCalls){
              let conn = connectedCalls[key];
              if(conn.open) {
                  //conn.replaceStream(localStream);
                  //flg=1;
                  conn.close();
              }
           }
           if(flg==0){
                  sendStreamToPeer(key); // 相手へのデータ通信接続を開始する
                   // connectedCalls[key]の内容は更新される
           }
        }
        
        let aaaaa=0;

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
  
  
  
  
    for (let key in connectedCalls) {
       let conn = connectedCalls[key];
       if(conn.open) {
           conn.close(true);
       }
       delete connectedCalls[key];
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
