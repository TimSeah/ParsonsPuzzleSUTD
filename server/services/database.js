import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'node:dns';

const MONGODB_URI = process.env.MONGODB_URI;
const SERVER_SELECTION_TIMEOUT_MS = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS);
const CONNECT_TIMEOUT_MS = Number(process.env.MONGODB_CONNECT_TIMEOUT_MS);
const RETRY_MIN_MS = Number(process.env.MONGODB_RETRY_MIN_MS);
const RETRY_MAX_MS = Number(process.env.MONGODB_RETRY_MAX_MS);

const mongooseOptions = {
  serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
  connectTimeoutMS: CONNECT_TIMEOUT_MS,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  maxPoolSize: 10,
};

let connectionPromise = null;
let retryTimer = null;
let retryAttempt = 0;
let stopping = false;
let dnsChecked = false;

const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export function databaseState() {
  return stateNames[mongoose.connection.readyState] || 'unknown';
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

function retryDelay() {
  return Math.min(RETRY_MIN_MS * (2 ** retryAttempt), RETRY_MAX_MS);
}

function scheduleReconnect() {
  if (stopping || retryTimer || isDatabaseConnected()) return;
  const delay = retryDelay();
  retryAttempt += 1;
  console.log(`MongoDB reconnect scheduled in ${delay}ms`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void connectDatabase();
  }, delay);
  retryTimer.unref?.();
}

async function ensureSrvDnsWorks() {
  if (dnsChecked || !MONGODB_URI.startsWith('mongodb+srv://')) return;
  const hostname = new URL(MONGODB_URI.replace('mongodb+srv://', 'http://')).hostname;
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${hostname}`);
  } catch (error) {
    if (!['EBADRESP', 'ETIMEOUT', 'ESERVFAIL', 'EREFUSED'].includes(error.code)) throw error;
    const fallbackServers = (process.env.MONGODB_DNS_SERVERS || '1.1.1.1,8.8.8.8')
      .split(',')
      .map(server => server.trim())
      .filter(Boolean);
    dns.setServers(fallbackServers);
    await dns.promises.resolveSrv(`_mongodb._tcp.${hostname}`);
    console.warn(`System DNS could not resolve the Atlas SRV record; using ${fallbackServers.join(', ')} for Node DNS.`);
  }
  dnsChecked = true;
}

export function connectDatabase() {
  if (isDatabaseConnected()) return Promise.resolve(true);
  if (connectionPromise) return connectionPromise;

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  console.log('Connecting to MongoDB...');
  connectionPromise = ensureSrvDnsWorks()
    .then(() => mongoose.connect(MONGODB_URI, mongooseOptions))
    .then(() => {
      retryAttempt = 0;
      console.log('Connected to MongoDB');
      return true;
    })
    .catch((error) => {
      console.error(`MongoDB connection failed: ${error.message}`);
      scheduleReconnect();
      return false;
    })
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
}

export async function waitForDatabase(timeoutMs = 30000) {
  if (isDatabaseConnected()) return true;
  void connectDatabase();
  const deadline = Date.now() + Math.max(0, timeoutMs);
  while (Date.now() < deadline) {
    if (isDatabaseConnected()) return true;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return isDatabaseConnected();
}

export async function stopDatabase() {
  stopping = true;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

mongoose.connection.on('disconnected', () => {
  if (!stopping) scheduleReconnect();
});
