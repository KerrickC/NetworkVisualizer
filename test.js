function sendPackets(path, map){
    /*
    take http requests from file, create n packets
    give packets to start router 
    */

    function sender(start, i, path, map){
        let packet_info = http_requests[i];
        let p = new Packet(packet_info);
        start.data.insert(p);
        start.dijkstraPath = path;
        start.dataMap = map;
    }

    function senderLARGE(start, i, path, map){
        for(let j = i; j < i + 100; j ++){
            if(j > http_requests.length) break;
            let packet_info = http_requests[i];
            let p = new Packet(packet_info);
            start.data.insert(p);
            start.dijkstraPath = path;
            start.dataMap = map;
        }
    }


    
   let start_router;
    for(let j = 0; j < this.routers.length; j++){
        if(this.routers[j].ip == source_ip){
            start_router = this.routers[j];
        }
    }


    if(http_requests.length > 1000){ // <-- very large amount of data
        for(let i = 0; i < http_requests.length; i += 100 ) {
                setTimeout(function(){
                    senderLarge(start_router, i, path, map);
                }, 0);                  
        }
    }else{
        for(let i = 0; i < http_requests.length; i ++ ) {
           
            sender(start_router, i, path, map);
                
        }
    }
}

