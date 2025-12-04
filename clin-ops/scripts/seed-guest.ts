
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const guestId = 'default-user'
    const guestEmail = 'guest@clinops.demo'

    console.log(`Checking for guest user: ${guestId}...`)

    const existingUser = await prisma.user.findUnique({
        where: { id: guestId }
    })

    if (existingUser) {
        console.log('Guest user already exists.')
        return
    }

    console.log('Creating guest user...')

    // Create a dummy password hash
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash('guest-password-do-not-use', salt)

    await prisma.user.create({
        data: {
            id: guestId,
            email: guestEmail,
            name: 'Guest User',
            passwordHash: passwordHash,
        }
    })

    console.log('Guest user created successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
