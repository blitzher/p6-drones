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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* Import npm packages */
var express_1 = __importDefault(require("express"));
var tellojs_1 = __importDefault(require("tellojs"));
var express_ws_1 = __importDefault(require("express-ws"));
var uuid_1 = require("uuid");
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
    video: function (ws, buffer) {
        var dataArray = Array.from(buffer);
        ws.send(JSON.stringify({
            type: "stream",
            data: dataArray
        }));
    }
};
/* Setup drone connection */
var drone = {
    connected: false,
    videoData: function (data) {
        for (var _i = 0, clients_1 = clients; _i < clients_1.length; _i++) {
            var client = clients_1[_i].client;
            com.video(client, data);
        }
    }
};
function droneControl() {
    return __awaiter(this, void 0, void 0, function () {
        var videoEmitter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tellojs_1.default.control.connect()];
                case 1:
                    _a.sent();
                    drone.connected = true;
                    console.log("Drone connection established");
                    return [4 /*yield*/, tellojs_1.default.receiver.video.bind()];
                case 2:
                    videoEmitter = _a.sent();
                    videoEmitter.on('message', function (res) {
                        drone.videoData(res);
                    });
                    return [2 /*return*/];
            }
        });
    });
}
;
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
app.listen(PORT, function () {
    console.log("Listening on ".concat(PORT, "..."));
    console.log("Connecting to drone...");
    droneControl();
});
//# sourceMappingURL=index.js.map