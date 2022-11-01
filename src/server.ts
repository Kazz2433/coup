import Fastify from "fastify";


async function bootstrao() {
    const fastify = Fastify({
        logger:true
    })
    
    fastify.get('/pools/count', () => {
        return {count:28176278162}
    }) 
    
    await fastify.listen({port:3333})
}

bootstrao()