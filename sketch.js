
var http_requests = {}; // <-- access all http requests here (from json file)
var ready = false; // <-- boolean value representing if file content is ready
//get the file from the file selector
const fileSelector = document.getElementById('file-selector');
fileSelector.addEventListener('change', (event) => {
    const file = event.target.files[0];
    readFile(file);
    //console.log(file);
    document.getElementById("file_stuff").style.visibility = "hidden";
    });

function readFile(file){
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");

    reader.onload = (event) => {
        //console.log(event.target.result)
        http_requests = JSON.parse(event.target.result);
        ready = true;

        
    }
}


// var routers = [];
// var hosts = [];

let routerImage;
let hostImage;

function preload() {
    routerImage = loadImage('./assets/router.png');
    hostImage = loadImage('./assets/host.png')
  }

var n;
function setup(){
    createCanvas(750, 750);

    n = new Network();

    //select number of routers and number of neighbors of each router
    let numRouters = 10;
    for(let i = 0; i < numRouters; i ++){
        n.routers.push(new Router());
    }

    n.generateConnections();

    button = createButton('Send Requests')
    button.mouseClicked(n.sendPackets)
}

function draw(){
    background(255,255,255);
    if(ready){
        //console.log(http_requests);

        for(let i = 0; i < n.routers.length; i++) {
            n.routers[i].display();
        }
    }
}

class Network{
    constructor(){
        this.routers = [];
        this.hosts = [];
        this.connectionsPerRouter = 3;
    }

    generateConnections(){
        //take each router and generate x connections (routing table)
            //if a routers has >= x connects in routing table, try again until all routers have at least 1 connection
        //could do this more randomly
        for(let i = 0; i < this.routers.length; i++){
            let cur = this.routers[i];
            for(let j = 0; j < this.routers.length; j++){
                let cur_con = this.routers[j];
                if(cur.routing_table.length < this.connectionsPerRouter){ // <-- if not the same router and router has less than this.connectionsPerRouter
                    cur.routing_table.push(cur_con);
                }
            }
        }
    }

    sendPackets(){
        
    }


}

class Router{
    constructor(){
        this.ip = '' // <-- in the form "kkk.xxx.yyy.zzz"
        this.routing_table = []; // <-- currently an array, can be any data structure we want
        this.x_pos = Math.floor(Math.random() * width);
        this.y_pos =  Math.floor(Math.random() * height);
        this.generateIP();
    }
    
    display(){
        fill(0,0,0);
        stroke(0,0,0);
        //image(routerImage, this.x_pos, this.y_pos, 10, 10);
        ellipse(this.x_pos, this.y_pos, 10, 10);
        noStroke();
        fill(0, 0, 0);
        textSize(10);
        text(`${this.ip}`, this.x_pos, this.y_pos);

        //line from source to each connection router
        for(let i = 0; i < this.routing_table.length; i ++){
            //console.log(this.routing_table[i].ip);
            fill(0,0,0);
            stroke(0,0,0);
            line(this.x_pos, this.y_pos, this.routing_table[i].x_pos, this.routing_table[i].y_pos); 
        }
    }

    generateIP(){
        var ipstr = '';
        for(let i = 0; i < 4; i ++){
            var num = Math.floor(Math.random() * 999 + 1)
            if(i < 3){
                ipstr = ipstr.concat(`${num.toString()}.`);
            }else{
                ipstr = ipstr.concat(`${num.toString()}`);
            }
        }
        this.ip = ipstr;
        //console.log(ipstr);
    }

    printRoutingTable(){
        for(let i = 0; i < this.routing_table.length; i++){
            console.log(this.routing_table[i].ip);
        }
        console.log();
    }
}

class Host{
    constructor(){

    }
}



