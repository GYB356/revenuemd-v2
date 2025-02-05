import { createClient } from "redis"

const redisClient = createClient({
  url: process.env.REDIS_URL,
})

redisClient.on("error", (err) => console.log("Redis Client Error", err))

async function connectToRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

export async function getFromRedis(key: string): Promise<string | null> {
  await connectToRedis()
  return redisClient.get(key)
}

export async function setInRedis(key: string, value: string, expirationInSeconds?: number): Promise<void> {
  await connectToRedis()
  if (expirationInSeconds) {
    await redisClient.setEx(key, expirationInSeconds, value)
  } else {
    await redisClient.set(key, value)
  }
}

export async function deleteFromRedis(key: string): Promise<void> {
  await connectToRedis()
  await redisClient.del(key)
}

export default {
  getFromRedis,
  setInRedis,
  deleteFromRedis,
}
