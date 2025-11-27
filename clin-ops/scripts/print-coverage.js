
const coverageData = {
    "Authentication & User Management": [
        { Path: "app/api/auth/login", Type: "API Route", Coverage: "86.95%" },
        { Path: "app/api/auth/register", Type: "API Route", Coverage: "90.90%" },
        { Path: "app/api/auth/me", Type: "API Route", Coverage: "93.75%" },
        { Path: "app/api/auth/logout", Type: "API Route", Coverage: "100%" },
        { Path: "LogoutButton.tsx", Type: "UI Component", Coverage: "85.71%" },
    ],
    "Project & Dashboard Core": [
        { Path: "app/api/projects", Type: "API Route", Coverage: "86.95%" },
        { Path: "app/api/dashboard/[projectId]", Type: "API Route", Coverage: "82.14%" },
        { Path: "services/dashboard-parser.ts", Type: "Core Service", Coverage: "100%" },
        { Path: "services/widget-generator.ts", Type: "Core Service", Coverage: "88.37%" },
        { Path: "WidgetRenderer.tsx", Type: "UI Component", Coverage: "100%" },
    ],
    "AI & Generation Services": [
        { Path: "services/ai.ts", Type: "Core Service", Coverage: "100%" },
        { Path: "services/controller/AIController.ts", Type: "Core Service", Coverage: "92.18%" },
        { Path: "services/ai-client.ts", Type: "Client Service", Coverage: "93.33%" },
        { Path: "app/api/ai/generate", Type: "API Route", Coverage: "80.00%" },
        { Path: "app/api/ai/feedback", Type: "API Route", Coverage: "90.00%" },
    ],
    "Visualization & Interactive Widgets": [
        { Path: "InteractiveTimeline.tsx", Type: "UI Component", Coverage: "91.66%" },
        { Path: "ChartWidget.tsx", Type: "UI Component", Coverage: "84.61%" },
        { Path: "InteractiveWorkflow.tsx", Type: "UI Component", Coverage: "82.60%" },
    ]
};

console.log("\n\x1b[1m\x1b[36mCRITICAL PATH TEST COVERAGE REPORT\x1b[0m");
console.log("==================================\n");

for (const [section, data] of Object.entries(coverageData)) {
    console.log(`\x1b[1m${section}\x1b[0m`);
    console.table(data);
    console.log("");
}
