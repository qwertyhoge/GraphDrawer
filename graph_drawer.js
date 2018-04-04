// todo: 要素のdivをドラッグして動かせるようにする クリックとドラッグのどちらかを判定する
// グラフ要素のクラス
class Node{
    constructor(name, description){
        name == undefined ? this.name = "" : this.name = name;
        description == undefined ? this.description = "" : this.description = description;
        this.element = null;
        this.connectionToList = null;
        this.arrowElem = null;
        this.arrowNum = null;
        
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
        // 制御用のクラスを外したりイベントリスナーを解除する
        this.element.classList.remove("dragging");
        this.element.classList.remove("clicking");
        
        document.body.removeEventListener("mousemove", this.handleMousemoveWrapper, false);
        this.element.removeEventListener("mouseup", this.handleMouseupWrapper, false);
    }
    
    
    // マウスがドラッグ中(押されていて動く)のときのハンドラ
    handleMousemove(event){
        console.log("detect dragging");
        if(this.element.classList.contains("clicking")){
            this.element.classList.remove("clicking");
            this.element.classList.add("dragging");
        }
        
        event.preventDefault();
        // event.page*はマウスの座標なのでドラッグ中はこれに更新する
        this.element.style.top = (event.pageY - 30) + "px";
        this.element.style.left = (event.pageX - 30) + "px";
        
        updateArrows(this);
    }
    
    // ここからのthisはNodeではなくイベント元のdiv
    // なのだが、addTag()内でNodeを指すように細工した
    // マウスが押されたときのハンドラ
    handleMousedown(event){
        // bodyでドラッグを検知する分、識別用の何かが必要でクラスだと拡張性が高い(多分)
        this.element.classList.add("clicking");
        console.log("detect clicking");
        
        // ここでも同様の細工をするのだが、即時関数だとremoveEventListenerができなくなるのでwrapperとして名前を付けて定義しておいたものを使う
        document.body.addEventListener("mousemove", this.handleMousemoveWrapper, false);
        this.element.addEventListener("mouseup", this.handleMouseupWrapper, false);
    }

    // nodeArea内末尾にクラスがnodeのdivを追加する
    addTag(nodeCount){
        var self = this;
        this.element = document.createElement("div");
        this.element.classList.add("node");
        // divにNodeのリストに対応するidを付けて、divから辿れるようにする
        this.element.id = "node" + nodeCount;
        this.element.style.top = "50px";
        this.element.style.left = "50px";
        
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
    
    form.name.value = "";
    form.description.value = "";
}

// 編集ボタンのリスナ： 編集ハンドラ(こっち)⇔完了ハンドラ
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


// 編集ボタンのリスナ： 編集ハンドラ⇔完了ハンドラ(こっち)
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

function deleteNode(event){
    var selectedElement = document.getElementsByClassName("selected")[0];
    var selectedIndex = parseNum(selectedElement.id);
    var parentElement = selectedElement.parentElement;
    var editButton = document.forms.nodeInformation.edit;
    var deleteButton = document.forms.nodeInformation.delete;
    
    // コネクションを持ったノードがこれを宛先にしていれば削除する
    nodeList.forEach(function(node){
        if(node.connectionTo === node){
            for(var i = 0; i < arrowList.length; i += 1){
                if(node.connectionTo === arrowList[i]){
                    arrowList.splice(i, 1);
                }
                arrowList[i].id = "arrow" + i;
            }
            node.connectionTo = null;
            arrowCount -= 1;
        }
    });
    
    parentElement.removeChild(selectedElement);
    nodeList.splice(selectedIndex, 1);
    nodeCount -= 1;
    
    for(var i = selectedIndex; i < nodeCount; i += 1){
        nodeList[i].element.id = "node" + i;
    }
    
    disableButtons();
    updateInformation("-", "-");
}

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

// nodeを宛先にするノードがあればそこの矢印を更新する
function updateArrows(node){
    var i;
    var targetNode;
    var arrow;
    
    // 複数にはまだ対応していない
    // 矢尻をarrowの子にしているのでこれで取得できる
    if(node.connectionTo != null){
        setArrow(node.element, node.connectionTo, node.arrowElem, node.arrowElem.children[0]);
    }
    
    // 自分を宛先にしている矢印も更新しないといけない
    // nodeListを全探索して自分を宛先にしているやつを探す
    nodeList.forEach(function(listNode, index){
        if(listNode.connectionTo === node.element){
            setArrow(listNode.element, node.element, listNode.arrowElem, listNode.arrowElem.children[0]);
        }
    });
}

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
        console.log("calced by sin" + "sin(angle):" + Math.sin(angle));
    }else{
        arrow.style.width = (distance - Math.abs(halfNodeSize/Math.cos(angle)) - arrowSize) + "px";
        console.log("calced by cos" + "cos(angle):" + Math.cos(angle));
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
    
    connectNode.arrowElem = newArrowElem;
    connectNode.arrowNum = arrowCount;
    
    arrowList.push(newArrowElem);
    arrowCount += 1;
}

function connectNode(event){
    var connectingElement = document.getElementsByClassName("connecting")[0];
    var connectingToElement = document.getElementsByClassName("connectingTo")[0];
    var connectingNode = nodeList[parseNum(connectingElement.id)];

    connectingNode.connectionTo = connectingToElement;
    putArrow(connectingElement, connectingToElement);

    clearConnecting(event);
}

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