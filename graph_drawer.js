var element;

var handleMouseover;
var handleMouseout;
var handleClick; 

function setString(element, str) {
    element.innerHTML = str;
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