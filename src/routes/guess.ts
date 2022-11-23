import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"


export async function guessRoutes(fastify:FastifyInstance){
    
    //GUESS COUNTER
    fastify.get('/guess/count', async () => {
        const count = await prisma.guess.count()

        return {count}
    }) 

    //CREATING A GUESS
    fastify.post('/pools/:poolId/games/:gameId/guesses',{
        onRequest:[authenticate]
    },async (req,res) => {
        const createGuessParams = z.object({
            poolId:z.string(),
            gameId:z.string(),
        })

        const createGuessBody = z.object({
            firstTeamPoints: z.number(),
            secondTeamPoints:z.number()
        })

        const {poolId,gameId} = createGuessParams.parse(req.params)
        const {firstTeamPoints,secondTeamPoints} = createGuessBody.parse(req.body)

        const participant = await prisma.participant.findUnique({
            where:{
                userId_poolId:{
                    poolId,
                    userId:req.user.sub
                }
            }
        })

        // verifying if participant is alrealdy in a pool
        if (!participant){
            return res.status(400).send({
                message:"You are note allowed to create a guees in this pool"
            })
        }

        const guess = await prisma.guess.findUnique({
            where:{
                participantId_gameId:{
                    participantId:participant.id,
                    gameId
                }
            }
        })    

        // verifying if participant is alrealdy sent a guess to this pool
        if (guess){
            return res.status(400).send({
                message:"You already sent a guess to this game on this pool."
            })
        }

        const game = await prisma.game.findUnique({
            where:{
                id:gameId
            }
        })

        if (!game){
            return res.status(400).send({
                message:"Game not Found"
            })
        }

        // not allowing a user send a guess after the game has begun
        if (game.date < new Date()){
            return res.status(400).send({
                message:"You cannot send guesses after the game has begun"
            })
        }

        // creating a guees with participants and points team
        await prisma.guess.create({
            data:{
                gameId,
                participantId:participant.id,
                firstTeamPoints,
                secondTeamPoints
            }
        })

        return res.status(201).send()

    })
}


