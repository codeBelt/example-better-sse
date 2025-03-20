import express from 'express';
import cors from 'cors';

export const PORT = process.env.PORT || 8080;

export const server = express();

server.use(
  cors({
    origin: true,
    credentials: true,
  })
);

server.use(express.json());
