// todo: 要素のdivをドラッグして動かせるようにする クリックとドラッグのどちらかを判定する
// グラフ要素のクラス
class Node{
    constructor(name, description){
        name == undefined ? this.name = "" : this.name = name;
        description == undefined ? this.description = "" : this.description = description;
        this.element = null;
        this.connection = null;
        
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
    addTag(count){
        var self = this;
        this.element = document.createElement("div");
        this.element.classList.add("node");
        // divにNodeのリストに対応するidを付けて、divから辿れるようにする
        this.element.id = "node" + count;
        
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
var count = 0;

// クラスを生成し、divを追加する
function addNewNode() {
    var form = document.forms.nodeGenerator;
    var name, description;
    var node;
    
    name = form.name.value;
    description = form.description.value;
    
    node = new Node(name, description);
    
    nodeList.push(node);

    node.addTag(count);
    count++;
    
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
function myParseIntEnd(id){
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
    var selectedNode = nodeList[myParseIntEnd(selectedElement.id)];
    
    console.log("index:" + selectedElement.id);
    console.log(selectedNode);
    
    selectedNode.name = form.name.value;
    selectedNode.description = form.description.value;
    
    form.delete.disabled = false;
    connectButton.disabled = false;
    
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
    
    // 編集中・結合中の状態をリセットする
    infoForm.edit.value = "edit";
    infoForm.edit.removeEventListener("click", applyNodeInformation, false);
    infoForm.edit.addEventListener("click", editNodeInformation, false);
    connectorForm.connect.value = "connect";
    connectorForm.connect.removeEventListener("click", connectNode, false);
    connectorForm.connect.addEventListener("click", prepareConnectNode, false);
    
}

// 選択状態をクリアするハンドラ。 nodeAreaのonmousedownに設定してある。
// selectedクラスを消去し、ボタンを無効化してテキストボックスを-にする。
// ボタンの有効化はノード上でクリックを終えた瞬間に行われ、こちらが先行するので問題ない。
function selectClear(event){
    console.log("clearing");
    var selectedElement = document.getElementsByClassName("selected")[0];
    var editButton = document.forms.nodeInformation.edit;
    var deleteButton = document.forms.nodeInformation.delete;
    if(selectedElement != undefined){
        selectedElement.classList.remove("selected");
        if(selectedElement.classList.contains("connecting")){
            selectedElement.classList.remove("connecting");
        }
    }
    disableButtons();
    updateInformation("-", "-");

}

function deleteNode(event){
    var selectedElement = document.getElementsByClassName("selected")[0];
    var selectedIndex = myParseIntEnd(selectedElement.id);
    var parentElement = selectedElement.parentElement;
    var editButton = document.forms.nodeInformation.edit;
    var deleteButton = document.forms.nodeInformation.delete;
    
    parentElement.removeChild(selectedElement);
    nodeList.splice(selectedIndex, 1);
    count -= 1;
    
    for(var i = selectedIndex; i < count; i += 1){
        nodeList[i].element.id = "node" + i;
    }
    
    disableButtons();
    updateInformation("-", "-");
}

function prepareConnectNode(event){
    var infoForm = document.forms.nodeInformation;
    var connectorForm = document.forms.nodeConnector;
    var selectedElement = document.getElementsByClassName("selected")[0];
    
    // selectedクラスを持つdivがある場合に処理をする。
    if(selectedElement != undefined){
        infoForm.name.disabled = true;
        infoForm.description.disabled = true;
        infoForm.edit.disabled = true;
        infoForm.delete.disabled = true;
        connectorForm.connect.value = "apply";
        selectedElement.classList.add("connecting");
        selectedElement.classList.remove("selected");
        infoForm.edit.removeEventListener("click", prepareConnectNode, false);
        infoForm.edit.addEventListener("click", connectNode, false);
        console.log("start connect");
    }
}

function connectNode(event){
    var selectedElement = document.getElementsByClassName("selected")[0];
    
    // 自分自身でない要素がselectedクラスを持っていた場合に処理をする
    if(selectedElement != undefined && !(selectedElement.classList.contains("connecting"))){
        infoForm.name.disabled = 
    }
}
