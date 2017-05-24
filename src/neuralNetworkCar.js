var num_inputs = 9;
var num_actions = 7;
var SEGMENTS = 16;

var brain = new deepqlearn.Brain(num_inputs, num_actions);
brain.temporal_window = 10;

var walls = [];

var distance = 0;

    var Vec = function(x, y) {
        this.x = x;
        this.y = y;
    }
    Vec.prototype = {

        dist_from: function(v) { return Math.sqrt(Math.pow(this.x-v.x,2) + Math.pow(this.y-v.y,2)); },
        length: function() { return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2)); },

        add: function(v) { return new Vec(this.x + v.x, this.y + v.y); },
        sub: function(v) { return new Vec(this.x - v.x, this.y - v.y); },
        rotate: function(a) {
        return new Vec(this.x * Math.cos(a) + this.y * Math.sin(a),
                       -this.x * Math.sin(a) + this.y * Math.cos(a));
        },

        scale: function(s) { this.x *= s; this.y *= s; },
        normalize: function() { var d = this.length(); this.scale(1.0/d); }
    }
    
    var line_intersect = function(p1,p2,p3,p4) {
        var denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
        
        if(denom===0.0) { return false; }
        
        var ua = ((p4.x - p3.x)*(p1.y - p3.y)-(p4.y - p3.y)*(p1.x - p3.x)) / denom;
        var ub = ((p2.x - p1.x)*(p1.y - p3.y)-(p2.y - p1.y)*(p1.x - p3.x)) / denom;
        
        if(ua > 0.0 && ua < 1.0 && ub > 0.0 && ub < 1.0) {
            var up = new Vec(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
            return {ua:ua, ub:ub, up:up};
        }
        
        return false;
    }
    
    var line_point_intersect = function(p1,p2,p0,rad) {
        var v = new Vec(p2.y - p1.y, - (p2.x - p1.x));
        var d = Math.abs((p2.x - p1.x) * (p1.y - p0.y)-(p1.x - p0.x)*(p2.y - p1.y));
        d = d / v.length();
        if(d > rad) { return false; }

        v.normalize();
        v.scale(d);
        var up = p0.add(v);
        if(Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y)) {
        var ua = (up.x - p1.x) / (p2.x - p1.x);
        } else {
        var ua = (up.y - p1.y) / (p2.y - p1.y);
        }
        if(ua > 0.0 && ua < 1.0) {
        return {ua:ua, up:up};
        }
        return false;
    }
    
    var Wall = function(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
    
    var util_add_box = function(x, y, w, x2, y2, w2) {
        walls.push(new Wall(new Vec(x,y), new Vec(x2,y2)));
        walls.push(new Wall(new Vec(x+w,y), new Vec(x2+w2,y2)));
    }
    
    var Eye = function(angle) {
        this.angle = angle;
        this.max_range = 85;
        this.sensed_proximity = 85;
        this.sensed_type = -1;
        this.found = false;
    }
    
    function draw() {  
        var canvas=document.getElementById("c");
        var ctx=canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 1;

        ctx.strokeStyle = "rgb(0,0,0)";
        ctx.beginPath();
        for(var i=0,n=walls.length;i<n;i++) {
            var q = walls[i];
            ctx.moveTo(q.p1.x, q.p1.y);
            ctx.lineTo(q.p2.x, q.p2.y);
        }
        ctx.stroke();
        ctx.fillStyle = "rgb(150, 150, 150)";
        ctx.strokeStyle = "rgb(0,0,0)";

        ctx.beginPath();
        ctx.rect(playerPos.x-5, playerPos.y-10, 10, 20); 
        ctx.fill();
        ctx.stroke();
        
        
        for(var ei=0,ne=eyes.length;ei<ne;ei++) {
            var e = eyes[ei];
            var sr = e.sensed_proximity;
            if(e.sensed_type === -1 || e.sensed_type === 0) { 
            ctx.strokeStyle = "rgb(0,0,0)";
            }
            if(e.sensed_type === 1) { ctx.strokeStyle = "rgb(255,150,150)"; }
            if(e.sensed_type === 2) { ctx.strokeStyle = "rgb(150,255,150)"; }
            ctx.beginPath();
            ctx.moveTo(playerPos.x, playerPos.y);
            ctx.lineTo(playerPos.x + sr * Math.sin(angle + e.angle),
                     playerPos.y + sr * Math.cos(angle + e.angle));
            ctx.stroke();
        }
    }

    
var playerPos = new Vec(150, 800);
var rad = 10;
var angle = 3.14;
var eyes = [];
for(var k=0;k<9;k++) { eyes.push(new Eye((k-4.5)*0.25)); }

var x = Math.random() * 200;
var y = 800;
var w = Math.random() * 100 + 200;
var xPrev = x;
var yPrev = y;
var wPrev = w;

function generateWalls() {
    
    walls = [];
    
    for (var i = SEGMENTS; i >= 0; i--) {

        xPrev = x;
        yPrev = y;
        wPrev = w;

        x = Math.random() * 200;
        y = yPrev - 50;
        w = Math.random() * 100 + 200;
        
        util_add_box(xPrev, yPrev, wPrev, x, y, w);
    }

}

function generateSection() {
    walls.splice(0,2);
    
    xPrev = walls[walls.length - 2].p2.x;
    yPrev = walls[walls.length - 2].p2.y;
    wPrev = walls[walls.length - 1].p2.x - walls[walls.length - 2].p2.x;

    x = Math.random() * 150;
    y = yPrev - 50;
    w = Math.random() * 50 + 100;
    
    util_add_box(xPrev, yPrev, wPrev, x, y, w);
    xPrev = x;
    yPrev = y;
    wPrev = w;
}
    
function isInside(offset) {
    if (
        playerPos.x + offset > (
            walls[0].p1.x + (walls[0].p2.x - walls[0].p1.x) * (playerPos.y - walls[0].p1.y)/
            (walls[0].p2.y - walls[0].p1.y)
        ) && 
        playerPos.x + offset < (
            walls[1].p1.x + (walls[1].p2.x - walls[1].p1.x) * (playerPos.y - walls[1].p1.y)/
            (walls[1].p2.y - walls[1].p1.y)
        )
    )
        return true;
    else
        return false;
}
    
    
function periodic() {

    var input = [];
    
    for (var i = 0; i < 9; i++) {
        if (!isInside(0))
            eyes[i].sensed_proximity = 0;
            
        input.push(eyes[i].sensed_proximity/eyes[i].max_range);
    }
    
    turn = (brain.forward(input) - 3);
   
   var reward = 0;
   
   if (!isInside(turn)) {
        reward = -1;
        if (playerPos.x > 150)
            turn = -3;
        else
            turn = 3;
    }

    playerPos.x += turn;
    //angle = 3.14 + turn * 0.1;
    
    distance++;
    
    if (distance >= 50) {
        distance = 0;
        generateSection();
    }
    for (var i = 0; i < walls.length; i++) {
        walls[i].p1.y++;
        walls[i].p2.y++;
    }

    
    for (var j = 0; j < 9; j++) {
        var e = eyes[j];
        e.found = false;
        e.sensed_proximity = e.max_range;
        for (var i = 0; i < 6; i++) {
            var wall = walls[i];
            var eyep = new Vec(playerPos.x + e.max_range * Math.sin(angle + e.angle),
                playerPos.y + e.max_range * Math.cos(angle + e.angle));
            var res = line_intersect(playerPos, eyep, wall.p1, wall.p2);
            if(res && !e.found) {
                e.found = true;
                e.sensed_proximity = res.up.dist_from(playerPos);
            }
        }
    }

    //Reward is calculated below
    for (var i = 0; i < 9; i++) {
        reward += eyes[i].sensed_proximity / eyes[i].max_range / 9;
    }
    if (turn != 0)
        reward -= 0.05 * Math.abs(turn);
    
    if (isInside(0))
        brain.backward(reward);
    
    if (render)
        draw();
    
    brain.visSelf(document.getElementById('reward'));
}
var current_interval_id;
function slow() {
    window.clearInterval(current_interval_id);
    current_interval_id = setInterval(periodic, 50);
}

function start() {
    brain.learning = true;
    
    generateWalls();
    
    current_interval_id = setInterval(periodic, 1);
}

var learn = true;
function learnToggle() {
    if (learn == false) {
        learn = true;
        brain.learning = true;
         brain.epsilon_test_time = 0.05;
        }
    else {
        learn = false;
        brain.learning = false;
         brain.epsilon_test_time = 0.0;
    }
}
var render = true;
function renderToggle() {
    render = !render;
}

function resetPos() {
    playerPos.x = 150;
}
