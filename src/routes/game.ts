import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"


export async function gameRoutes(fastify:FastifyInstance){
    
    //GAME COUNTER
    fastify.get('/game/count', async () => {
        const count = await prisma.game.count()

        return {count}
    }) 

    //LIST GAMES WITHIN A POOL
    fastify.get('/pools/:id/games',{
        onRequest:[authenticate],
    },async (req) => {
        const getPoolParams = z.object({
            id:z.string()
        })

        //taking an id to make sure user dont make two guesses at the same pool
        const {id} = getPoolParams.parse(req.params)


        const games = await prisma.game.findMany({
            orderBy:{
                date:'desc'
            },
            include:{
                guesses:{
                    where:{
                        participant:{
                            userId:req.user.sub,
                            poolId:id
                        }
                    }
                }
            }
        })

        //returning just one guess from a user
        return {
            games: games.map(game => {
                return {
                    ...game,
                    guess: game.guesses.length > 0 ? game.guesses[0] : null,
                    guesses:undefined
                }
            })
        }
    })
}


