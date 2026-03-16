import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socket/socket-handler';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // In production, restrict this to your frontend URL
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.send('Server is healthy');
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
