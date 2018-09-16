// todo: ドラッグ時にノードの位置を固定しない
// グラフ要素のクラス
class Node{
    constructor(name, description){
        name == undefined ? this.name = "" : this.name = name;
        description == undefined ? this.description = "" : this.description = description;
        this.element = null;
        this.connectionToList = []; //Node List
        this.arrowElemList = []; // Element List
        
        const self = this;
        this.handleMouseupWrapper = function(event) {
            self.handleMouseup(event);
        };
        this.handleMousemoveWrapper = function(event) {
            self.handleMousemove(event);
        };
    }
    
    // マウスが離された(ドラッグ終了)ときのハンドラ
    handleMouseup(event){
        var nodeAreaElem = document.getElementById("nodeArea");
        var editButton = document.forms.nodeInformation.edit;
        var deleteButton = document.forms.nodeInformation.delete;
        var connectButton = document.forms.nodeConnector.connect;
        
        if(this.element.classList.contains("clicking")){
            this.element.classList.add("selected");
            editButton.disabled = false;
            deleteButton.disabled = false;
            connectButton.disabled = false;
            
            console.log("detect mouseup");
            updateInformation(this.name, this.description);
        }
        // 制御用のクラスを外してイベントリスナーを解除する
        this.element.classList.remove("dragging");
        this.element.classList.remove("clicking");
        
        nodeAreaElem.removeEventListener("mousemove", this.handleMousemoveWrapper, false);
        this.element.removeEventListener("mouseup", this.handleMouseupWrapper, false);
    }
    
    
    // マウスがドラッグ中(押されていて動く)のときのハンドラ
    handleMousemove(event){
        var nodeAreaElem = document.getElementById("nodeArea");
        var targetRect = event.target.getBoundingClientRect();
        var draggingElem;
        
        console.log("detect dragging");
        if(this.element.classList.contains("clicking")){
            this.element.classList.remove("clicking");
            this.element.classList.add("dragging");
        }
        
        event.preventDefault();
        // event.page*はマウスの座標なのでドラッグ中はこれに更新する
        // どうもposition:absoluteに設定しないとスクロールをガン無視で座標を取ってくるようだ
        // ~~~としていたが、スクロールに上手く対応できず、色々試すとoffset*が使えるとわかった~~~
        // ~~~offset*はlayer*のようにマウスのある要素の中での座標を出すので、~~~
        // ~~~nodeの持つevent.target.offset*を足すことによって座標を正しく計算する。~~~
        // ~~~なぜかわからないが、offsetは子要素の中でしかスクロールをちゃんと取ってくれない。~~~
        // ~~~offsetTopとかを使うと結局うまく行きはするので、そっちを使う。~~~
        // ~~~node以外のところまでドラッグするとtargetが吸われて座標がおかしくなるので限定する~~~
        // ~~~nodeだけに限定するとすぐマウスからすっぽ抜けるので無理矢理だがnodeAreaも含める~~~
        // ~~~そうするとすっぽ抜けたときのtargetがすり替わるせいでoffsetがおかしくなるので~~~
        // ~~~offsetは常にnodeから取ってくることにする~~~
        // ~~~ドラッグ中のクラスを取ってきてそれを常にいじることにする~~~
        
        this.element.style.top = (event.pageY - 30) + "px";
        this.element.style.left = (event.pageX - 30) + "px";
        
        scrollByNode(this.element);
        
        updateArrows(this);
    }
    
    // ここからのthisはNodeではなくイベント元のdiv
    // なのだが、addTag()内でNodeを指すように細工した
    // マウスが押されたときのハンドラ
    handleMousedown(event){
        var nodeAreaElem = document.getElementById("nodeArea");
        
        // ~~外部(body)でドラッグを検知する分、~~識別用の何かが必要でクラスだと拡張性が高い(多分)
        // スクロールの関係でbodyではなくnodeAreaでやることにする
        this.element.classList.add("clicking");
        console.log("detect clicking");
        
        // ここでも同様の細工をするのだが、即時関数だとremoveEventListenerができなくなるのでwrapperとして名前を付けて定義しておいたものを使う
        nodeAreaElem.addEventListener("mousemove", this.handleMousemoveWrapper, false);
        this.element.addEventListener("mouseup", this.handleMouseupWrapper, false);
    }

    // nodeArea内末尾にクラスがnodeのdivを追加する
    addTag(nodeCount){
        var self = this;
        this.element = document.createElement("div");
        this.element.classList.add("node");
        // divにNodeのリストに対応するidを付けて、divから辿れるようにする
        this.element.id = "node" + nodeCount;
        this.element.style.top = (window.scrollY + 50)  + "px";
        this.element.style.left = (window.scrollX + 50) + "px";
        this.element.innerHTML = this.name;
        
        // 即時関数にthisがdivになるのを吸収させて、内部でself(=Node)からhandleMousedownを呼び出すことでhandleMousedown内でのカレントオブジェクトをNodeにする
        this.element.addEventListener("mousedown", function(event){
            return self.handleMousedown(event);
        }, false);
        
        var parent = document.getElementById("nodeArea");
        // 第二引数null指定で追加の位置が末尾になる
        parent.insertBefore(this.element, null);
    }

}

function onLoad(){
    var infoForm = document.forms.nodeInformation;
    var connectorForm = document.forms.nodeConnector;
    
    infoForm.edit.addEventListener("click", editNodeInformation, false);
    infoForm.delete.addEventListener("click", deleteNode, false);
    connectorForm.connect.addEventListener("click", prepareConnectNode, false);
    connectorForm.cancel.addEventListener("click", clearConnecting, false);
    document.body.addEventListener("mousemove", function(event){
//        var nodeRect = event.target.getBoundingClientRect();
//        console.log("event.pageY:" + event.pageY);
//        console.log("event.pageX:" + event.pageX);
        /*
        console.log("event.target.offsetTop:" + event.target.offsetTop);
        console.log("event.target.offsetLeft:" + event.target.offsetLeft);
        console.log("event.target.id:" + event.target.id);
        */
    }, false); 
}

// Nodeのドラッグによるスクロールが長くなったのでまとめた
function scrollByNode(nodeElem){
    var nodeAreaElem = document.getElementById("nodeArea");
    var nodeRect = nodeElem.getBoundingClientRect();
    
    // nodeが下端に当たっていれば下にスクロールさせていく
    // console.log("nodeArea.bottom: " + nodeAreaElem.clientHeight);
    // console.log("targetRect.bottom:" + targetRect.bottom);
    // なぜ166なのかよくわからない
    // 拡大寸前のところで勝手にスクロールバーを出さないギリギリの位置
    // ~~~境界のところだとnodeが若干画面外にはみ出し気味になる現象の解決方法がわからない~~~
    // もうはみ出してるので仕様でいいんじゃないかな
    if(nodeRect.top + 166 >= window.innerHeight){
       //  console.log("bottom range of nodeArea");
        // なぜ30なのかよくわかっていない
        window.scrollBy(0, 30);
        // ここで戻してやらないと過剰にスクロールする
        nodeElem.style.top = (parseInt(nodeElem.style.top) + 30) + "px";
        // 多分168は拡大寸前のところで下にスクロールすると白い線が出てこないギリギリの位置で下回るとまずい
        // これを増やすとスクロールさせるときの増分が増える
        nodeAreaElem.style.height = (parseInt(nodeElem.style.top) + 178) + "px";
        // console.log(nodeAreaElem.style.height);
    }
    
    // 上へのスクロール
    //console.log("nodeRect.top:" + nodeRect.top);
    if(nodeRect.top <= 20){
        // console.log("top range of nodeArea");
        // nodeElem.style.top = (nodeAreaElem.clientHeight - 166) + "px";
        window.scrollBy(0, -30);
        // nodeAreaのheightをいじるべきか悩む
        if(parseInt(nodeElem.style.top) > 30){
            nodeElem.style.top = (parseInt(nodeElem.style.top) - 30) + "px";
        }else{
            nodeElem.style.top = "0px";
        }
        
    }
    
    // 右へのスクロール
    if(nodeRect.left + 166 >= window.innerWidth){
        window.scrollBy(30, 0);
        nodeElem.style.left = (parseInt(nodeElem.style.left) + 30) + "px";
        nodeAreaElem.style.width = (parseInt(nodeElem.style.left) + 178) + "px";
    }
    
    // 左へのスクロール
    if(nodeRect.left <= 20){
        window.scrollBy(-30, 0);
        if(parseInt(nodeElem.style.left) > 30){
            nodeElem.style.left = (parseInt(nodeElem.style.left) - 30) + "px";
        }else{
            nodeElem.style.left = "0px";
        }
    }
    
}

// 複数ボタンを無効化する場面が多いのでまとめた
function disableButtons(){
    var infoForm = document.forms.nodeInformation;
    var connectorForm = document.forms.nodeConnector;
    
    infoForm.edit.disabled = true;
    infoForm.delete.disabled = true;
    connectorForm.connect.disabled = true;
}

var nodeList = [];
var arrowList = [];
var nodeCount = 0;
var arrowCount = 0;

// クラスを生成し、divを追加する
function addNewNode() {
    var form = document.forms.nodeGenerator;
    var name, description;
    var node;
    
    name = form.name.value;
    description = form.description.value;
    
    node = new Node(name, description);
    
    nodeList.push(node);

    node.addTag(nodeCount);
    nodeCount++;
    
    console.log(node.element);
    
    form.name.value = "";
    form.description.value = "";
}

// 編集ボタンのリスナ： 編集開始ハンドラ(こっち)⇔編集完了ハンドラ
// 押すとボタンやテキストボックスを編集状態にする。
// その一環として、このハンドラを一旦解除し、完了ハンドラに切り替える。
function editNodeInformation(event) {
    var infoForm = document.forms.nodeInformation;
    var connectorForm = document.forms.nodeConnector;
    var selectedElement = document.getElementsByClassName("selected")[0];
    
    // selectedクラスを持つdivがある場合に処理をする。
    if(selectedElement != undefined){
        infoForm.name.disabled = false;
        infoForm.description.disabled = false;
        infoForm.edit.value = "apply";
        infoForm.delete.disabled = true;
        connectorForm.connect.disabled = true;
        infoForm.edit.removeEventListener("click", editNodeInformation, false);
        infoForm.edit.addEventListener("click", applyNodeInformation, false);
        console.log("start edit");
    }
}

// 文字列内で最初に見つかった数値を返す
// ここでは配列の添え字がIDの最後に仕込んであるのでそれを取得するために使う
function parseNum(id){
    return parseInt((/\d+/.exec(id))[0], 10);
}


// 編集ボタンのリスナ： 編集開始ハンドラ⇔編集完了ハンドラ(こっち)
// 押すとノードリストからdivに対応するノードにアクセスし、情報を書き換える。
// 編集状態の解除はupdateInformation()がやってくれる。
function applyNodeInformation(event){
    console.log("applying");
    var form = document.forms.nodeInformation;
    var connectButton = document.forms.nodeConnector.connect;
    var selectedElement = document.getElementsByClassName("selected")[0];
    var selectedNode = nodeList[parseNum(selectedElement.id)];
    
    console.log("index:" + selectedElement.id);
    console.log(selectedNode);
    
    selectedNode.name = form.name.value;
    selectedNode.description = form.description.value;
    
    selectedNode.element.innerHTML = form.name.value;
    
    form.delete.disabled = false;
    connectButton.disabled = true;
    
    updateInformation(selectedNode.name, selectedNode.description);
}

// nodeInformationを更新する。 更新後に表示される文字列は呼び出し側が指定する。
// 編集状態を解除しながら表示を更新する。
function updateInformation(name, description){
    console.log("updating information");
    var infoForm = document.forms.nodeInformation;
    var connectorForm = document.forms.nodeConnector;
    
    infoForm.name.value = name;
    infoForm.description.value = description;
    
    // 編集中の状態をリセットする
    infoForm.edit.value = "edit";
    infoForm.edit.removeEventListener("click", applyNodeInformation, false);
    infoForm.edit.addEventListener("click", editNodeInformation, false);
}

// 選択状態をクリアするハンドラ。 nodeAreaのonmousedownに設定してある。
// selectedクラスを消去し、ボタンを無効化してテキストボックスを-にする。
// ボタンの有効化はノード上でクリックを終えた瞬間に行われ、こちらが先行するので問題ない。
function selectClear(event){
    console.log("clearing");
    var selectedElement = document.getElementsByClassName("selected")[0];
    var connectingToElement = document.getElementsByClassName("connectingTo")[0];
    var connectButton = document.forms.nodeConnector.connect;
    if(selectedElement != undefined){
        selectedElement.classList.remove("selected");
    }
    if(connectingToElement != undefined){
        connectingToElement.classList.remove("connectingTo");
        connectButton.disabled = true;
    }
    disableButtons();
    updateInformation("-", "-");

}

// ノードを削除する関数
function deleteNode(event){
    var selectedElement = document.getElementsByClassName("selected")[0];
    var selectedIndex = parseNum(selectedElement.id);
    var parentElement = selectedElement.parentElement;
    var editButton = document.forms.nodeInformation.edit;
    var deleteButton = document.forms.nodeInformation.delete;
    
    // 自分のコネクションも削除する
    // connectionToListに関してはHTMLに影響を及ぼさないので放置
    nodeList[selectedIndex].arrowElemList.forEach(function(arrow){
        var arrowId = parseNum(arrow.id);
        
        arrow.parentElement.removeChild(arrow);
        arrowList.splice(arrowId, 1);
        arrowCount -= 1;
        
        for(var i = arrowId; i < arrowCount; i += 1){
            arrowList[i].id = "arrow" + i;
        }
    });
    
    // さらに他のノードがこれを宛先にしていればそのコネクションを削除する
    nodeList.forEach(function(node){
        var arrowId;
        var index = node.connectionToList.indexOf(nodeList[selectedIndex]);
        if(index >= 0){
            node.connectionToList.splice(index, 1);
            
            arrowId = parseNum(node.arrowElemList[index].id);
            node.arrowElemList[index].parentElement.removeChild(node.arrowElemList[index]);
            node.arrowElemList.splice(index, 1);
            arrowList.splice(arrowId, 1);
            arrowCount -= 1;
            
            for(var i = arrowId; i < arrowCount; i += 1){
                arrowList[i].id = "arrow" + i;
            }
        }
    });
    
    parentElement.removeChild(selectedElement);
    nodeList.splice(selectedIndex, 1);
    nodeCount -= 1;
    
    // idが消えたノードの分落ちてくる
    for(var i = selectedIndex; i < nodeCount; i += 1){
        nodeList[i].element.id = "node" + i;
    }
    
    
    disableButtons();
    updateInformation("-", "-");
}

// クソみたいな関数名やめてください！
// 接続用のイベントリスナを追加するハンドラ。
function prepareConnectNode(event){
    var infoForm = document.forms.nodeInformation;
    var connectorForm = document.forms.nodeConnector;
    var selectedElement = document.getElementsByClassName("selected")[0];
    var nodeAreaElement = document.getElementById("nodeArea");
    
    // selectedクラスを持つdivがある場合に処理をする。
    if(selectedElement != undefined){
        infoForm.name.disabled = true;
        infoForm.description.disabled = true;
        infoForm.edit.disabled = true;
        infoForm.delete.disabled = true;
        connectorForm.connect.value = "apply";
        connectorForm.connect.disabled = true;
        connectorForm.cancel.disabled = false;
        selectedElement.classList.add("connecting");
        selectedElement.classList.remove("selected");
        connectorForm.connect.removeEventListener("click", prepareConnectNode, false);
        connectorForm.connect.addEventListener("click", connectNode, false);
        nodeAreaElement.addEventListener("click", selectConnectNode, false);
        console.log("start connect");
    }
}

// nodeにかかわる矢印のスタイルを再設定する。(nodeはドラッグしているノード)
function updateArrows(node){
    var i;
    var targetNode;
    var arrow;

    // 自分の接続先の矢印をすべて更新する
    node.connectionToList.forEach(function(connectTo, index){
        // 矢尻をarrowの子にしているのでこれで取得できる
        setArrow(node.element, connectTo.element, node.arrowElemList[index], node.arrowElemList[index].children[0]);
    });
    
    // 自分を宛先にしている矢印も更新しないといけない
    // nodeListを全探索して自分を宛先にしているやつを探す
    nodeList.forEach(function(listNode){
        // nodeが含まれているとindexOfは添え字を返す、なければ-1
        var index = listNode.connectionToList.indexOf(node);
        if(index >= 0){
            setArrow(listNode.element, node.element, listNode.arrowElemList[index], listNode.arrowElemList[index].children[0]);
        }
    });
}

// エレメントから位置情報などを取得し、矢印のスタイルを設定する
function setArrow(connect, connectTo, arrow, arrowTip){
    var distance;
    var angle;
    const halfNodeSize = 75;
    const arrowSize = 20;
    
    if(connect == null){
        return;
    }
    
    distance = Math.sqrt(Math.pow(parseInt(connectTo.style.left) - parseInt(connect.style.left), 2) +  Math.pow(parseInt(connectTo.style.top) - parseInt(connect.style.top), 2));
    
    // topは下が正なので引き算が逆になる
    angle = Math.atan2(parseInt(connect.style.top) - parseInt(connectTo.style.top), parseInt(connectTo.style.left) - parseInt(connect.style.left));
    
    // 使うべき三角関数がsinの場合とcosの場合で場合分け
    if(Math.abs(angle) >= Math.PI/4　&& Math.abs(angle) <= Math.PI*3/4){
        // どの向きだろうと符号の概念は出てきてほしくないのでabsを取る
        arrow.style.width = (distance - Math.abs(halfNodeSize/Math.sin(angle)) - arrowSize) + "px";
    }else{
        arrow.style.width = (distance - Math.abs(halfNodeSize/Math.cos(angle)) - arrowSize) + "px";
    }
    
    arrow.style.top = (parseInt(connect.style.top) + halfNodeSize) + "px";
    arrow.style.left = (parseInt(connect.style.left) + halfNodeSize) + "px";
    arrowTip.style.left = arrow.style.width;
    
    /* 右が0で時計回りに 0<=θ<2π で増えるように変換する */
    angle *= -1;
    if(angle < 0){
        angle += 2*Math.PI;
    }
    arrow.style.transform = "rotateZ(" + angle*180/Math.PI + "deg)";
    
}

// 矢印生成
function putArrow(connect, connectTo){
    var newArrowElem = document.createElement("div");
    var newArrowTipElem = document.createElement("div");
    var parent = document.getElementById("nodeArea");
    var connectNode = nodeList[parseNum(connect.id)];
    
    setArrow(connect, connectTo, newArrowElem, newArrowTipElem);
    
    newArrowElem.classList.add("connectArrow");
    newArrowTipElem.classList.add("connectArrowTip");
    newArrowElem.id = "arrow" + arrowCount;
    
    parent.insertBefore(newArrowElem, connect.nextElementSibling);
    newArrowElem.insertBefore(newArrowTipElem, null);
    
    connectNode.arrowElemList.push(newArrowElem);
    
    arrowList.push(newArrowElem);
    arrowCount += 1;
}

// 接続を確定したときに呼ばれるハンドラ
function connectNode(event){
    var connectingElement = document.getElementsByClassName("connecting")[0];
    var connectingToElement = document.getElementsByClassName("connectingTo")[0];
    var connectingNode = nodeList[parseNum(connectingElement.id)];

    connectingNode.connectionToList.push(nodeList[parseNum(connectingToElement.id)]);
    putArrow(connectingElement, connectingToElement);

    clearConnecting(event);
}

// 接続先を探すときのハンドラ
function selectConnectNode(event){
    console.log("selecting connectNode");
    var infoForm = document.forms.nodeInformation;
    var selectedElement = document.getElementsByClassName("selected")[0];
    var connectButton = document.forms.nodeConnector.connect;
    
    // 自分自身でない要素がselectedクラスを持っていた場合にconnectingToを付加する
    if(selectedElement != undefined){
        if(!selectedElement.classList.contains("connecting")){
            selectedElement.classList.add("connectingTo");
            selectedElement.classList.remove("selected");
        }else{
            connectButton.disabled = true;
        }
    }

    infoForm.edit.disabled = true;
    infoForm.delete.disabled = true;
}

// 接続を探す状態をクリアする関数
// ハンドラから渡されることがあるので一応eventを引数に取る
function clearConnecting(event){
    var connectingToElement = document.getElementsByClassName("connectingTo")[0];
    var connectingElement = document.getElementsByClassName("connecting")[0];
    var connectorForm = document.forms.nodeConnector;
    var nodeAreaElement = document.getElementById("nodeArea");
    
    connectorForm.connect.addEventListener("click", prepareConnectNode, false);
    connectorForm.connect.removeEventListener("click", connectNode, false);
    connectorForm.connect.disabled = true;
    connectorForm.connect.value = "connect";
    connectorForm.cancel.disabled = true;
    nodeAreaElement.removeEventListener("click", selectConnectNode, false);
    if(connectingToElement != undefined){
        connectingToElement.classList.remove("connectingTo");
    }
    connectingElement.classList.remove("connecting");
}