class Node{
    constructor(name, description){
        name == undefined ? this.name = "" : this.name = name;
        description == undefined ? this.description = "" : this.description = description;
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
    
    // nodeArea内末尾にクラスがnodeのdivを追加する
    addTag(){
        var newElement = document.createElement("div");
        newElement.classList.add("node");
  //      newElement.addEventListener("mousedown", handleMousedown, false);
        
        var parent = document.getElementById("nodeArea");
        // null指定で末尾になる
        parent.insertBefore(newElement, null);
        
        newElement.innerHTML += this.name;
    }
    
}

function addNewNode() {
    var form = document.forms.nodeGenerator;
    var name, description;
    var node;
    
    name = form.name.value;
    description = form.description.value;
    
    node = new Node(name, description);

    node.addTag();
}

var element;

var handleMouseover;
var handleMouseout;
var handleClick; 

function setString(element, str) {
    element.innerHTML = "<p>" + str + "</p>";
}

function onLoad() {
    element = document.getElementById("testNode");
    handleMouseover = function(){
        setString(element, "mouse over.");
    }
    handleMouseout = function(){
        setString(element, "mouse out.");
    }
    handleClick = function(event){
        setString(element, "clicked.");
        element.removeEventListener("mouseover", handleMouseover, false);
        element.removeEventListener("mouseout", handleMouseout, false);
    }

    
    console.log("element:" + element);
    
    element.addEventListener("mouseover", handleMouseover, false);
    element.addEventListener("mouseout", handleMouseout, false);
    element.addEventListener("click", handleClick, false);

}