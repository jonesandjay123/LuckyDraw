
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
    var query = firebase.database().ref("priceList").orderByValue();

    var keepdoing = true;
    var data = []; //陣列物件

    query.on('value', snap => {

      if(Object.size(snap.val()) <= 0){
        alert("獎品清單是空的!");
        keepdoing = false;
        return;
      }

      snap.forEach(function(result) {

         var userID = (result.val()["WINNERid"] == false) ? "": result.val()["WINNERid"];
         var userName = (result.val()["WINNERname"] == false) ? "": result.val()["WINNERname"];
         var userDept = (result.val()["WINNERDept"] == false) ? "": result.val()["WINNERDept"];

          var obj = {
            "獎項": result.val()["獎項"],
            "工號": userID,
            "姓名": userName,
            "部門": userDept
          };
          data.push(obj);  //把obj塞入陣列
      });

      if(!keepdoing){ return;}

      // a this line is only needed if you are not adding a script tag reference
      if(typeof XLSX == 'undefined') XLSX = require('xlsx');

      // a make the worksheet
      var ws = XLSX.utils.json_to_sheet(data);

      // add to workbook
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "中獎名單");

      // agenerate an XLSX file
      XLSX.writeFile(wb, "中獎名單.xlsx");

      console.log("匯出成功~"+data);
    });


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
        if(typeof obj[i].isSpecial === "undefined"){
          obj[i].isSpecial = true;
        }
        else{
          obj[i].isSpecial = false;
        }
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
        obj[i].WINNERDept = false;
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
        isSpecial: false,
        WON: false,
        PRICE: false,
        PID: false,
        SHOWUP: true
      };

    }
    else{
      DBtype = "priceList";
      var inputObj = {
        "獎項": empName,
        "編號": empNO,
        WINNERid: false,
        WINNERname: false,
        WINNERDept: false
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

    localStorage.setItem("latestAction","rollbackResult"); //讓出的動作執行時，在localStorage中留下一個標記，讓系統知道不要重繪canvas

    var winnerName = btn.parentElement.parentElement.firstChild.innerHTML;
    var winnerPrice = btn.parentElement.parentElement.firstChild.nextSibling.nextSibling.innerHTML;

    if (!confirm("是否確定要讓出 "+winnerName+" 所獲得的 "+winnerPrice+"? ")){return;}

    //先抓到中獎人工號
    var userID = btn.id.substring(4); //把id中前4個win_的字元移除

    console.log("userID: "+userID);

    //透過中獎人工號找到它們在資料庫中的位置
    var indexInUser = null, indexInPriceList = null;

    //找到users位置，並更新資料
    //firebase.database().ref("users").orderByChild("員工編號").equalTo(userID).on("value", function(snapshot) {  //←這種寫法效能慢
    firebase.database().ref("users").on("value", function(snapshot) {

      snapshot.forEach(function(data) {
        if(data.val()["員工編號"]==userID){
          console.log(data.key);
          indexInUser = data.key;
        }
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
    });

    //找到priceList位置，並更新資料
    firebase.database().ref("priceList").orderByChild("WINNERid").equalTo(userID).on("value", function(snapshot) {
      snapshot.forEach(function(data) {
            indexInPriceList = data.key;
      });
      firebase.database().ref("priceList/"+indexInPriceList).update(
        updateParam ={
          "WINNERid": false,
          "WINNERname": false,
          "WINNERDept": false
        },function(error){
        if(error){
          alert("中獎資料更新失敗!");
          console.log("中獎資料更新失敗!" + error);
        }
      })
      //完成後，強制刷新頁面，避免下一次使用讓出時，出現失效的堆疊狀況。
      .then(function onSuccess(res) {
        location.reload();
      });
    });
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
