import { FastifyInstance } from "fastify"
import ShortUniqueId from "short-unique-id"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"


export async function poolRoutes(fastify:FastifyInstance){
    //COUNTING POOLS
    fastify.get('/pools/count', async () => {
        const count = await prisma.pool.count()

        return {count}
    }) 

    //CREATING POOLS
    fastify.post('/pools', async (req,res) => {
        const createPoolBody = z.object({
            title:z.string(),
        })
        
        const {title} = createPoolBody.parse(req.body)

        const generate = new ShortUniqueId({length:6})
        const code = String(generate()).toUpperCase()

        //CREATE POOL MOBILE
        try{
            await req.jwtVerify()

            await prisma.pool.create({
                data:{
                    title,
                    code,
                    ownerId:req.user.sub,

                    participants:{
                        create:{
                            userId:req.user.sub
                        }
                    }
                }
            })
        //CREATE POOL WEB
        } catch {
            await prisma.pool.create({
                data:{
                    title,
                    code,
                }
            })
        }

        return res.status(201).send({code})
    }) 
    
    //JOINING POOLS
    fastify.post('/pools/:id/join',{
        onRequest:[authenticate]
    },async(req,res) => {
         const joinPoolBody = z.object({
            code:z.string()
         })

         const {code} = joinPoolBody.parse(req.body)

         //CREATING A POOL WHERE USER.SUB IS INCLUDED
         const pool = await prisma.pool.findUnique({
            where:{
                code,
            },
            include:{
                participants:{
                    where:{
                        userId:req.user.sub
                    }
                }
            }
         })

         //IF THERE IS NO POOL CODE, THROW A ERROR
         if(!pool){
            return res.status(400).send({
                message:'Pool not found.'
            })
         }

         //THROW THIS IF USER IS ALREADY IN
         if(pool.participants.length > 0){
            return res.status(400).send({
                message:'You are already in this pool'
            })
         }

         //IF POOL THERE IS NO OWNER WHO GET IN FIRST WILL BE
         if(!pool.ownerId){
            await prisma.pool.update({
                where:{
                    id:pool.id,
                },
                data:{
                    ownerId:req.user.sub
                }
            })
         }

         //JOINING IN A POOL
         await prisma.participant.create({
            data:{
                poolId:pool.id,
                userId:req.user.sub
            }
         })

         return res.status(201).send()
    })

    fastify.get('/pools',{
        onRequest: [authenticate]
    },async (req) => {
        const pools = await prisma.pool.findMany({
            where:{
                participants:{
                    some:{
                        userId: req.user.sub
                    }
                }
            },
            include:{
                _count:{
                    select:{
                        participants:true
                    }
                },
                participants:{
                    select:{
                        id:true,

                        user:{
                            select:{
                                avatarUrl:true
                            }
                        }
                    },
                    take:4 
                },
                owner:{
                    select:{
                        id:true,
                        name:true
                    }
                }
            }
        })
    })
}


