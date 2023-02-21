"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* Import npm packages */
var express_1 = __importDefault(require("express"));
/* Global constant */
var PORT = 69420;
/* Initialise HTTP server */
var app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.static("./www"));
/* Launch server */
app.listen(PORT, function () {
    console.log("Listening on " + PORT + "...");
});
