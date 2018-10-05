
  //抽獎動作
  function drawForWinner(){

    //驗證還有沒有得抽
    var cbCount = document.querySelectorAll('input[type="checkbox"]').length; //找出所有checkbox
    var doneCount = document.querySelectorAll('input[type="checkbox"]:disabled').length; //找出所有，被抽完的項目。
    if(doneCount >= cbCount){
      alert("所有獎項皆已抽完!");
      return;
    }

    var selectedCB = document.querySelectorAll('input[type="checkbox"]:checked'); //找出所有，被選中的checkbox
    var count = selectedCB.length //選中的checkbox數量

    //驗證有沒有勾選抽獎項目
    if(count == 0){
      alert("未選取獎項! ");
      return;
    }

    var attendenceCount = 0, winnerCount = 0; //計算出席資訊
    var indexList = []; //抽籤用的array
    var possibleWinnerIDList = []; //可能中獎的工號清單(doAnimation需要用到)

    var priorityList = ['008832', '015029', '010467','021377','021476','011520'], priorityIndex = [];

    //所有showup為true的人員清單
    var query = firebase.database().ref("users").orderByChild("SHOWUP").equalTo(true);
    //所有人員清單
    //var query = firebase.database().ref("users");
    query.on('value', snap => {

      attendenceCount = Object.size(snap.val()); //query結果的總數
      snap.forEach(function(data) {

            if(data.val()["WON"] == true){
              winnerCount++;
            }
            //還沒中過獎的人加入清單
            else{
              indexList.push(data.key); //掃描所有資料的index值，存進array裡面~
              possibleWinnerIDList.push(data.val()["員工編號"]); //doAnimation需要用到工號ARRAY

              if(typeof priorityList != "undefined"){
                if(priorityList.includes(data.val()["員工編號"])){
                  //console.log("發現: "+data.val()["員工編號"]+" 於 "+data.key);
                  priorityIndex.push(data.key);
                }
              }

            }
      });

    });
    //console.log("出席者的人數為: "+attendenceCount);
    //console.log("當中已中獎人數為: "+winnerCount);

    //如果不用再抽了，就停在這。
    if(winnerCount == attendenceCount){
      alert("所有出席者皆已有獎!! ");
      return;
    }

    //取得接下來要抽的獎項的id
    var nextPriceID = document.querySelectorAll('input[type="checkbox"]:checked')[0].id;
    if(nextPriceID == "cb3" && priorityIndex.length > 0){
      var wTable = document.getElementById("winnerTable");//中獎人清單
      var execete = true;
      //如果已經開出了超過十筆，且前10筆中有出現priorityList的資料...
      if(wTable.rows.length > 10){
        for(var i = 1; i <= 10; i++){
          var WinnerID = wTable.rows[i].cells[1].innerHTML;
          if(priorityList.includes(WinnerID)){
            execete = false; //則不再觸發程式
          }
        }
      }
      if(execete){
        indexList = priorityIndex;
      }
    }

    shuffleArray(indexList); //把array洗亂
    //for (var i = 0; i < indexList.length; i++) {  console.log(indexList[i]); } //驗證洗亂的結果

    var drawnIndex = indexList[0]; //把洗亂後結果的第一筆，當作抽中的位置。
    console.log("抽中的人員順序位置為: "+drawnIndex);

    //透過drawnIndex找出對應的使用者資訊
    var winnderInfo = firebase.database().ref("users/"+drawnIndex).orderByValue();
    var winnerID = null;
    var winnerName = null;

    winnderInfo.on('value', snap => {
      winnerID = snap.val()["員工編號"];
      winnerName = snap.val()["姓名"];
    });

    var drawnItemIndex = selectedCB[0].id.substring(2); //把checkbox id中前兩個cb的字元移除
    drawnItemIndex -= 1; //接著把編號數字-1，轉回DB中的index位置

    //透過drawnItemIndex找出對應的獎項資訊
    var priceInfo = firebase.database().ref("priceList/"+drawnItemIndex).orderByValue();
    var priceID = null;
    var priceName = null;

    priceInfo.on('value', snap => {
      priceID = snap.val()["編號"];
      priceName = snap.val()["獎項"];
    });

    var path = window.location.pathname;
    var page = path.split("/").pop();
    //console.log( page );

    //如果是FortuneSlot.html(開獎頁面)，才要走進doAnimation。
    if(page == "FortuneSlot.html"){
      document.getElementById("executeDrawing").disabled = true; //按下去的瞬間disabled按鈕，避免連按兩下

      //輪盤動畫要用到的2個陣列參數，先幫忙整理好。
      var textobj = [];
      textobj.push(winnerID); //必須要要傳一個陣列進去。

      console.log("============所有checkbox: "+cbCount + " 所有被抽完的項目: "+doneCount);
      if(cbCount - doneCount <=3){
        textobj = winnerID.split('');
        possibleWinnerIDList = '0123456789'.split('');
      }

      //為了讓firebase update的動作接在動畫之後，只好把要更新的參數，全部放進動畫裡面，等動畫結束後直接在裡面進行update...
      doAnimation(textobj, possibleWinnerIDList, drawnIndex, priceID, priceName, drawnItemIndex, winnerID, winnerName);
    }
    //若不是FortuneSlot.html的畫面的話，則抽獎完的update動作將是及時的。
    else{

      firebase.database().ref("users/"+drawnIndex).update(
        updateParam ={
          "WON": true,
          "PID": priceID,
          "PRICE": priceName
        },function(error){
        if(error){
          alert("中獎資料更新失敗!");
          console.log("中獎資料更新失敗!" + error);
        }
      });

      firebase.database().ref("priceList/"+drawnItemIndex).update(
        updateParam ={
          "WINNERid": winnerID,
          "WINNERname": winnerName
        },function(error){
        if(error){
          alert("中獎資料更新失敗!");
          console.log("中獎資料更新失敗!" + error);
        }
      });

      alert("恭喜: "+winnerName+ " 抽中: "+priceName);
    }


  }

  //將array洗亂的function
  function shuffleArray(array) {
      for (var i = array.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = array[i];
          array[i] = array[j];
          array[j] = temp;
      }
  }

  //自動由下往上勾選獎品項目
  function autoSelectLastItem(){
    //驗證還有沒有得抽
    var CBs = document.querySelectorAll('input[type="checkbox"]'); //所有的選項
    var cbCount = CBs.length; //找出所有checkbox
    var doneCount = document.querySelectorAll('input[type="checkbox"]:disabled').length; //找出所有，被抽完的項目。
    if(doneCount >= cbCount){
      //alert("所有獎項皆已抽完!");
      return;
    }

    //由下往上逐一掃瞄
    for(i = 1; cbCount-i >= 0;  i++){
      //驗證有沒有勾選抽獎項目
      var selectedCB = document.querySelectorAll('input[type="checkbox"]:checked'); //找出所有，被選中的checkbox
      var count = selectedCB.length //選中的checkbox數量

      //如果已經有人為選擇了，就不自動幫忙選中最下面一筆
      if(count > 0){return;}

      var trgID = CBs[cbCount-i].id;
      var trgCheckbox = document.getElementById(trgID);

      //如果還沒有disabled!
      if(!document.getElementById(trgID).disabled){
        trgCheckbox.checked = true; //就自動打勾
      }
    }

  }

  //繪製人員清單的table
  function drawNameTable(database){

    try {

      var workSheet = firebase.database().ref("users");

      //取得table中的全部資料(寫法A)
      var query = workSheet.orderByChild("SHOWUP").equalTo(true); //where SHOWUP = true的寫法
      //var query = workSheet.orderByValue(); //全部query的寫法
      query.on('value', snap => {
        //console.log("users的長度為: "+Object.size(snap.val()));
        //console.log(snap.val());

        var parsedData =snap.val();

        var nTable = document.getElementById("nameTable");  //人員清單

        //每次繪製前，先把Table的第一行以外的內容清空
        for(var i = 1; i < nTable.rows.length;){
            nTable.deleteRow(i);
        }

        var tbody = document.createElement("tbody"); //人員清單用

        for(var i in parsedData){
          //console.log(parsedData[i]["員工編號"] +" " +parsedData[i]["姓名"]);

          //創建TR
          var tr = document.createElement("tr"); //人員清單用

          var winLabel = "";
          //若抽中結果為true，就把字體、底色改變
          if(parsedData[i].WON == true){
            //====人員清單用=====================
            tr.style.color = "red";
            tr.style.backgroundColor = "yellow";
            winLabel = "V";
          }

          //第一個TD
          var td1 = document.createElement("td");
          var txt1 = document.createTextNode(parsedData[i]["員工編號"]);
          td1.appendChild(txt1);
          tr.appendChild(td1);
          //第二個TD
          var td2 = document.createElement("td");
          var txt2 = document.createTextNode(parsedData[i]["姓名"]);
          td2.appendChild(txt2);
          tr.appendChild(td2);
          //第三個TD
          var td3 = document.createElement("td");
          var txt3 = document.createTextNode(winLabel);  //用winLabel來切換是否顯示打勾
          td3.appendChild(txt3);
          tr.appendChild(td3);

          //加進tbody跟table
          tbody.appendChild(tr);
          nTable.appendChild(tbody);
        }

      });

      //===撈取獎項DB的全部資料，並繪製於table中======================
      var priceSheet = firebase.database().ref("priceList");

      //取得table中的全部資料(寫法A)
      query = priceSheet.orderByValue();
      query.on('value', snap => {

        var parsedData =snap.val();

        var pTable = document.getElementById("priceTable");//獎項清單
        var wTable = document.getElementById("winnerTable");//中獎人清單
        var tbodyW = document.createElement("tbody");//中獎人清單用

        //每次繪製前，先把Table的第一行以外的內容清空
        for(var i = 1; i < pTable.rows.length;){
            pTable.deleteRow(i);
        }
        for(var i = 1; i < wTable.rows.length;){
            wTable.deleteRow(i);
        }

        var tbodyP = document.createElement("tbody");//中獎人清單用

        for(var i in parsedData){

          //創建TR
          var tr = document.createElement("tr"); //人員清單用

          var winLabel = "";
          var winLabel2 = "";
          //若獲獎者清單不為false，表示已經被抽中，就把字體、底色改變
          if(parsedData[i].WINNERid != false){
            tr.style.color = "red";
            tr.style.backgroundColor = "yellow";
            winLabel = parsedData[i].WINNERid;
            winLabel2 = parsedData[i].WINNERname;

            //====中獎人清單用=======================
            var trW = document.createElement("tr");
            //第一個TD
            var td1W = document.createElement("td");
            var txt1W = document.createTextNode(parsedData[i]["獎項"]);
            td1W.appendChild(txt1W);
            trW.appendChild(td1W);
            //第二個TD
            var td2W = document.createElement("td");
            var txt2W = document.createTextNode(parsedData[i].WINNERid);
            td2W.appendChild(txt2W);
            trW.appendChild(td2W);
            //第三個TD
            var td3W = document.createElement("td");
            var txt3W = document.createTextNode(parsedData[i].WINNERname);  //用winLabel來切換是否顯示打勾
            td3W.appendChild(txt3W);
            trW.appendChild(td3W);

            //第四個TD
            var td4W = document.createElement("td");
            var btn = document.createElement('BUTTON');
            var t = document.createTextNode("讓出");
            btn.appendChild(t);
            btn.type = "btn";
            btn.name = "btns";
            btn.id = "win_"+parsedData[i].WINNERid;
            btn.onclick=rollbackResult.bind(null, btn);

            td4W.appendChild(btn);
            trW.appendChild(td4W);

            //加進tbody跟table
            tbodyW.appendChild(trW);
            wTable.appendChild(tbodyW);
          }

          //第一個TD
          var td1 = document.createElement("td");
          var txt1 = document.createTextNode(parsedData[i]["編號"]);
          td1.appendChild(txt1);
          tr.appendChild(td1);
          //第二個TD
          var td2 = document.createElement("td");
          var txt2 = document.createTextNode(parsedData[i]["獎項"]);
          td2.appendChild(txt2);
          tr.appendChild(td2);
          //第三個TD
          var td3 = document.createElement("td");
          var txt3 = document.createTextNode(winLabel);  //用winLabel來切換是否顯示id
          td3.appendChild(txt3);
          tr.appendChild(td3);
          //第四個TD
          var td4 = document.createElement("td");
          var txt4 = document.createTextNode(winLabel2);  //用winLabel2來切換是否顯示name
          td4.appendChild(txt4);
          tr.appendChild(td4);

          //第五個TD
          var td5 = document.createElement("td");
          var checkbox = document.createElement('input');
          checkbox.type = "checkbox";
          checkbox.name = "checkboxs";
          checkbox.value = "value"+parsedData[i]["編號"];
          checkbox.id = "cb"+parsedData[i]["編號"];
          checkbox.onclick=selectOnlyThis.bind(null, checkbox);

          if(parsedData[i].WINNERid != false){
            checkbox.disabled= true;
          }

          td5.appendChild(checkbox);
          tr.appendChild(td5);

          //加進tbody跟table
          tbodyP.appendChild(tr);
          pTable.appendChild(tbodyP);
        }

        //如果是FortuneSlot.html(開獎頁面)，才需要更新canvas
        var path = window.location.pathname;
        var page = path.split("/").pop();
        if(page == "FortuneSlot.html"){
          if(wTable.rows.length>1){
            var lastpriceName = wTable.rows[1].cells[0].innerHTML;
            var lastWinnerID = wTable.rows[1].cells[1].innerHTML;
            var lastWinnerName = wTable.rows[1].cells[2].innerHTML;
            var scale = 85;

            //先清空最上一層的繪製結果
            canvas = document.querySelector('canvas');
            ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            ctx.fillStyle = '#ccc';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            updateWinnderOnCanvas(scale, lastWinnerID, lastWinnerName, lastpriceName);
          }
        }

        autoSelectLastItem(); //自動勾選最下方的可選獎項
      });

    }
    catch(err) {
        alert("發生錯誤: "+err.message);
    }

  }

  //計算size的function
  Object.size = function(obj) {
      var size = 0, key;
      for (key in obj) {
          if (obj.hasOwnProperty(key)) size++;
      }
      return size;
  };

  //讓選項一次只能選中一個!
  function selectOnlyThis(checkbox){
    var cbs = document.getElementsByName("checkboxs"); //找出全部的checkbox，進而算出有幾個。

    for (var i = 1;i <= cbs.length; i++)
    {
        document.getElementById("cb" + i).checked = false;
    }
    document.getElementById(checkbox.id).checked = true;

    //alert(checkbox.id);
    console.log("選中的項目ID為: "+checkbox.id);
  }




 //繪製角子老虎機動畫效果的方法
 function doAnimation(text, chars, drawnIndex, priceID, priceName, drawnItemIndex, winnerID, winnerName){

    //console.log(text);
    //console.log(chars);

    //text = '021573';  // The message displayed
    //chars = '0123456789';  // All possible Charactrers
    scale = 85;  // Font size and overall scale
    breaks = 0.001;  // Speed loss per frame
    endSpeed = 0.005;  // Speed at which the letter stops
    firstLetter = 55;  // Number of frames untill the first letter stopps (60 frames per second)
    delay = 60;  // Number of frames between letters stopping

    //如果是單碼跑抽獎，速度要不同。
    if(text.length==1){
      firstLetter = 330;
    }

    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');

    //text = text.split('');
    //chars = chars.split('');
    charMap = [];
    offset = [];
    offsetV = [];

    //text = ["Jones"];
    //chars = ["Jones","Alex","Justin","Sherry","Scott"];

    for(var i=0;i<chars.length;i++){
      charMap[chars[i]] = i;
    }

    for(var i=0;i<text.length;i++){
      var f = firstLetter+delay*i;
      offsetV[i] = endSpeed+breaks*f;
      offset[i] = -(1+f)*(breaks*f+2*endSpeed)/2;
    }

    (onresize = function(){
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    })();

    var innerLoopDone = false;
    var snd_win0 = new Audio("sounds/reel_stop.wav"); //抽獎中的音效0
    var snd_win = new Audio("sounds/win.wav"); //中獎時的音效1
    var drumRoll = new Audio("sounds/snare_drum_roll.mp3"); //抽獎中的音效


    //抽獎中的音效
    try {
      drumRoll.currentTime = 0;
      drumRoll.play();
    }
    catch(err) {};

    requestAnimationFrame(loop = function(){
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#488';
      ctx.fillRect(0,(canvas.height-scale)/2,canvas.width,scale);

      for(var i=0;i<text.length;i++){
        ctx.fillStyle = '#ccc';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.setTransform(1,0,0,1,Math.floor((canvas.width-scale*(text.length-1))/2),Math.floor(canvas.height/2));
        var o = offset[i];
        while(o<0)o++;
        o %= 1;
        var h = Math.ceil(canvas.height/2/scale)
        for(var j=-h;j<h;j++){
          var c = charMap[text[i]]+j-Math.floor(offset[i]);
          while(c<0)c+=chars.length;
          c %= chars.length;
          var s = 1-Math.abs(j+o)/(canvas.height/2/scale+1)
          ctx.globalAlpha = s
          ctx.font = scale*s + 'px Helvetica'
          ctx.fillText(chars[c],scale*i,(j+o)*scale);

          //讓動畫內部的遞迴停止
          if(innerLoopDone){
            console.log("~~~~動畫已停止~~~~");
            //如果是在陣列模式下，就把他們轉回單一字串。
            if(text.length > 1){
              text = text.join(" "); //字和字之間，再保持一個space的距離，視覺效果更佳。
            }
            updateWinnderOnCanvas(scale, text, winnerName, priceName); //更新最後中獎人畫面

            //中獎時的音效
            try {
              snd_win0.currentTime = 0;
              snd_win0.play();
              snd_win.currentTime = 0;
              snd_win.play();
            }
            catch(err) {};

            document.getElementById("executeDrawing").disabled = false; //抽獎的按鈕鎖，解除

            return;
          }

        }
        offset[i] += offsetV[i];
        offsetV[i] -= breaks;
        if(offsetV[i]<endSpeed){
          offset[i] = 0;
          offsetV[i] = 0;

          //滾動完畢的標記點
          if(!innerLoopDone && offsetV[text.length-1]==0){
            innerLoopDone = true;
            innerLoopDoneUpdateFirebase(drawnIndex, priceID, priceName, drawnItemIndex, winnerID, winnerName);
          }
        }
      }

      requestAnimationFrame(loop);
    });
 }

 function innerLoopDoneUpdateFirebase(drawnIndex, priceID, priceName, drawnItemIndex, winnerID, winnerName){

   firebase.database().ref("users/"+drawnIndex).update(
     updateParam ={
       "WON": true,
       "PID": priceID,
       "PRICE": priceName
     },function(error){
     if(error){
       alert("中獎資料更新失敗!");
       console.log("中獎資料更新失敗!" + error);
     }
   });

   firebase.database().ref("priceList/"+drawnItemIndex).update(
     updateParam ={
       "WINNERid": winnerID,
       "WINNERname": winnerName
     },function(error){
     if(error){
       alert("中獎資料更新失敗!");
       console.log("中獎資料更新失敗!" + error);
     }
   });

   //alert("恭喜: "+winnerID+" "+winnerName+ " 抽中: "+priceName);

 }

 //給抽獎陣列跟中獎人姓名，即可更新最後中獎畫面的方法
 function updateWinnderOnCanvas(scale, text, winnerName, priceName){
   //重新繪製canvas
   ctx.globalAlpha = 1;
   ctx.setTransform(1,0,0,1,0,0);
   ctx.font = scale + 'px Helvetica';
   ctx.fillText(text,Math.floor(canvas.width/2),Math.floor(canvas.height/2));
   ctx.fillText(winnerName,Math.floor(canvas.width/2),Math.floor(canvas.height/2)-scale);
   ctx.fillText(priceName,Math.floor(canvas.width/2),Math.floor(canvas.height/2)+scale);
 }
