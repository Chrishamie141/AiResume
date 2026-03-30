import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => console.error("Redis Client Error", err));

export const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
  }
};

export const getCache = async (key: string) => {
  await connectRedis();
  return client.get(key);
};

export const setCache = async (key: string, value: string, ttl?: number) => {
  await connectRedis();
  if (ttl) {
    await client.set(key, value, { EX: ttl });
  } else {
    await client.set(key, value);
  }
};

export default client;
