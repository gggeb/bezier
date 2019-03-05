const FONT_HEIGHT   = 12;
const COLOUR        = "black";
const ALT_COLOUR    = "red";
const ANCHOR_RADIUS = 2;
const T_RADIUS      = 4
const STOP_BOUNDS   = { LOWER: 1, DEFAULT: 64, UPPER: 256 };
const EASING        = 0.05;
const HELP          = [
    "CLICK TO PLACE ANCHOR",
    "C TO CLEAR ANCHORS, T TO TOGGLE DETAIL, </> TO INCREASE/DECREASE STOPS"
];

//
// ;
//

function bezier(anchors, t) {
    if (anchors.length > 0) {
        if (anchors.length === 1) {
            return anchors[0];
        } else {
            let na = [];
            for (let i = 1; i < anchors.length; ++i) {
                let p1 = anchors[i - 1], p2 = anchors[i];
                na.push({
                    x: (p2.x - p1.x) * t + p1.x,
                    y: (p2.y - p1.y) * t + p1.y
                });
            }

            return bezier(na, t);
        }
    }
}

function bezier_iter(iters, anchors, t) {
    if (anchors.length > 2) {
        let iter = [];
        for (let i = 1; i < anchors.length; ++i) {
            let p1 = anchors[i - 1], p2 = anchors[i];
            iter.push({
                x: (p2.x - p1.x) * t + p1.x,
                y: (p2.y - p1.y) * t + p1.y
            });
        }

        iters.push(iter);
        return bezier_iter(iters, iter, t);
    } else {
        return iters;
    }
}

//
// ;
//

let canvas = document.getElementById("medium");
let ctx    = canvas.getContext("2d");

let show_detail = false;
let e           = 0;
let ut          = 0;
let goal        = 1;
let stops       = STOP_BOUNDS.DEFAULT;
let anchors     = [];
let status_line = "BEGUN";

window.addEventListener("resize", () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
});
window.dispatchEvent(new Event("resize"));

document.addEventListener("keypress", (event) => {
    if (!event.repeat) {
        if (event.code === "KeyC") {
            anchors     = [];
            status_line = "CLEARED";
        } else if (event.code === "KeyT") {
            show_detail = !show_detail;
            status_line = "DETAIL IS " + (show_detail ? "ON" : "OFF");
        }
    }
    
    if (event.shiftKey) {
        if (event.code === "Comma") {
            --stops;
            stops = stops < STOP_BOUNDS.LOWER ? STOP_BOUNDS.LOWER : stops;
        } else if (event.code === "Period") {
            ++stops;
            stops = stops > STOP_BOUNDS.UPPER ? STOP_BOUNDS.UPPER : stops;
        }
    }
});

canvas.addEventListener("click", (event) => {
    anchors.push({
        x: event.clientX,
        y: event.clientY
    });

    status_line = "ANCHOR ADDED AT X: " + String(event.clientX)
                + ", Y: " + String(event.clientY);
});

function render() {
    requestAnimationFrame(render);

    e  = (EASING - e) * EASING + e;
    ut = (goal - ut) * e + ut;
    
    let r = Math.round(ut * 100) / 100;
    if (r === 1) {
        goal = 0;
        e    = 0;
    } else if (r === 0) {
        goal = 1;
        e    = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font      = String(FONT_HEIGHT) + "px monospace";
    ctx.fillStyle = COLOUR;
    ctx.fillText(status_line, 0, FONT_HEIGHT);
    ctx.fillText("STOPS = " + String(stops), 0, FONT_HEIGHT * 2);
    ctx.fillText("    T = " + String(Math.floor(ut * 100) / 100), 0, FONT_HEIGHT * 3);
    for (let i in HELP) {
        ctx.fillText(HELP[i], 0, FONT_HEIGHT * (5 + parseInt(i)));
    }

    if (bezier(anchors, 0) !== undefined) {
        ctx.strokeStyle = COLOUR;
        ctx.beginPath();
        for (let i = 0; i <= stops; ++i) {
            let p = bezier(anchors, (1 / stops) * i);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
       
        if (show_detail) {
            let iters = bezier_iter([anchors], anchors, ut);
            let bp    = bezier(anchors, ut);
            
            if (iters.length > 0) {
                for (let i in iters) {
                    ctx.strokeStyle = "hsl("
                                    + String((360 / iters.length) * i) + ", 100%, 50%)";
                    ctx.beginPath();
                    for (let p of iters[i]) {
                        ctx.lineTo(p.x, p.y);
                    }
                    ctx.stroke();
                }
            }

            ctx.fillStyle = ALT_COLOUR;
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, T_RADIUS, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    ctx.fillStyle = COLOUR;
    for (let point of anchors) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, ANCHOR_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
    }
}

render();
