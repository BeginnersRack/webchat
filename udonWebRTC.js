let localStream;    // 自分の映像ストリームを保存しておく変数
let audioTrack = null;
let videoTrack = null;

let mediaRecorder; //録音用
let mediaRecorder_micVolumeGain;


let SkyWayPeer;
let connectedCalls={};  // 接続したコールを保存しておく連想配列変数
let connectedDatas={};  // 接続したchatデータコネクトを保存しておく連想配列変数
let connectedDatasModifyFlg=0;
let audioContextCtrls={};  // ボリュームゲイン等のコントロール用

let videoConstraints = null;
let videoConstraintsText = "";
let audioConstraints = null;
let audioConstraintsText = "";


videoConstraintsText = '{ "width": {"max":320}, "height": {"max":240} ,"frameRate": { "ideal": 5, "max": 10 } }';
audioConstraintsText = '{ "sampleSize": 8, "channelCount": 1, "echoCancellation": false}';





// ===================================================
const saveaudio_chunks = [];   // 音声の録音用データ格納先

function audioRecCommand(mode){ //HTMLボタンより呼び出される。 mode=0:停止, 1:開始
    if(mode==1){ // 開始
        if(createAudioOutputStream()<=0){
            mode=0;
        }else{
            //sendNewChatMessage("(system-rec)");
            if(elemTextArea_RecSound)elemTextArea_RecSound.innerHTML="録音中";
        }
    }else{ // 終了
        if(mediaRecorder){
            mediaRecorder.stop();
        }
        //mediaRecorder=null;
        if(elemTextArea_RecSound)elemTextArea_RecSound.innerHTML="";
    }
    return mode;
}
function createAudioOutputStream(){
    
    let sorceCnt =0;
    
    let recAudioContext = new (window.AudioContext || window.webkitAudioContext)(); 
    let newDestination = recAudioContext.createMediaStreamDestination();
    
    // Mic      
            if(localStream){
                let audioTracks = localStream.getAudioTracks();
                if(audioTracks.length) {if(audioTracks[0]){
                  let tgtgain=0;
                  //ボリュームを追加
                  if(soundOnlyFlg){
                      if(typeof elemAudio_myMic=="object"){if(elemAudio_myMic){if(elemAudio_myMic.volume){
                          tgtgain=elemAudio_myMic.volume;
                      }}}
                  }else{
                      if(typeof elemVideo=="object"){if(elemVideo){if(elemVideo.volume){
                          tgtgain=elemVideo.volume;
                      }}}
                  }
                  
                  if(tgtgain>0){
                      let audioctxGainNode;
                      //audioctx.AudioContext = new (window.AudioContext || window.webkitAudioContext)();
                      audioctxGainNode = recAudioContext.createGain();
                      
                      let audioSource = recAudioContext.createMediaStreamSource(localStream);
                      audioSource.connect(audioctxGainNode);
                      mediaRecorder_micVolumeGain = audioctxGainNode.gain;
                      //audioctxGainNode.gain.value =1;
                      mediaRecorder_micVolumeGain.value = tgtgain; //自カメラ映像再生用の音量に合わせる(Mute無効)
                      
                      audioctxGainNode.connect(newDestination);
                      sorceCnt+=1;
                  }
                }}
            }
            
            
            
            
            
    //stream
    
    for (let key in audioContextCtrls) {
    //    let ctrls = audioContextCtrls[key].gainNode;
    //    if(ctrls) {
    //        ctrls.connect(newDestination);
    //        sorceCnt+=1;
    //    }
        
        let audioTracks = null;
        if(audioContextCtrls[key]){if(audioContextCtrls[key].orgStream){
            audioTracks = audioContextCtrls[key].orgStream.getAudioTracks();
        }}
        if(audioTracks){if(audioTracks.length) {if(audioTracks[0]){
          //let ctrls = recAudioContext.createMediaStreamSource(audioContextCtrls[key].orgStream);
            let ctrls = recAudioContext.createMediaStreamSource(new MediaStream(audioTracks));
            ctrls.connect(newDestination);
            sorceCnt+=1;
        }}}
    }
    
    // output
    
    
    //ここからテスト
    //sorceCnt =-1;
    if(sorceCnt==-1){
        let newelem = document.createElement("audio");
        newelem.id="peeraudioXXXXXXX";
        newelem.setAttribute("autoplay",true);
        newelem.setAttribute("muted",true);
        newelem.volume = 0.3;
        newelem.controls="true";
        newelem.addEventListener('loadedmetadata', e => {
                        newelem.muted = "false";
                   // newelem.play();
        });
        let audioTracks;let cntxtss;let newDest;let myAudioContext;
        switch(4){
        case 1:
            newelem.srcObject = audioContextCtrls[Object.keys(audioContextCtrls)[0]].orgStream;
            break;
        case 2:
            audioTracks = audioContextCtrls[Object.keys(audioContextCtrls)[0]].orgStream.getAudioTracks();
            newelem.srcObject = new MediaStream(audioTracks);
            break;
        case 3:
            myAudioContext = new (window.AudioContext || window.webkitAudioContext)(); 
            
            audioTracks = audioContextCtrls[Object.keys(audioContextCtrls)[0]].orgStream.getAudioTracks();
            cntxtss = myAudioContext.createMediaStreamSource(new MediaStream(audioTracks));
            
            newDest =myAudioContext.destination;
            cntxtss.connect(newDest);
            
            newelem.srcObject = newDest.stream;
            break;
        case 4:
            myAudioContext = new (window.AudioContext || window.webkitAudioContext)(); 
            
            audioTracks = audioContextCtrls[Object.keys(audioContextCtrls)[0]].orgStream.getAudioTracks();
            cntxtss = myAudioContext.createMediaStreamSource(new MediaStream(audioTracks));
            
            newDest = myAudioContext.createMediaStreamDestination();
            cntxtss.connect(newDest);
            
            newelem.srcObject = newDest.stream;
            break;
        default:
            newelem.srcObject = newDestination.stream;
            break;
        }
        //
        elemRec_SW.parentElement.appendChild(newelem);
    }
    //ここまでテスト
    
    
    
    if(sorceCnt<=0){
        console.log("debug : No AudioSource for Record."  );
    }else{
        let mimetypeChoice='audio/webm';
        if(MediaRecorder.isTypeSupported("audio/webm\;codecs=opus")){ mimetypeChoice='audio/webm\;codecs=opus'; }
        
        mediaRecorder = new MediaRecorder(newDestination.stream, { mimeType: mimetypeChoice });
        
        for(let i=saveaudio_chunks.length;i>0;i--){
            saveaudio_chunks.shift();
        } // saveaudio_chunks を空にする。
        
        mediaRecorder.addEventListener('dataavailable', e => { 
              // 一定間隔で録画が区切られて、データが渡される
              if (e.data.size > 0) {
                 saveaudio_chunks.push(e.data);
                 //saveaudio_chunks[0]=(e.data);
              }
        });
        
        mediaRecorder.addEventListener('stop', () => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob(saveaudio_chunks,{'type': mimetypeChoice }));
            a.download = 'audio-test.webm';
            a.click();
            
            mediaRecorder=null;
        });
        
        mediaRecorder.start();
    }
    
    return sorceCnt;
}
function recreateAudioOutputStream(){
    if(mediaRecorder){
        
        mediaRecorder.stop(); // 一旦、今までの録音内容をファイルに出力
        
        recreateAudioOutputStream_restart(); // 録音を再開
        
    }
}
function recreateAudioOutputStream_restart(){
    if(mediaRecorder){
        setTimeout( recreateAudioOutputStream_restart ,100);
    } else {
        createAudioOutputStream();
    }
}
//-----------------
window.addEventListener("beforeunload", function(event) {


    //接続先PeerIDをクッキーに保存しておく
    const cookieName = "recentPeerId";
    let strValue="";
    if(connectedDatas){
        for (let peerid in connectedDatas) {
            if(peerid!=SkyWayPeer.id){
                strValue=peerid;
            }
        }
    }
    
    if(strValue!=""){
        setCookie(cookieName,strValue,(0.5)); //保持時間を日で指定
    }
    




    if(1==1){
        //    残念ながら、unloadイベントでは非同期処理は実行できない（実行されるまえに終了してしまう）
        //    このため、ページ遷移警告の後に切断処理等をおこなうことはできない。
        event.preventDefault(); //ページ遷移警告の表示
        event.returnValue = ''; //ページ遷移警告の表示
    }else{
        //--- 切断 --- 
        sendNewChatMessage("(退出)");
        quitAllConnection();
    }
    
});
const terminationEvent = 'onpagehide' in self ? 'pagehide' : 'unload';
window.addEventListener(terminationEvent, function(event) {

    //--- 切断 --- 
    //    残念ながら、unloadイベントでは非同期処理は実行できない（実行されるまえに終了してしまう）
    //    このため、ページ遷移警告の後に切断処理等をおこなうことはできない。
    //sendNewChatMessage("(退出)");
    //quitAllConnection();
    
    
    let intCnt=Object.keys(connectedDatas).length;
    if (intCnt>0){
        sendNewChatMessage("(退出)");
        quitAllConnection();
        
        // 終了するまでの時間稼ぎをする(ただし最大30秒まで)
        let tgttime = new Date();
        tgttime.setSeconds( tgttime.getSeconds() + 30);
        
        while (intCnt>0) {
            if(connectedDatasModifyFlg!=0) { intCnt=1; }
            else{intCnt = Object.keys(connectedDatas).length;}

            let nowtime = new Date();
            if(nowtime>tgttime) intCnt=0;
        }
        
    }
    
    
});

// ===================================================



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

// =====================================


function startMultiparty(){
  
  // SkyWayのシグナリングサーバーへ接続する
  SkyWayPeer = getSkywayPeerInstance();
  
  if(SkyWayPeer){
    // シグナリングサーバへの接続が確立したときに、このopenイベントが呼ばれる
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
  
  
  let strValue=getCookie("recentPeerId");
  if(strValue){if(strValue!=""){
      if(elemText_AddNewPeerID){
          elemText_AddNewPeerID.value=strValue;
      }
  }}
  
  // 接続の初期化(ON)
  // toggleElemStream_SW();
  
}


// 新しい接続先に此方から接続に行った場合。 利用者の操作からの処理である場合 actionFlg=1
function addNewPeer(newPeerID,actionFlg=1){
  if(SkyWayPeer){
    forceOnElemStream_SW();
    
    // 相手と通話を開始して、自分のストリームを渡す
    sendStreamToPeer(newPeerID);
    
    // 相手へのデータ通信接続を開始する
    connectDataToPeer(newPeerID,actionFlg);
    
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
function connectDataToPeer(newPeerID,actionFlg=0){
    // 相手へのデータ通信接続を開始する
    let conn = SkyWayPeer.connect(newPeerID);

    if(conn){
            createNewPeerSettingData(conn,1,actionFlg);
            // 相手のIDを表示する
            // - 相手のIDはconnectionオブジェクトのidプロパティに存在する
            //$("#peer-id").text(conn.remoteId);


    }
}
function createNewPeerSettingData(dataConnection,directionFlg=0,actionFlg=0){
    //新規の通信相手を設定する(data)  dataConnection.remoteId は相手のPeerID
    // directionFlg=1:こちらからの接続要求。0：向こうからの接続要求
    console.log("debug : createNewPeerSettingData() "+(directionFlg==1 ? "to ":directionFlg==0 ? "from ":"??? ")+dataConnection.remoteId+"."  );

    forceOnElemStream_SW();

     if (dataConnection.remoteId in connectedDatas) {
         console.log("Warning (debug): コネクションojb上書き発生 ["+dataConnection.remoteId+"]."  );
     }else{
         recieveNewChatMessage(dataConnection.remoteId,"(接続)",1); // 自分のLog画面に表示
     }


      
     // 切断時に利用するため、コネクションオブジェクトを保存しておく
      connectedDatas[dataConnection.remoteId] = dataConnection;

     // 通信相手一覧のHTML-Domを設置する
      if(!(document.getElementById('div_peerid-'+dataConnection.remoteId))){
          domAppendOrRemoveforPeer(1,dataConnection.remoteId); //Dom生成
      }
      
      
      // メッセージ受信イベントの設定
      dataConnection.on("data", function(data){
            checkRecievedDataStatus(dataConnection.remoteId , data);
      });
      
      //先方から接続が切断された場合の処理
      dataConnection.on("close", function(data){
            let i=0;   // dummy
            deletePeerFromCallList(dataConnection.remoteId);//データ接続切断時は映像/音声も切断する
            deletePeerFromDataList(dataConnection.remoteId);
      });
      
      
      dataConnection.on("open", function(data){
          if(actionFlg!=0){ //こちらからの要求操作である場合
              //こちらで保持している接続先を相手に送信する
              sendListConnection(dataConnection.remoteId,1); // 送信先相手に、再送信要求付を付ける
          }
      });
      


   
}
function sendListConnection(remoteId,requireCastFlg=0){
    //こちらで保持している接続先を相手に送信する
    if(remoteId){if (remoteId in connectedDatas){
        let conn = connectedDatas[remoteId];
        if(conn.open) {
            let strlist = ""; 
            if(!(remoteId in connectedDatas)){ strlist = ","+(remoteId.toString(10)) }
            for (let key in connectedDatas) {
                strlist += (","+key);
            } 
            
            let stts="CL";
            if (requireCastFlg!=0) stts+="2"; // 再送信要求付 CL2
            conn.send(stts+strlist); //strlistの最初はカンマ
        }
    }}
    
}
function createConnectionByList(strList,mode=1){
    //与えられた接続先リストを確認し、未接続な相手があれば接続を試みる
    // mode=0:通常、1:IDが自分より大きい相手のみ、2:小さい相手のみ
    let ans =0;
    let flg=0;
    let flg2=0
    
    let tgtlist = strList.split(",");
    for (const tgtId of tgtlist) {
        if(tgtId){if(tgtId!=""){if(tgtId!=SkyWayPeer.id){
            if (!(tgtId in connectedDatas)){
                flg=0;
                switch(mode){
                    case 0:
                        flg=1;
                        break;
                    case 1:
                        if(tgtId>SkyWayPeer.id) {flg=1;} else {flg2=1;};
                        break;
                    case 2:
                        if(tgtId<SkyWayPeer.id) {flg=1;} 
                        break;
                    default:
                        flg=0;
                }
                if (flg!=0){
                    addNewPeer(tgtId,0);
                    ans++;
                }
            }
        }}}
    }
    
    if(ans!=0){
        console.log("debug : createConnectionByList Mode"+String(mode)+" finish "+String(ans)+"."+(mode==2 ? "[Warning]delay!":"")  );
    }
    if (mode==1){
        if(flg2!=0){
            setTimeout( function(){createConnectionByList(strList,2)} ,1000 );
        }
    }
    return ans;
}
function allSendListConnection(expires=""){
    //全ての接続先に、こちらの接続先リストを送信する。但しExpiresを除く
    for (let key in connectedDatas) {
        if(key){if(key!=""){if(key!=SkyWayPeer.id){if(key!=expires){
            sendListConnection(key);
        }}}}
    }
}


function checkRecievedDataStatus(remoteId,data){
  // 受信データを種別で振分けする。remoteIdは送信者。
  if(data){if(data.length>=3){
      let stts = (data.split(",", 1 ))[0];
      let data2 = data.slice(stts.length+1);
      
      switch(stts){
        case "CM": // Chatメッセージ
            recieveNewChatMessage(remoteId,data2);
            break;
        case "CL": // ConnectionList 接続先一覧
        case "CL2": // 再送信要求付
            console.log("debug : recieve ConnectionList ["+stts+"] from "+remoteId+"."  );
            createConnectionByList(data2,1);
            if(stts=="CL2") {
                allSendListConnection(); //新規入室者を全メンバーに通知
                //sendNewChatMessage("(入室) "+remoteId); // 入室者はremoteIdであり、自分は申請受付者になる
            }
            break;
        default:
            console.log("Warning(debug):["+remoteId+"]より不正なデータ("+stts+")を受診 : " + data);
            break;
      }
  }}
}





function createNewPeerSettingCall(callConnection){
    //新規の通信相手を設定する(Stream)
   
   // 切断時に利用するため、コールオブジェクトを保存しておく
   connectedCalls[callConnection.remoteId] = callConnection;
   
   // 通信相手一覧のHTML-Domを設置する
   //if(!(document.getElementById('div_peerid-'+callConnection.remoteId))){
   //   domAppendOrRemoveforPeer(1,callConnection.remoteId); //Dom生成
   //}
   
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
      
      callConnection.on('stream', function(stream){
          // 映像ストリームオブジェクトをURLに変換する
          // - video要素に表示できる形にするため変換している
          let tgtelem;
          if(soundOnlyFlg){
             tgtelem=document.getElementById('peeraudio-'+callConnection.remoteId);
          }else{
             tgtelem=document.getElementById('peervideo-'+callConnection.remoteId);
          }
          if(tgtelem){
             
            if ('srcObject' in tgtelem) {
                tgtelem.srcObject = stream;
            }else{
                // var blob=new Blob([data],{type:"audio/webm"})
                // tgtelem.src=win.URL.createObjectURL(blob)
                tgtelem.src = URL.createObjectURL(stream)
            }
            
            //録音用GainNodeへの設定
            if(callConnection.remoteId in audioContextCtrls){
             if(audioContextCtrls[callConnection.remoteId].gainNode){
                let audioTracks = stream.getAudioTracks();
                if(audioTracks.length) {if(audioTracks[0]){
                    //audioContextCtrls[callConnection.remoteId].orgStream=new MediaStream(audioTracks);
                    audioContextCtrls[callConnection.remoteId].orgStream=stream;
                    //let audioSource = c_audioContext.createMediaStreamSource(stream);
                    let audioSource = c_audioContext.createMediaStreamSource(new MediaStream(audioTracks));
                    audioSource.connect(audioContextCtrls[callConnection.remoteId].gainNode);
                    audioContextCtrls[callConnection.remoteId].gainNode.gain.value =1;
                    
                }}
            }}
            
            if(!soundOnlyFlg){      //映像再生の開始
                if(1==2){   // HTML側で属性の指定をした場合は不要か
                  tgtelem.addEventListener('loadedmetadata', e => {
                      tgtelem.volume = 0.3;
                      tgtelem.muted = false;
                      tgtelem.controls=true;
                      tgtelem.play();
                  });
                }
            }
            
            
            //録音に通知
            if(mediaRecorder!==null){
                recreateAudioOutputStream();
            }
            
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
      if(call) call.close(true);
      
      //接続先リストから削除する
      delete connectedCalls[tgtPeerID];
      
   }
   //Dom削除
   //if ((tgtPeerID in connectedDatas) != true) {
   //    domAppendOrRemoveforPeer(0,tgtPeerID);
   //}
   
}
function deletePeerFromDataList(tgtPeerID){
   connectedDatasModifyFlg=1;
   if ((tgtPeerID in connectedDatas) == true) {
      
      // 切断時に利用するため保存しておいた コールオブジェクト
      let conn = connectedDatas[tgtPeerID];

      //切断
      if(conn) conn.close(true);
      
      //接続先リストから削除する
      delete connectedDatas[tgtPeerID];
      
      recieveNewChatMessage(tgtPeerID,"(退室)",1); // 自分のLog画面に表示
   }
   //Dom削除
   if ((tgtPeerID in connectedCalls) != true) {
      domAppendOrRemoveforPeer(0,tgtPeerID);
   }
   connectedDatasModifyFlg=0;
}


function quitAllConnection(){
    //全ての接続先を切断する
   
   for (let tgtPeerID in connectedCalls) {
      deletePeerFromCallList(tgtPeerID);
   }
   for (let tgtPeerID in connectedDatas) {
      deletePeerFromDataList(tgtPeerID);
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
        if((content[0].trim())==strCookiename){
            strValue = (content[1].trim());
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
    //コンテナとなるDiv要素
    let newelem = document.createElement("div");
    newelem.id="div_peerid-"+strTgtPeerId;
    newelem.style="display:inline-block"; // 縦に並べるならblock,横ならinline-block
    elemDiv_streams.appendChild(newelem);
    
    let tgtElement = document.getElementById('div_peerid-'+strTgtPeerId);
    
    //内容
    
    if(soundOnlyFlg){
      // audio
      newelem = document.createElement("audio");
      newelem.id="peeraudio-"+ strTgtPeerId;
      newelem.autoplay=true;
      newelem.setAttribute("autoplay",newelem.autoplay);
      newelem.volume=0.1;
      newelem.setAttribute("volume",newelem.volume);
      newelem.muted=true;
      newelem.setAttribute("muted",newelem.muted);
      newelem.controls=true;
      newelem.setAttribute("controls",newelem.controls);
      
      newelem.addEventListener('loadedmetadata', e => {
                      newelem.muted = "false";
                 // newelem.play();
      });
      
      
      tgtElement.appendChild(newelem);
      newelem = document.createElement("br");
      tgtElement.appendChild(newelem);
    }else{
      // video   （サイズ等は div.videoframe スタイルシートで定義）
      let newelem2 = document.createElement("video");
      newelem2.id="peervideo-"+ strTgtPeerId;
      newelem2.autoplay=true;
      newelem2.setAttribute("autoplay",newelem2.autoplay);
      newelem2.controls=true;
      newelem2.setAttribute("controls",newelem2.controls);
      newelem2.volume=0.1;
      newelem2.setAttribute("volume",newelem2.volume);
      newelem2.muted=true;
      newelem2.setAttribute("muted",newelem2.muted);


      
      newelem = document.createElement("div");
      newelem.setAttribute("class","videoframe");
      newelem.appendChild(newelem2);
      
      tgtElement.appendChild(newelem);
    }
    
    // 録音用のボリュームを同期させる(この直前に追加したElementのvolumneに連動させる)
    if(!(strTgtPeerId in audioContextCtrls)){ audioContextCtrls[strTgtPeerId]={}; }
    if(!(audioContextCtrls[strTgtPeerId].gainNode)){    // 録音用のGainノードを生成する
        audioContextCtrls[strTgtPeerId].gainNode=c_audioContext.createGain();
    }
    newelem.addEventListener('volumechange', e => {
        if(strTgtPeerId in audioContextCtrls){
            let ctrls = audioContextCtrls[strTgtPeerId].gainNode;
            if(ctrls) {
                if(newelem.volume){
                    ctrls.gain.value = newelem.volume; //gain
                }
            }
        }
    });
    
    
    

    
    newelem = document.createElement("span");
    newelem.id="peerid-"+ strTgtPeerId;
    tgtElement.appendChild(newelem);
    // 相手のIDを表示する
    elemvl = document.getElementById("peerid-" + strTgtPeerId);
    if(elemvl){
        //$("#peerid-" + strTgtPeerId).text(strTgtPeerId);
        elemvl.innerHTML = strTgtPeerId;
    }
    

    //削除用のボタンを追加する
  if(1==1){
    newelem = document.createElement("button");
    newelem.type="button";
    newelem.onclick=function(){
       deletePeerFromCallList(strTgtPeerId);
       deletePeerFromDataList(strTgtPeerId);
    };
    newelem.innerHTML="x"; //削除
    tgtElement.appendChild(newelem);
  }
    
    
    
    
    
    newelem = document.createElement("br");
    tgtElement.appendChild(newelem);
    
  }}
  
  
}


// --------------------------
function sendNewChatMessage(tgtmsg){
    //チャットに送信する
    
    for (let key in connectedDatas) {
       let conn = connectedDatas[key];
       if(conn.open) conn.send("CM,"+tgtmsg);
    }

    // 自分のLog画面に表示
    let tgtid = "";
    if(SkyWayPeer) { tgtid = SkyWayPeer.id; }
    recieveNewChatMessage(tgtid,tgtmsg)
    
}
// メッセージ受信イベントの設定
let chatMessage_logAry=[];
let chatMessage_saveCntMax=0;
function recieveNewChatMessage(strid,data,crflg=0) {
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
    
    
    strAdd = strHM +" "+ strid;
    if(crflg==0) strAdd = strAdd+"\n";
    strAdd = strAdd + data+"\n";
    
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
  
  //デバイス確認
  let enableVideoFlg =0;
  let enableAudioFlg =0;
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) { // 成功時
      devices.forEach(function(device) {
         if(device.kind=="videoinput"){ enableVideoFlg=1; }
         if(device.kind=="audioinput"){ enableAudioFlg=1; }
      });
  }).catch(function(err) { // エラー発生時
      console.log(err.name + "[enumerateDevices]: " + err.message);
  }).then( function(stream) {
    
    
    if((enableVideoFlg+enableAudioFlg)==0){
        startVideo_functionEnd(); // 終了処理
    }
    
    
    enableVideoFlg=0;
        
        
    
    // カメラ／マイクのストリームを取得する
    
    //navigator.mediaDevices.getUserMedia({
    //    video: videoConstraints ,
    //    audio: audioConstraints
    //}).then( function(stream) 
    
    let enableDeviceAry = {};
    if(enableVideoFlg!=0){enableDeviceAry.video = videoConstraints;}
    if(enableAudioFlg!=0){enableDeviceAry.audio = audioConstraints;}
    
    navigator.mediaDevices.getUserMedia(enableDeviceAry
    ).then( function(stream) {
        
        let audioTracks = stream.getAudioTracks();
        if (audioTracks.length) {
            audioTrack = audioTracks[0];
        }
        if(!soundOnlyFlg){
          let videoTracks = stream.getVideoTracks();
          if (videoTracks.length) {
            videoTrack = videoTracks[0];
          }
        }
        
        
        let newDestination=null;
        //マイクからの音量に増幅を掛ける（新しいストリームを新規に作成）
        if (audioTrack!==null) {
            const micSource = c_audioContext.createMediaStreamSource(stream);
            newDestination = c_audioContext.createMediaStreamDestination();
            micSource.connect(c_gainNode);
            c_gainNode.connect(newDestination);
        }
        
        //新規に作成した音声ストリームに、映像ストリームを付加
        localStream = null;
        if(soundOnlyFlg){
            if(newDestination===null){
                  localStream = stream;
            }else{
                  localStream = newDestination.stream;
            }
        }else{
            if(newDestination===null){
                if (videoTrack!==null) {
                    localStream = stream;
                }
            }else{
                if (videoTrack!==null) {
                    newDestination.stream.addTrack(videoTrack);
                    localStream = newDestination.stream;
                }else{
                    localStream = newDestination.stream;
                }
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
        
        
        
        
        if(!soundOnlyFlg){
            flg=false;
            if(elemVideo_SW){
                if(elemVideo_SW.value!=0){
                    flg=true;
                }
            }
            changAbleStream(localStream.getVideoTracks(),flg)
        }
        
        
        
        
        if(localStream !== null){
            
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
            
            //録音に通知
            if(mediaRecorder!==null){
                recreateAudioOutputStream();
            }
        }

        
    }).then(function() {
        new Promise(function(resolve) {
          //elemVideo.onloadedmetadata = resolve;
        });
    }).then(function() {
        getCurrentSettings(); // 今の設定(初期状態)を変数に保存
        
        if(!soundOnlyFlg){
            CheckEnable_videoTrack(triggerElem , 3);
        }
        
        c_audioContext.resume().then(() => { console.log('Playback audioContext resumed successfully');}); //Chromeのセキュリティ設定
        
    }).then(function() {
        
        
        for (let key in connectedDatas) {
           let flg=0;
           if (key in connectedCalls){
              let conn = connectedCalls[key];
              if(conn.open) {
                  //conn.replaceStream(localStream);
                  //flg=1;
                  conn.close(true);
              }
           }
           if(flg==0){
                  sendStreamToPeer(key); // 相手へのデータ通信接続を開始する
                   // connectedCalls[key]の内容は更新される
           }
        }
        
    }).then(function() { // 終了処理
        startVideo_functionEnd(); 
    }).catch(function(err) { // エラー発生時
      console.log(err.name + "[]: " + err.message);
    });
  
  
  });
  
  
  //------- 終了処理
  function startVideo_functionEnd(){
      setTimeout(function(){resurrectionBtnElem(triggerElem)}, 1000);
  }
}



function stopVideo(triggerElem = null){
  getCurrentSettings(); // 今の設定(初期状態)を変数に保存
  
  if (videoTrack) {
    videoTrack.stop();
  }
  if (audioTrack) {
    audioTrack.stop();
  }
  
  videoTrack = null;
  audioTrack = null;
  
  
  
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

function forceOnElemStream_SW(){
    if(elemStream_SW.value==0){
        toggleElemStream_SW();
    }
}
function toggleElemStream_SW(){  // 接続の初期化（ON/OFF）

         if(elemStream_SW.value!=0){
             elemStream_SW.value=0;
             elemStream_SW.innerText = "通信再開";
             dispInfoStreamStatus();
         }else{
             elemStream_SW.value=1;
             elemStream_SW.innerText = "通信停止";
             dispInfoStreamStatus();
         }
         
         initVideoConstraints(elemStream_SW);
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

               if(!soundOnlyFlg){
                   if(elemRange_VideoFrameRate){
                       elemRange_VideoFrameRate.value = videoConstraints.frameRate;
                       //update_elemRange_VideoFrameRateCurVal();
                       elemRange_VideoFrameRate.dispatchEvent(c_elemEvent_input);
                   }
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

