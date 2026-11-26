"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const userRoutes_1 = __importDefault(require("./Routes/userRoutes"));
const blogRoutes_1 = __importDefault(require("./Routes/blogRoutes"));
const blogVideoGenration_1 = __importDefault(require("./Routes/blogVideoGenration"));
const FaviouritesRoutes_1 = __importDefault(require("./Routes/FaviouritesRoutes"));
const blogGlobeFeed_1 = __importDefault(require("./Routes/blogGlobeFeed"));
const MemoriesRoutes_1 = __importDefault(require("./Routes/MemoriesRoutes"));
const ReelRoutes_1 = __importDefault(require("./Routes/ReelRoutes"));
const passport_1 = __importDefault(require("./config/passport"));
const InviteRoutes_1 = __importDefault(require("./Routes/InviteRoutes"));
const BlogFeed_1 = __importDefault(require("./Service/BlogFeed/BlogFeed"));
const flightRoutes_1 = __importDefault(require("./Routes/flightRoutes"));
const socketMemoriesOpt_1 = __importStar(require("./Socket/socketMemoriesOpt"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
app.use("/", InviteRoutes_1.default);
const server = http_1.default.createServer(app);
exports.io = new socket_io_1.Server(server, {
    maxHttpBufferSize: socketMemoriesOpt_1.MAX_SOCKET_IMAGE_BYTES + 64 * 1024,
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
});
(0, socketOpt_1.initSocket)(exports.io);
(0, socketMemoriesOpt_1.default)(exports.io.of("/memories"));
app.use("/api/auth", authRoutes_1.default);
app.use("/api/explore", hotelRoutes_1.default);
app.use("/api/explore", placeRoutes_1.default);
app.use("/home", Home_1.default);
app.use("/common", Common_1.default);
app.use("/trip", tripRoutes_1.default);
app.use("/blog", blogRoutes_1.default);
app.use("/blogVideoGenration", blogVideoGenration_1.default);
app.use("/faviourites", FaviouritesRoutes_1.default);
app.use("/user", userRoutes_1.default);
app.use("/blog-globe-feed", blogGlobeFeed_1.default);
app.use("/api/flights", flightRoutes_1.default);
app.use("/memories", MemoriesRoutes_1.default);
app.use("/reel", ReelRoutes_1.default);
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
setInterval(() => {
    const blogFeedInstance = new BlogFeed_1.default();
    blogFeedInstance.tredingBlog();
    // blogFeedInstance.fetchTrendingBlog();
}, 60000 * 5); // Log every 5 minutes
dbConfig_1.default.sync().then(() => {
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
