/*
CURRENT ISSUES:
- routes seem to be appearing on screen but not actually in routing table, causing dijkstras to fail for some reason
    - possible fix: change how routing tables are created
    - ensure dijkstra is only checking nodes in routing tables
*/



var http_requests = {}; // <-- access all http requests here (from json file)
var ready = false; // <-- boolean value representing if file content is ready
var packet_button_pressed = false;
var demo_selected = false;

const selector_text = document.getElementById("node_selection_text");

//get the file from the file selector
const fileSelector = document.getElementById('file-selector');
fileSelector.addEventListener('change', (event) => {
    const file = event.target.files[0];
    readFile(file);
    //console.log(file);
    document.getElementById("file_selection_area").style.display = "none";
    selector_text.style.visibility = "visible";

});

const demo_file = `
[
    {
        "_id": 1,
        "source_ip": "",
        "dest_ip": "",
        "content": "H"
    },
    {
        "_id": 2,
        "source_ip": "",
        "dest_ip": "",
        "content": "e"
    },
    {
        "_id": 3,
        "source_ip": "",
        "dest_ip": "",
        "content": "l"
    },
    {
        "_id": 4,
        "source_ip": "",
        "dest_ip": "",
        "content": "l"
    },
    {
        "_id": 5,
        "source_ip": "",
        "dest_ip": "",
        "content": "o"
    },
    {
        "_id": 6,
        "source_ip": "",
        "dest_ip": "",
        "content": "!"
    }
]
`

const demo_file2 = `
[
    {
        "_id": 1,
        "source_ip": "",
        "dest_ip": "",
        "content": "H"
    }
]
`


const demoButton = document.getElementById('demo_button');
    demoButton.addEventListener('click', (event) => {
        http_requests = JSON.parse(demo_file2);
        console.log(http_requests);
        ready = true;
        document.getElementById("file_selection_area").style.display = "none";
        selector_text.style.visibility = "visible";
    })


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

// function preload() {
//     routerImage = loadImage('./assets/router.png');
//     hostImage = loadImage('./assets/host.png')
// }

var n;
var source; // <-- source router/host
var dest; // <-- destination router/host

var start_time; // <-- start time of simulation
var end_time; // <-- end time of simulation

var source_chosen = false; // <-- bool for source chosen
var dest_chosen = false; // <-- bool for dest chosen

var source_ip; // <-- stores chosen source IP
var dest_ip; // <-- stores chosen destination IP

//when pressing on a node, sets to either source or destination
function mouseClicked() {
    if(!source_chosen && n){
        for(let i = 0; i < n.routers.length; i ++){
            if(dist(mouseX, mouseY, n.routers[i].x_pos, n.routers[i].y_pos) < 5){
                console.log("Source node: " + n.routers[i].ip);
                n.routers[i].isSource = true;
                source_chosen = true;
                source_ip = n.routers[i].ip;
                source = n.routers[i];
                setSourceNode(n.routers[i].ip);
            }
        }
    }else if(!dest_chosen && n){
        for(let i = 0; i < n.routers.length; i ++){
            if(dist(mouseX, mouseY, n.routers[i].x_pos, n.routers[i].y_pos) < 5){
                console.log("Destination node: " + n.routers[i].ip);
                n.routers[i].isDest = true;
                dest_chosen = true;
                dest_ip = n.routers[i].ip;
                dest = n.routers[i];
                setDestNode(n.routers[i].ip);
                n.dijkstra(source, dest); // <-- perform dijkstra calculation
            }
        }
    }
    
  }

//set source node ip
function setSourceNode(ip){
    for(let i = 0; i < http_requests.length; i++) {
        http_requests[i].source_ip = ip;
    }
    //console.log(http_requests);
}

//set destination node ip
function setDestNode(ip){
    for(let i = 0; i < http_requests.length; i++) {
        http_requests[i].dest_ip = ip;
    }
    //console.log(http_requests);
}


function setup(){
    let cnv = createCanvas(500, 500);
    cnv.id('mycanvas');

    // styling
    /*
    canvas and send packet button should be together (vertically)
    packet info and timing section should be to right side
    */



    n = new Network();

    //select number of routers and number of neighbors of each router
    let numRouters = 3;
    for(let i = 0; i < numRouters; i ++){
        n.routers.push(new Router(""));
    }

    n.generateConnections();

    n.printNetwork();

    button = createButton('Send Packets')
    button.mouseClicked( ()=> {
        if(source_chosen && dest_chosen){
            packet_button_pressed = true;
        }else{
            alert("Please select a source and destination node by pressing on a black dot (router/node) with an IP address.")
        }
    })
}

function draw(){
    background(255,255,255);
    if(packet_button_pressed){
        n.sendPackets(source_ip); // <-- send packets through network
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
        this.routers = []; // <-- GRAPH
        this.hosts = [];
        this.connectionsPerRouter = 3; // <-- how many connections each router can 
    }

    printNetwork(){
        for(let i = 0; i < this.routers.length; i++){
            this.routers[i].printRoutingTable();
            console.log();
        }
    }

    generateConnections(){
        for(let i = 0; i < this.routers.length; i++){
            //let index = Math.floor(Math.random() * this.routers.length);
            let cur = this.routers[i];
            for(let j = 0; j < this.connectionsPerRouter; j++){
                let cur_con = this.routers[Math.floor(Math.random() * this.routers.length)];
                if(cur.activeConnections < this.connectionsPerRouter){
                    if(cur.alreadyContains(cur_con) || cur_con.alreadyContains(cur)){ // <-- avoid duplicates
                        //console.log('conflict');
                        j--;
                    }else{
                        cur.routing_table.push({
                            "router": cur_con,
                            "cost": Math.floor(dist(cur.x_pos, cur.y_pos, cur_con.x_pos, cur_con.y_pos)) // <-- cost is simply distance to router
                        });
                        cur.activeConnections++;

                        cur_con.routing_table.push({
                            "router": cur,
                            "cost": Math.floor(dist(cur.x_pos, cur.y_pos, cur_con.x_pos, cur_con.y_pos)) // <-- cost is simply distance to router
                        });
                        
                        cur_con.activeConnections++;
                    }
                    
                    
                }
                
            }
        }
    }


    calculateMap(){
        let m = {};

        for(let i = 0; i < this.routers.length; i ++){
            m[this.routers[i].ip] = i;
        }

        return m;
    }


    findNode(k, m){
        //search through map to get corresponding IP
        let ip_find;
        let found_router;
        for (const [key, value] of Object.entries(m)) {
            if(k === value){
                ip_find = key;
            }
        }

        //search through routers to find corresponding router
        this.routers.map((i , j) => {
            if(this.routers[j].ip === ip_find){
                found_router =  this.routers[j];
            }
        })

        return found_router;

    }
    

    dijkstra(src, dest) {

        let m = this.calculateMap();

        //console.log(m);

        let d = []; // <-- store the current length of the shortest path
        let p = []; // <-- array of predecessors
        let vis = []; // <-- keeps track of visited

        //get all paths
        let eligibityCheck = false;
    
        //d is distance from source in terms of edges
        //p is the predecessor node that connects it
        let queue = [];
        //dijkstra first step
        for (let i = 0; i < this.routers.length; i++) {
            d[i] = Number.MAX_SAFE_INTEGER; //setting to max int val
            p[i] = -1; //setting to -1
            vis[i] = false;
        }

        d[m[src.ip]] = 0;

        queue.push(m[src.ip]);

        while (queue.length > 0) {
            let current = queue[0];
            //console.log('current: ' + current);
            
            let current_node = this.findNode(current, m); // <-- gets corresponding node to current 

            //console.log(current_node);

            queue.shift(); //erase first element

            //console.log(queue);

            //going through neighbors of current
            for (let i = 0; i < current_node.routing_table.length; i++) {
                let index_ip = current_node.routing_table[i].router.ip;
                let index = m[current_node.routing_table[i].router.ip];
                //console.log(index_ip);
                if (!index.busy && !vis[m[index_ip]]) {
                    let cost = current_node.routing_table[i].cost;
                    if (d[index] > d[current] + cost) {
                        d[index] = d[current] + cost;
                        p[index] = current;
                    }
                    //console.log(m[index.ip]);
                    
                    queue.push(m[index_ip]);
                    vis[m[index_ip]] = true;
                    
            
                    if (index_ip === dest.ip) {
                        eligibityCheck = true;
                    }
                }
            }
        }
        //pathing portion
        if (!eligibityCheck) {
            console.log("no route available");
            return [];
        }

        //going through vector p to get the correct path from node to node
        let correctPath = [];
        correctPath.push(m[dest.ip]);
        let checkIfSrc = m[dest.ip];

        while (checkIfSrc !== m[src.ip]) {
            correctPath.push(p[checkIfSrc]);
            //m[current_node.routing_table[i].router.ip]
            checkIfSrc = p[checkIfSrc];
        }

        correctPath = correctPath.reverse(); //reverse array to get in order path
    
        console.log("dijkstra routing complete:");

        // console.log(m);
        console.log(correctPath);


        this.sendPackets(correctPath, m); // <-- begin routings

        //this.printNetwork();
    }

    sendPackets(path, map){
        /*
        take http requests from file, create n packets
        give packets to start router 
        */
       console.log("sending packets to start node...");
       //console.log(http_requests);
        for(let i = 0; i < http_requests.length; i++) {
            let packet_info = http_requests[i];
            let p = new Packet(packet_info);

            //push packet to source node
            for(let j = 0; j < this.routers.length; j++){
                if(this.routers[j].ip = source_ip){
                    this.routers[j].data.push(p);
                    this.routers[j].dijkstraPath = path;
                    this.routers[j].dataMap = map;
                    break;
                }
            }
        }

    }

}

class Router{
    constructor(ip){
        this.ip = ip; // <-- in the form "kkk.xxx.yyy.zzz"
        this.busy = false; // <-- if router currently has more than 3 packets, router is busy
        this.routing_table = []; // <-- currently an array, can be any data structure
        this.x_pos = Math.floor(Math.random() * width);
        this.y_pos =  Math.floor(Math.random() * height);
        this.data = []; //new CustomDataStructure(); // <-- packet objects stored here, can be any data structure
        if(this.ip === ""){
            this.generateIP();
        }
        this.activeConnections = 0; // <-- # of active connections

        this.dijkstraPath; // <-- correct path calculated by dijkstra's
        this.dataMap; // <-- maps ip addresses to indexes for ease of routing

        //bools for dest/source states
        this.isDest = false;
        this.isSource = false;

        this.hadData = false;

        this.network;
    }
    
    display(){
        if(this.isSource){
            fill(0,0,255);
            stroke(0,0,255);
        }else if(this.isDest){
            fill(255,0,0);
            stroke(255,0,0);
        }else if(this.hadData){
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
        
        //if router has packets, send them to next destination
        if(this.data.length > 0){
            this.sendPacket(this.data[0]);
        }

        //setting router to busy if applicable
        if(this.data.length > 3){
            //this.busy = true;
        }else{
            this.busy = false;
        }
    }

    alreadyContains(router){
        for(let i = 0; i < this.routing_table.length; i ++){
            if(router.ip === this.routing_table[i].router.ip){
                return true;
            }
        }
        return false;
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
        console.log("router: " + this.ip);
        for(let i = 0; i < this.routing_table.length; i++){
            console.log(this.routing_table[i].router.ip);
        }
        console.log('---');
    }

    printDijk(){
        let ip_find;
        let i = 0;
        for (const [key, value] of Object.entries(this.dataMap)) {
            if(i === value){
                ip_find = key;
                console.log(i + "->" + ip_find);
            
            }
            i++;
        }
    }

    findNodeFromInd(ind, m){
        //search through map to get corresponding IP
        let ip_find;
        let found_router;
        for (const [key, value] of Object.entries(m)) {
            if(ind === value){
                ip_find = key;
            }
        }

        console.log(ip_find);

        //search through routing table to find corresponding router
        console.log('current info: ' + this.ip)
        console.log(this.routing_table);
        for(let i = 0; i < this.routing_table.length; i ++){
            if(this.routing_table[i].router.ip === ip_find){
                found_router = this.routing_table[i].router;
                found_router.hadData = true;
                return found_router;
            }
        }
    }

    findNextHop(){ 
        /*
        sends packet to next router in this.dijkstraPath
        */
        //this.printDijk();
        let next_hop;
        let newDijk = this.dijkstraPath.splice(1, this.dijkstraPath.length-1); // <-- remove this step from the path
        //console.log(newDijk);
        next_hop = this.findNodeFromInd(newDijk[0], this.dataMap); // <-- get next hop router from dijk info
        console.log(next_hop);
        next_hop.dijkstraPath = newDijk;
        next_hop.dataMap = this.dataMap;

        //console.log(next_hop.routing_table);

        return next_hop; //return next hop router (router Object)
    }


    sendPacket(packet){
        if(packet.lifespan === 0){ //check if packet is dead
            console.log('packet died!!!')
            this.data.splice(0,1);
        }else if(packet.header.dest_ip === this.ip){ // <-- if packet has reached destination!!!!
            var d = new Date();
            end_time = d.getTime();
            //alert(`Message recieved: ${packet.body.content} | Time elapsed: ${end_time - start_time}ms`);
            alert('PACKET ARRIVED!')
            this.data.shift();
        }

        if(this.data.length > 0){  // <-- check if router has data to send
            console.log('forwarding packet...');

            let dest = this.findNextHop(); // <-- find next router to send packet to 
            //console.log(dest);
            if(dest === undefined){
                this.data.splice(0,1);
                //no path, need to recalculate
            }else{
                dest.data.push(packet); // <-- sending packet to next hop
                this.data.shift();
                packet.prev_ip = this.ip;
                packet.lifespan = packet.lifespan - 1; 
            }
        }
       
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





