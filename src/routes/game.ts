import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"


export async function gameRoutes(fastify:FastifyInstance){
    fastify.get('/game/count', async () => {
        const count = await prisma.game.count()

        return {count}
    }) 
}


