"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* Import npm packages */
var express_1 = __importDefault(require("express"));
var tellojs_1 = __importDefault(require("tellojs"));
var express_ws_1 = __importDefault(require("express-ws"));
var uuid_1 = require("uuid");
/* Import local packages and typedef */
var h264_segmenter_1 = require("./h264-segmenter");
var sdk = tellojs_1.default;
/* Global constant */
var PORT = 42069;
/* Initialise HTTP and websocket server */
var app = (0, express_ws_1.default)((0, express_1.default)()).app;
var clients = [];
/* Setup web server */
app.use(express_1.default.json());
app.use(express_1.default.static("./src/www"));
/* Setup helper functions for back-front-communication */
var com = {
    video: function (buffer) {
        var e_1, _a;
        var dataArray = Array.from(buffer);
        try {
            for (var clients_1 = __values(clients), clients_1_1 = clients_1.next(); !clients_1_1.done; clients_1_1 = clients_1.next()) {
                var client = clients_1_1.value.client;
                client.send(JSON.stringify({
                    type: "stream",
                    data: dataArray,
                }));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (clients_1_1 && !clients_1_1.done && (_a = clients_1.return)) _a.call(clients_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    },
    state: function (state) {
        var e_2, _a;
        try {
            for (var clients_2 = __values(clients), clients_2_1 = clients_2.next(); !clients_2_1.done; clients_2_1 = clients_2.next()) {
                var client = clients_2_1.value.client;
                client.send(JSON.stringify({
                    type: "state",
                    data: state,
                }));
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (clients_2_1 && !clients_2_1.done && (_a = clients_2.return)) _a.call(clients_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
    },
};
/* Setup drone connection */
var drone = {
    connected: false,
    keepAlive: function () {
        console.log("Keeping drone alive");
        setInterval(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sdk.read.battery()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); }, 5000);
    },
};
function droneControl() {
    return __awaiter(this, void 0, void 0, function () {
        var e_3, videoEmitter, isFirst, segmenter, stateEmitter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, sdk.control.connect()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_3 = _a.sent();
                    console.log("Could not connect to drone. Retrying...");
                    return [2 /*return*/];
                case 3:
                    drone.keepAlive();
                    drone.connected = true;
                    console.log("Drone connection established");
                    return [4 /*yield*/, sdk.receiver.video.bind()];
                case 4:
                    videoEmitter = _a.sent();
                    isFirst = true;
                    videoEmitter.on("message", function (res) {
                        /* If its the first segment, initialise a new segmenter */
                        if (isFirst) {
                            segmenter = new h264_segmenter_1.H264Segmenter(res);
                            isFirst = false;
                        }
                        /* Feed the segmenter segments as they come in */
                        var segment = segmenter.feed(res);
                        /* If the segmenter.feed method returns an object,
                         * dispatch the segment to clients */
                        if (segment)
                            com.video(segment);
                    });
                    stateEmitter = sdk.receiver.state.bind();
                    stateEmitter.on("message", function (res) {
                        com.state(res);
                    });
                    return [2 /*return*/];
            }
        });
    });
}
app.ws("/", function (ws) {
    var myUuid = (0, uuid_1.v4)();
    clients.push({ client: ws, uuid: myUuid });
    console.log("New client!");
    ws.onmessage = function (msg) {
        console.log("Received: ".concat(msg.data));
    };
    ws.onclose = function () {
        console.log("Client closed!");
        for (var i = 0; i < clients.length; i++) {
            var uuid = clients[i].uuid;
            if (uuid == myUuid) {
                clients.splice(i, 1);
            }
        }
    };
});
/* Launch server */
app.listen(PORT, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Listening on ".concat(PORT, "..."));
                console.log("Connecting to drone...");
                _a.label = 1;
            case 1:
                if (!!drone.connected) return [3 /*break*/, 3];
                return [4 /*yield*/, droneControl()];
            case 2:
                _a.sent();
                return [3 /*break*/, 1];
            case 3: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=index.js.map