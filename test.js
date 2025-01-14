const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main(){
    const user = await prisma.session.findMany({
        
    })

    console.log(user)
}

main()
    .catch(err => {
        console.log(err)
    }).finally(async() => {
        await prisma.$disconnect()
    })