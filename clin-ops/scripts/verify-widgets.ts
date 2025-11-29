import { prisma } from '../lib/prisma';

async function main() {
    try {
        console.log('Verifying widgets in database...');
        const count = await prisma.dashboardWidget.count();
        console.log(`Total widgets in database: ${count}`);

        const widgets = await prisma.dashboardWidget.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        console.log('Recent widgets:');
        widgets.forEach(w => {
            console.log(`- [${w.widgetType}] ${w.title} (Tab: ${w.tabType})`);
        });

    } catch (error) {
        console.error('Error verifying widgets:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
