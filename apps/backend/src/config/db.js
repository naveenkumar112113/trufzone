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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const seed_1 = require("./seed");
let mongoServer = null;
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/turfhub';
        if (process.env.NODE_ENV === 'test') {
            mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create();
            const uri = mongoServer.getUri();
            yield mongoose_1.default.connect(uri);
            console.log('MongoDB: Connected to in-memory test database');
            yield (0, seed_1.seedDatabase)();
            return;
        }
        try {
            // Try local MongoDB with short timeout
            const conn = yield mongoose_1.default.connect(mongoUri, {
                serverSelectionTimeoutMS: 2000
            });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            yield (0, seed_1.seedDatabase)();
        }
        catch (localErr) {
            console.warn(`Local MongoDB unavailable (${localErr.message}). Starting embedded MongoMemoryServer...`);
            mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create();
            const memUri = mongoServer.getUri();
            const conn = yield mongoose_1.default.connect(memUri);
            console.log(`MongoDB Connected (Embedded In-Memory): ${conn.connection.host}`);
            yield (0, seed_1.seedDatabase)();
        }
    }
    catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
    }
});
exports.connectDB = connectDB;
const closeDB = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.disconnect();
    if (mongoServer) {
        yield mongoServer.stop();
    }
});
exports.closeDB = closeDB;
