"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const dbConfig_1 = __importDefault(require("./DB/dbConfig"));
const socketOpt_1 = require("./Socket/socketOpt");
const Home_1 = __importDefault(require("./Routes/Home"));
const Common_1 = __importDefault(require("./Routes/Common"));
const authRoutes_1 = __importDefault(require("./Routes/authRoutes"));
const hotelRoutes_1 = __importDefault(require("./Routes/hotelRoutes"));
const placeRoutes_1 = __importDefault(require("./Routes/placeRoutes"));
const tripRoutes_1 = __importDefault(require("./Routes/tripRoutes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json());
// app.use(passport.initialize());
const server = http_1.default.createServer(app);
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
});
(0, socketOpt_1.initSocket)(exports.io);
app.use("/api/auth", authRoutes_1.default);
app.use("/api/explore", hotelRoutes_1.default);
app.use("/api/explore", placeRoutes_1.default);
app.use("/home", Home_1.default);
app.use("/common", Common_1.default);
app.use("/trip", tripRoutes_1.default);
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
dbConfig_1.default.sync().then(() => {
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
