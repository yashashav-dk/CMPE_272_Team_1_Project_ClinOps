import { generateWidgetsFromFile } from '../services/widget-generator';
import * as path from 'path';
import { prisma } from '../lib/prisma';

async function main() {
    const inputPath = path.resolve(__dirname, '../../LLMResponses.txt');
    const outputPath = path.resolve(__dirname, '../../WidgetResponses.json');

    try {
        console.log('Generating widgets...');
        const result = await generateWidgetsFromFile(inputPath, outputPath);

        if (result.dbWidgets && result.dbWidgets.length > 0) {
            console.log(`Saving ${result.dbWidgets.length} widgets to database...`);

            // Optional: Clear existing widgets for this project/source if needed
            // For now, we just append/create

            let savedCount = 0;
            for (const widget of result.dbWidgets) {
                try {
                    await prisma.dashboardWidget.create({
                        data: widget
                    });
                    savedCount++;
                } catch (dbError) {
                    console.error(`Failed to save widget ${widget.title}:`, dbError);
                }
            }
            console.log(`Successfully saved ${savedCount} widgets to database.`);
        } else {
            console.log('No database-ready widgets found to save.');
        }

        console.log('Done!');
    } catch (error) {
        console.error('Failed to generate widgets:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
