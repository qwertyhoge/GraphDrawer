// todo: 要素のdivをドラッグして動かせるようにする クリックとドラッグのどちらかを判定する
// グラフ要素のクラス
class Node{
    constructor(name, description){
        name == undefined ? this.name = "" : this.name = name;
        description == undefined ? this.description = "" : this.description = description;
        this.element = null;
        
        const self = this;
        this.handleMouseupWrapper = function(event) {
            self.handleMouseup(event);
        };
        this.handleMousemoveWrapper = function(event) {
            self.handleMousemove(event);
        };
    }
    
    getName(){
        return this.name;
    }
    getDescription(){
        return this.description;
    }
    setName(name){
        this.name = name;
    }
    setDescription(description){
        this.description = description;
    }
    
    // マウスが離された(ドラッグ終了)ときのハンドラ
    handleMouseup(event){
        // 制御用のクラスを外したりイベントリスナーを解除する
        this.element.classList.remove("dragging");
        document.body.removeEventListener("mousemove", this.handleMousemoveWrapper, false);
        this.element.removeEventListener("mouseup", this.handleMouseupWrapper, false);
    }
    
    
    // マウスがドラッグ中(押されていて動く)のときのハンドラ
    handleMousemove(event){
        // 元がbodyなのでthisでは取れない複数ドラッグしようとしたらどうなるんだろう
        var dragElement = document.getElementsByClassName("dragging")[0];
        
        console.log(dragElement.style.left);
        console.log(dragElement.style.top);
        
        // event.page*はマウスの座標なのでドラッグ中はこれに更新する
        dragElement.style.position = "absolute";
        dragElement.style.top = (event.pageY - 30) + "px";
        dragElement.style.left = (event.pageX - 30) + "px";
    }
    
    // ここからのthisはNodeではなくイベント元のdiv
    // なのだが、addTag()内でNodeを指すように細工した
    // マウスが押されたときのハンドラ
    handleMousedown(event){
        // bodyでドラッグを検知する分、識別用の何かが必要でクラスだと拡張性が高い(多分)
        this.element.classList.add("dragging");
        
        // ここでも同様の細工をするのだが、即時関数だとremoveEventListenerができなくなるのでここでwrapperとして名前を付けて定義しておく
        document.body.addEventListener("mousemove", this.handleMousemoveWrapper, false);
        this.element.addEventListener("mouseup", this.handleMouseupWrapper, false);
    }

    // nodeArea内末尾にクラスがnodeのdivを追加する
    addTag(){
        var self = this;
        this.element = document.createElement("div");
        this.element.classList.add("node");
        this.element.addEventListener("mousedown", function(event){
            // 即時関数にthisがdivになるのを吸収させて、内部でself(Node)からhandleMousedownを呼び出すことでhandleMousedown内でのカレントオブジェクトをNodeにする
            return self.handleMousedown(event);
        }, false);
        
        var parent = document.getElementById("nodeArea");
        // null指定で末尾になる
        parent.insertBefore(this.element, null);
        
        this.element.innerHTML += this.name;
        
    }
    
}

// todo: IDを同時に付けるなどし、削除できるようにする
// クラスを生成し、divを追加する
function addNewNode() {
    var form = document.forms.nodeGenerator;
    var name, description;
    var node;
    
    name = form.name.value;
    description = form.description.value;
    
    node = new Node(name, description);

    node.addTag();
}
