
var http_requests = {}; // <-- access all http requests here (from json file)
var ready = false; // <-- boolean value representing if file content is ready
var packet_button_pressed = false;
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


let routerImage;
let hostImage;

function preload() {
    routerImage = loadImage('./assets/router.png');
    hostImage = loadImage('./assets/host.png')
}

var n;
var source; // <-- source router/host
var dest; // <-- destination router/host

var start_time; // <-- start time of simulation
var end_time; // <-- end time of simulation

function setup(){
    createCanvas(750, 750);

    n = new Network();

    //select number of routers and number of neighbors of each router
    let numRouters = 100;
    n.routers.push(new Router("272.0.0.1")); // <-- currently acting as destination router
    for(let i = 0; i < numRouters; i ++){
        n.routers.push(new Router(""));
    }

    n.generateConnections();

    button = createButton('Send Packets')
    button.mouseClicked( ()=> {
        packet_button_pressed = true;
    })
}

function draw(){
    background(255,255,255);
    if(packet_button_pressed){

        n.sendPackets();
        packet_button_pressed = false;
        var d = new Date();
        start_time = d.getTime();
    }

    if(ready){
        //console.log(http_requests);
        for(let i = 0; i < n.routers.length; i++) {
            n.routers[i].display();
        }
    }
}



class Network{
    constructor(){
        this.routers = []; // <-- can be any data structure
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
                    cur.routing_table.push({
                        "router": cur_con,
                        "cost": Math.floor(dist(cur.x_pos, cur.y_pos, cur_con.x_pos, cur_con.y_pos)) // <-- cost is simply distance to router
                    });
                }
            }
        }
    }

    sendPackets(){
        /*
        take http requests from file, create n packets
        give packets to hosts/end routers  
        */
       console.log("sending packets...");
       
        for(let i = 0; i < http_requests.length; i++) {
            let packet_info = http_requests[i];
            let p = new Packet(packet_info);
            //console.log(p);
            console.log(this.routers);
            //this.routers[0].data.push(p); // <-- send to first router
            this.routers[Math.floor(Math.random() * this.routers.length)].data.push(p); // <-- sends packet to random router for now (beta testing), because have no algoritm for sending packets, so will always loop
        }

    }


}

class Router{
    constructor(ip){
        this.ip = ip; // <-- in the form "kkk.xxx.yyy.zzz"
        this.routing_table = [

        ]; // <-- currently an array, can be any data structure
        this.x_pos = Math.floor(Math.random() * width);
        this.y_pos =  Math.floor(Math.random() * height);
        this.data = []; //new CustomDataStructure(); // <-- packet objects stored here, can be any data structure
        if(this.ip === ""){
            this.generateIP();
        }
    }
    
    display(){
        if(this.data.length > 0){
            fill(0,255,0);
            stroke(0,255,0);
        }else{
            fill(0,0,0);
            stroke(0,0,0);
        }
        
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
            line(this.x_pos, this.y_pos, this.routing_table[i].router.x_pos, this.routing_table[i].router.y_pos); 
        }
        
        if(this.data.length > 0){
            this.sendPacket(this.data[0]);
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
            console.log(this.routing_table[i].router.ip);
        }
        console.log();
    }

    findNextHop(packet){ 
        /*
        currently just finds shortest path each time
        this is only for testing functionality
        causes loops
        !!!need algorithm (like diktra's algorithm here)
        */
        
        let min_cost = 100000;
        let next_hop;
        for(let i = 0; i < this.routing_table.length; i ++){
            if(this.routing_table[i].cost < min_cost && this.routing_table[i].cost > 0 && packet.prev_ip !== this.routing_table[i].router.ip){ // <-- does not send to self router, and doenst allow packet to be sent backwards
                min_cost = this.routing_table[i].cost;
                next_hop = this.routing_table[i].router;
            }
        }

        
        //console.log(next_hop);
        return next_hop;
    }


    sendPacket(packet){
        if(packet.lifespan === 0){ //check if packet is dead
            console.log('packet died!!!')
            this.data.splice(0,1);
        }else if(packet.header.dest_ip === this.ip){ // <-- if packet has reached destination!!!!
            var d = new Date();
            end_time = d.getTime();
            alert(`Message recieved: ${packet.body.content} ----- Time elapsed: ${end_time - start_time}ms`);
            this.data.splice(0,1);
        }

        if(this.data.length > 0){  // <-- check if router has data to send
            console.log('forwarding packet...')
            let dest = this.findNextHop(packet);
            dest.data.push(packet);
            this.data.splice(0,1);
            packet.prev_ip = this.ip;
            packet.lifespan = packet.lifespan - 1;
        }
       
       //once custom data structure is implemented, would need custom method to add to structure
    }


}

class Host{ // <-- origin and destination
    constructor(){

    }
}

class Packet{
    constructor(json){
        this.header = {}; // <-- contains destination, origin, etc.
        this.body = {}; // <-- contains packet content (what we want to be delivered)
        this.prev_ip;
        this.lifespan = 10; // <-- should be variable w/ amount of router
        //this.json = json; // <-- create packet from this data
        this.parsePacket(json); // <-- creates packet
    }

    parsePacket(json){
        this.header._id = json._id;
        this.header.source_ip = json.source_ip;
        this.header.dest_ip = json.dest_ip;
        
        this.body.content = json.content;
    }
}



