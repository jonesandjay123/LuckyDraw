
    //頁面載入時檢查是否有連到firebase
    function initApp() {

      var database = firebase.database();

      if(database != null){
        console.log("===已和firebase取得連線===");
        document.getElementById("connection-status").innerHTML = "已連線";
      }
      else{
        alert("沒有連線到firebase...");
        document.getElementById("connection-status").innerHTML = "連線失敗";
      }
    }

    function exportResult(){

      //所有showup為true的人員清單
      var query = firebase.database().ref("users").orderByChild("WON").equalTo(true);

      var keepdoing = true;
      var data = []; //陣列物件

      query.on('value', snap => {

        if(Object.size(snap.val()) <= 0){
          alert("沒有人中獎!");
          keepdoing = false;
          return;
        }

        snap.forEach(function(result) {
            var obj = {
              "獎項": result.val()["PRICE"],
              "工號": result.val()["員工編號"],
              "姓名": result.val()["姓名"]
            };
            data.push(obj);  //把obj塞入陣列
        });
      });

      if(!keepdoing){ return;}

      // a this line is only needed if you are not adding a script tag reference
      if(typeof XLSX == 'undefined') XLSX = require('xlsx');

      // a make the worksheet
      var ws = XLSX.utils.json_to_sheet(data);

      // add to workbook
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "People");

      // agenerate an XLSX file
      XLSX.writeFile(wb, "中獎名單.xlsx");

      console.log("匯出成功~"+data);


    }

    //把攔截出來的Map物件寫入firebaseDB
    function mapToDB(empList){

      //上傳人員清單
      if(checkfileType()=="empListRadio"){

        var obj = empList["工作表"];
        //console.log(obj);

        //在物件中塞入一個新的欄位WON，預設值為false
        for(var i in obj){
          //console.log(obj[i]["員工編號"] + " " +obj[i]["姓名"]);
          obj[i].WON = false;
          obj[i].PRICE = false;
          obj[i].PID = false;
          obj[i].SHOWUP = true;
        }

        //把物件寫入資料庫
        firebase.database().ref("users/").set(obj).then(function() {
            console.log("Document successfully written!");
            alert("人員清單上傳完畢!");
        });

      }
      //上傳獎品清單
      else{

        var obj = empList["獎項"];
        console.log(obj);
        for(var i in obj){
          obj[i].WINNERid = false;
          obj[i].WINNERname = false;
        }

        //把物件寫入資料庫
        firebase.database().ref("priceList/").set(obj).then(function() {
            console.log("Document successfully written!");
            alert("獎項清單上傳完畢!");
        });

      }


    }


    //轉換成JSON
    function to_json(workbook) {
        var result = {};
        workbook.SheetNames.forEach(function(sheetName) {
            var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            if(roa.length > 0){
                result[sheetName] = roa;
            }
        });
        return result;
    }

    //檔案處裡
    function process_wb(wb) {
        var output = "";
        //這裡拿掉了Switch case只留下Json的做法
        output = JSON.stringify(to_json(wb), 2, 2);

        mapToDB(to_json(wb));  //從中將map資料拿去寫入firebaseDB
        console.log(output);
        //if(out.innerText === undefined) out.textContent = output;
        //else out.innerText = output;
    }


    //讀取檔案
    //參考文件: http://codetheory.in/parse-read-excel-files-xls-xlsx-javascript/
    function filePicked() {
        var oFile = document.getElementById('file').files[0];
        var sFilename = oFile.name;

        console.log("===讀取到的檔案名稱: "+sFilename);
        //拿掉了迴圈，只走單一檔案的處裡。
        var reader = new FileReader();
        reader.onload = function(e) {
            var data = e.target.result;
            //var wb = XLSX.read(data, {type: 'binary'});
            var arr = String.fromCharCode.apply(null, new Uint8Array(data));
            var wb = XLSX.read(btoa(arr), {type: 'base64'});
            process_wb(wb);
        };
        reader.readAsArrayBuffer(oFile);
    }

    //按下讀取檔案的按鈕
    var getExcelContent = function(){
      var oFileIn = document.getElementById('file');
      if(oFileIn.addEventListener) {
        filePicked();
      }
    };



    //寫入員工資料
    function addEmpData(empNO, empName, index){
      //console.log("走新增: empNO: "+empNO + "   empName: "+empName );

      var DBtype = null;
      if(checkfileType()=="empListRadio"){
        DBtype = "users";
        var inputObj = {
          "姓名": empName,
          "員工編號": empNO,
          WON: false,
          PRICE: false,
          PID: false,
          SHOWUP: false
        };

      }
      else{
        DBtype = "priceList";
        var inputObj = {
          "獎項": empName,
          "編號": empNO,
          WINNERid: false,
          WINNERname: false
        };

      }
        //撈取user底下的最下面一筆資料
        firebase.database().ref(DBtype).orderByValue().limitToLast(1).on("value", function(snapshot) {
          snapshot.forEach(function(data) { index = data.key   });
        });
        index++; //index值++就是下一筆資料的位置

        firebase.database().ref(DBtype+"/"+index).set(inputObj,function(error){
          if(error){
            alert(empNO+"的資料寫入失敗!");
            console.log(empNO+"的資料寫入失敗! error: " + error);
          }
          else{
            alert(empName+" 資料寫入成功!");
          }
        });


    }

    //修改員工資料
    function editEmpData(empNO, empName, index){
      //console.log("走編輯: empNO: "+empNO + "   empName: "+empName + " index: "+index );

      var DBtype = "users";
      var updateParam = updateParam ={"姓名": empName};
      if(checkfileType()!="empListRadio"){
        DBtype = "priceList";
        updateParam ={"獎項": empName};
      }

      firebase.database().ref(DBtype+"/"+index).update(updateParam,function(error){
        if(error){
          alert(empNO+"的資料更新失敗!");
          console.log(empNO+"的資料更新失敗! error: " + error);
        }
        else{
          alert("邊號:"+empNO+" 已成功更改為:"+empName+"!");
        }
      });

    }

    //刪除員工資料
    function deleteEmpData(empNO, empName, index){
      //console.log("走刪除: empNO: "+empNO + "   empName: "+empName + " index: "+index);

      var DBtype = "users";
      if(checkfileType()!="empListRadio"){
        DBtype = "priceList";
      }

      firebase.database().ref(DBtype+"/"+index).remove(
        function(error){
        if(error){
          alert(empNO+"的資料移除失敗!");
          console.log(empNO+"的資料移除失敗! error: " + error);
        }
        else{
          alert("編號:"+empNO+"的資料，移除成功!");
          //清空輸入欄位
          document.getElementById("empNO").value = "";
          document.getElementById("empName").value = "";
        }
      });

    }

    //根據執行種類(新、刪、修)工號、工單是否存在，來分配執行位置。
    function executeAction(type, empNO, empName, dataExits, index){
      //console.log("在executeAction裡面的接收結果，工號:"+empNO+" 是否已存在:"+dataExits);

      switch (type) {
        case "add":
          if(dataExits){ alert("編號已存在，不可在新增!"); return; }
          addEmpData(empNO, empName, index);
          break;

        case "edit":
          if(!dataExits){alert("編號不存在，無法做修改!"); return; }
          editEmpData(empNO, empName, index);
          break;

        default:
          if(!dataExits){alert("編號不存在，無法做刪除!"); return; }
          deleteEmpData(empNO, empName, index);
      }
    }

    //進資料庫驗證工號是否存在
    function checkIDexits(type, empNO, empName, dataExits, index, callback){

      var DBtype = "users";
      var parameter = "員工編號";

      if(checkfileType()!="empListRadio"){
        DBtype = "priceList";
        parameter = "編號";
      }

        //去資料庫中比對要輸入的名子是否已存在
        firebase.database().ref(DBtype).on('value', snap => {

         snap.forEach(function(data) {
               //console.log("標題: " + data.key + "     內容:"+data.val()["員工編號"]);
               if(data.val()[parameter] == empNO){
                 dataExits = true;
                 index = data.key; //位置記錄進去index
               }
         });

     });
     //console.log("在callback方法checkIDexits裡面的驗證結果，"+empNO+" 是否已存在:"+dataExits);
     callback(type, empNO, empName, dataExits, index); //判斷完後，將判斷完的結果callback接續執行...

    }

    //三個按鈕共用的參數驗證區塊
    function sendInput(type){

      var text1 = "員工編號", text2 = "員工姓名";
      if(checkfileType()!="empListRadio"){
        text1 = "編號", text2 = "獎項名稱";
      }


      var empNO = document.getElementById("empNO").value.trim();
      var empName = document.getElementById("empName").value.trim();

      if(empNO == null || empNO == ""){ alert("未填寫"+text1+"~"); return; }

      switch (type) {
        case "add":
          if(empName == null || empName == ""){ alert("未填寫要新增的"+text2+"~"); return; }
          break;

        case "edit":
          if(empName == null || empName == ""){ alert("未填寫要修改的"+text2+"~"); return; }
          break;

        default:
      }

      var dataExits = false; //比對用的flag
      var index = 0;  //用來標記資料位置的值(新刪修都用的到)

      //執行callback
      checkIDexits(type, empNO, empName, dataExits, index, executeAction);
    }


    //讓出-讓抽中的結果回復!
    function rollbackResult(btn){

      var winnerName = btn.parentElement.parentElement.firstChild.innerHTML;
      var winnerPrice = btn.parentElement.parentElement.firstChild.nextSibling.nextSibling.innerHTML;

      if (!confirm("是否確定要讓出 "+winnerName+" 所獲得的 "+winnerPrice+"? ")){return;}

      //先抓到中獎人工號
      var userID = btn.id.substring(4); //把id中前4個win_的字元移除

      //透過中獎人工號找到它們在資料庫中的位置
      var indexInUser = null, indexInPriceList = null;

      //找到users位置，並更新資料
      firebase.database().ref("users").orderByChild("員工編號").equalTo(userID).on("value", function(snapshot) {
        snapshot.forEach(function(data) {
              indexInUser = data.key;
        });
      });
      firebase.database().ref("users/"+indexInUser).update(
        updateParam ={
          "PID": false,
          "PRICE": false,
          "WON": false
        },function(error){
        if(error){
          alert("員工資料更新失敗!");
          console.log("員工資料更新失敗!" + error);
        }
      });

      //找到priceList位置，並更新資料
      firebase.database().ref("priceList").orderByChild("WINNERid").equalTo(userID).on("value", function(snapshot) {
        snapshot.forEach(function(data) {
              indexInPriceList = data.key;
        });
      });
      firebase.database().ref("priceList/"+indexInPriceList).update(
        updateParam ={
          "WINNERid": false,
          "WINNERname": false
        },function(error){
        if(error){
          alert("中獎資料更新失敗!");
          console.log("中獎資料更新失敗!" + error);
        }
      });
    }

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

      //所有showup為true的人員清單
      //var query = firebase.database().ref("users").orderByChild("SHOWUP").equalTo(true);

      //所有人員清單
      var query = firebase.database().ref("users");
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

      var path = window.location.pathname;
      var page = path.split("/").pop();
      //console.log( page );

      //如果是FortuneSlot.html(開獎頁面)，才要走進doAnimation。
      if(page == "FortuneSlot.html"){
        //輪盤動畫要用到的3行。
        var textobj = [];
        textobj.push(winnerID); //必須要要傳一個陣列進去。
        doAnimation(textobj, possibleWinnerIDList);
      }



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
        alert("所有獎項皆已抽完!");
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
        //var query = workSheet.orderByChild("SHOWUP").equalTo(true); //where SHOWUP = true的寫法
        var query = workSheet.orderByValue(); //全部query的寫法
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
          autoSelectLastItem(); //自動勾選最下方的可選獎項
        });

      }
      catch(err) {
          alert("發生錯誤: "+err.message);
      }

    }

    //讀取資料庫中的清單
    var getListFromDB = function(){

      var database = firebase.database();
      if(database != null){
        document.getElementById("connection-status").innerHTML = "已連線";
        drawNameTable(database);
      }
      else{
        alert("沒有連線到firebase...");
        document.getElementById("connection-status").innerHTML = "連線失敗";
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

    //驗證現在選取的是哪個
    function checkfileType(){
      var result = document.querySelector('input[name="fileType"]:checked').value;
      if(result == "priceListRadio"){
        document.getElementById("empNO").placeholder = "獎項編號";
        document.getElementById("empName").placeholder = "獎項名稱";
        document.getElementById("updateNote").innerHTML  = "匯入的excel檔，獎項清單活頁簿名稱必須要叫做:獎項";
      }
      else{
        document.getElementById("empNO").placeholder = "員工編號";
        document.getElementById("empName").placeholder = "員工姓名";
        document.getElementById("updateNote").innerHTML  = "匯入的excel檔，人員清單活頁簿名稱必須要叫做:工作表";
      }
      return result;
    }



/*
  //取得table中的全部資料(寫法B)
  userList.orderByValue().on("value", function(snap){

    console.log(snap.val());
    console.log("長度為: "+Object.size(snap.val())  );

    // snap.forEach(function(data){
    //     console.log("標題: " + data.key + "     內容:"+data.val());
    // });

  });

  //取的table中的第一組數據
  var ul1 = userList.child('1');
  //類比where條件來查物件
  var q1 = userList.orderByChild("email").equalTo("vivien@gmail.com");

  //針對單一key
  // ul1.on('value', function(snapshot) {
  //     console.log(snapshot.val().name);
  // });

  //撈取特定物件底下的key跟value
  ul1.orderByValue().on("value", function(snapshot) {
      snapshot.forEach(function(data) {
            console.log("標題: " + data.key + "     內容:"+data.val());

            //再往下撈...
            // for(var i in parsedData){
            //   console.log(i + ":" + parsedData[i]); //alerts key's value
            // }

      });
    });


  console.log("q1.getQueryParams: "+ q1.getQueryParams());

  var resObj =  q1.getQueryParams();

  for(var i in resObj){
        //console.log(i + ":" + scoresRef[i]); //alerts key's value
        console.log(i);
  }

  console.log(scoresRef.getQueryParams());
  console.log(scoresRef.getKey());
  console.log(scoresRef.orderByValue());

  var query = scoresRef.orderByValue();
  query.on('value', snap => {
    console.log(snap);
  });


  //console.log("scoresRef: "+result);

  //在這裡撈取工作表的清單...
 */


 //繪製角子老虎機動畫效果的方法
 function doAnimation(text, chars){

    //console.log(text);
    //console.log(chars);

    //text = '021573';  // The message displayed
    //chars = '0123456789';  // All possible Charactrers
    scale = 50;  // Font size and overall scale
    breaks = 0.001;  // Speed loss per frame
    endSpeed = 0.005;  // Speed at which the letter stops
    firstLetter = 240;  // Number of frames untill the first letter stopps (60 frames per second)
    delay = 200;  // Number of frames between letters stopping

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
        }
        offset[i] += offsetV[i];
        offsetV[i] -= breaks;
        if(offsetV[i]<endSpeed){
          offset[i] = 0;
          offsetV[i] = 0;

          //滾動完畢的標記點
          if(!innerLoopDone){
            console.log("~~~~執行完doAnimation");
            innerLoopDone = true;
            innerLoopDoneRun();
          }
        }
      }

      requestAnimationFrame(loop);
    });

    function innerLoopDoneRun(){
      console.log("~~~~執行完doAnimation!!!!!!!!");
    }




 }
