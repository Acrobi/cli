#!/usr/bin/env node
import { program } from "commander";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { execa } from "execa";
import chalk from "chalk";
import { fileURLToPath } from "url";
// --- Static Content for `init` ---
const TAILWIND_CONFIG_CONTENT = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [ './pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', ],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        primary: { DEFAULT: "oklch(var(--primary) / <alpha-value>)", foreground: "oklch(var(--primary-foreground) / <alpha-value>)" },
        secondary: { DEFAULT: "oklch(var(--secondary) / <alpha-value>)", foreground: "oklch(var(--secondary-foreground) / <alpha-value>)" },
        destructive: { DEFAULT: "oklch(var(--destructive) / <alpha-value>)", foreground: "oklch(var(--destructive-foreground) / <alpha-value>)" },
        muted: { DEFAULT: "oklch(var(--muted) / <alpha-value>)", foreground: "oklch(var(--muted-foreground) / <alpha-value>)" },
        accent: { DEFAULT: "oklch(var(--accent) / <alpha-value>)", foreground: "oklch(var(--accent-foreground) / <alpha-value>)" },
        popover: { DEFAULT: "oklch(var(--popover) / <alpha-value>)", foreground: "oklch(var(--popover-foreground) / <alpha-value>)" },
        card: { DEFAULT: "oklch(var(--card) / <alpha-value>)", foreground: "oklch(var(--card-foreground) / <alpha-value>)" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: { "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } }, "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } } },
      animation: { "accordion-down": "accordion-down 0.2s ease-out", "accordion-up": "accordion-up 0.2s ease-out" },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`;
// --- The rest of the CLI logic remains the same. Re-populating for a complete file. ---
async function initCommand() {
    console.log(chalk.bold("Initializing Acrobi Design System..."));
    const config = { registryUrl: "https://raw.githubusercontent.com/brian-porter/acrobi-design-system/main/dist/registry.json", remoteBaseUrl: "https://raw.githubusercontent.com/brian-porter/acrobi-design-system/main/", targetDir: "./src/components/ui", libDir: "./src/lib" };
    await fs.writeFile('acrobi.json', JSON.stringify(config, null, 2));
    console.log(chalk.green("✅ Created config: acrobi.json"));
    const utilsPath = path.join(config.libDir, 'utils.ts');
    await fs.mkdir(path.dirname(utilsPath), { recursive: true });
    await fs.writeFile(utilsPath, `import { type ClassValue, clsx } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n`);
    console.log(chalk.green(`✅ Created helpers: ${utilsPath}`));
    await fs.writeFile("tailwind.config.js", TAILWIND_CONFIG_CONTENT);
    console.log(chalk.green(`✅ Configured Tailwind: tailwind.config.js`));
    const globalsCssPath = path.resolve(process.cwd(), "src/app/globals.css");
    const globalsCssContent = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n/* Import the layerd themes */\n@import "./acrobi-themes.css";`;
    await fs.writeFile(globalsCssPath, globalsCssContent);
    console.log(chalk.green(`✅ Configured base styles: src/app/globals.css`));
    const themeCssPath = path.resolve(process.cwd(), "src/app/acrobi-themes.css");
    const themeCssContent = `/* 1. Import the base theme */\n@import url("https://raw.githubusercontent.com/brian-porter/Acrobi-Design-System/main/src/themes/base.css");\n\n/* 2. Import the Acrobi override theme */\n@import url("https://raw.githubusercontent.com/brian-porter/Acrobi-Design-System/main/src/themes/acrobi.css");`;
    await fs.writeFile(themeCssPath, themeCssContent);
    console.log(chalk.green(`✅ Created theme orchestrator: src/app/acrobi-themes.css`));
    console.log(chalk.bold("\nInstalling required dependencies..."));
    await execa("pnpm", ["add", "tailwindcss-animate"]);
    console.log(chalk.bold("\nProject initialization complete!"));
}
// --- Helper: Load Config ---
async function loadConfig(quiet = false) {
    const currentDir = process.cwd();
    const configPath = path.resolve(currentDir, "acrobi.json");
    // Debug: Show current working directory when not in quiet mode
    if (!quiet) {
        console.log(chalk.gray(`Looking for acrobi.json in: ${currentDir}`));
    }
    try {
        const configContent = await fs.readFile(configPath, "utf-8");
        const config = JSON.parse(configContent);
        if (!quiet) {
            console.log(chalk.gray(`✅ Found configuration at: ${configPath}`));
        }
        return config;
    }
    catch (error) {
        if (error.code === 'ENOENT' && !quiet) {
            console.error(chalk.red(`Configuration file 'acrobi.json' not found in current directory: ${currentDir}`));
            console.error(chalk.yellow("Please run 'acrobi init' to create one in this directory."));
            process.exit(1);
        }
        else if (error.code === 'ENOENT') {
            // Quiet mode - just return null
            return null;
        }
        else {
            // Other errors (like JSON parsing)
            if (!quiet) {
                console.error(chalk.red(`Error reading configuration file: ${error.message}`));
                process.exit(1);
            }
            return null;
        }
    }
}
// --- Command: show ---
async function showCommand(componentName) {
    try {
        const config = await loadConfig();
        if (!config)
            return;
        const registryResponse = await fetch(config.registryUrl);
        const registry = await registryResponse.json();
        const component = registry[componentName];
        if (!component)
            throw new Error(`Component '${componentName}' not found.`);
        console.log(chalk.bold.cyan(`\nComponent: ${component.name}`));
        if (component.usage) {
            console.log(chalk.yellow("\nUsage Example:"));
            console.log(chalk.gray(component.usage));
        }
        console.log(chalk.yellow("\nAvailable Props:"));
        if (Object.keys(component.props).length === 0) {
            console.log("No configurable props found.");
            return;
        }
        const table = Object.values(component.props).map(prop => ({
            Prop: chalk.green(prop.name),
            Type: prop.type,
            Options: prop.options.join(', ') || 'N/A',
            Default: prop.defaultValue,
        }));
        console.table(table);
    }
    catch (error) {
        console.error(`\n${chalk.red('Error:')} ${error.message}`);
        process.exit(1);
    }
}
// --- Command: list ---
async function listCommand() {
    const config = await loadConfig();
    if (!config)
        return;
    console.log(chalk.bold("Fetching available components..."));
    const response = await fetch(config.registryUrl);
    const registry = (await response.json());
    console.log(chalk.green("Available components:"));
    Object.keys(registry).forEach(name => console.log(`- ${name}`));
}
// --- Command: add ---
async function addComponent(componentName, options) {
    try {
        const config = await loadConfig();
        if (!config)
            return;
        const currentDir = process.cwd();
        const targetDir = path.resolve(currentDir, config.targetDir);
        const registryResponse = await fetch(config.registryUrl);
        const registry = (await registryResponse.json());
        const component = registry[componentName];
        if (!component)
            throw new Error(`Component '${componentName}' not found.`);
        console.log(chalk.bold(`Adding component '${componentName}' to: ${targetDir}`));
        await fs.mkdir(targetDir, { recursive: true });
        for (const file of component.files) {
            const remoteUrl = new URL(file, config.remoteBaseUrl).toString();
            const localPath = path.join(targetDir, path.basename(file));
            const fileResponse = await fetch(remoteUrl);
            const fileContent = await fileResponse.text();
            await fs.writeFile(localPath, fileContent);
            console.log(`- ${chalk.green('Created')} ${localPath}`);
        }
        if (component.dependencies.length > 0) {
            console.log(chalk.bold("\nInstalling dependencies..."));
            await execa("pnpm", ["add", ...component.dependencies]);
        }
        console.log(chalk.green(`\n✅ Successfully added '${componentName}'.`));
        if (component.usage) {
            console.log(chalk.yellow("\nUsage example:"));
            console.log(chalk.cyan(component.usage));
        }
    }
    catch (error) {
        console.error(`\n${chalk.red('Error:')} ${error.message}`);
        process.exit(1);
    }
}
// --- Command: add:agents ---
async function addAgentsCommand() {
    try {
        console.log(chalk.bold("🤖 Adding Acrobi Cortex Agents to your project..."));
        // Install @acrobi/cortex package (with local development fallback)
        console.log(chalk.yellow("\n1. Installing @acrobi/cortex package..."));
        try {
            await execa("pnpm", ["add", "@acrobi/cortex"]);
            console.log(chalk.green("✅ @acrobi/cortex installed successfully"));
        }
        catch (installError) {
            if (installError.message.includes('404') || installError.message.includes('Not Found')) {
                console.log(chalk.yellow("⚠️  @acrobi/cortex not found in npm registry (expected for local development)"));
                console.log(chalk.cyan("💡 To install locally, use: pnpm add file:../cortex"));
                console.log(chalk.green("✅ Continuing with agent setup..."));
            }
            else {
                throw installError;
            }
        }
        // Create /agents directory
        console.log(chalk.yellow("\n2. Creating agents directory..."));
        const agentsDir = "./agents";
        await fs.mkdir(agentsDir, { recursive: true });
        console.log(chalk.green(`✅ Created ${agentsDir} directory`));
        // Create example agent file
        console.log(chalk.yellow("\n3. Creating example agent file..."));
        const exampleAgentContent = `/**
 * Example Custom Agent
 *
 * This file demonstrates how to create a custom agent using the @acrobi/cortex base classes.
 * You can modify this file or create new agent files in the /agents directory.
 */

import { Agent, Session } from '@acrobi/cortex';

/**
 * Your custom agent implementation
 */
export class MyCustomAgent extends Agent {
  constructor(session?: Session) {
    super(
      'my-custom-agent',
      'Description of what your agent does',
      session
    );
  }

  /**
   * Main execution method - implement your agent's logic here
   */
  async run(input?: any): Promise<any> {
    this.log('Starting custom agent execution...');

    try {
      // Your agent logic goes here
      // For example:
      // - Process files
      // - Make API calls
      // - Analyze data
      // - Generate content

      const result = {
        success: true,
        message: 'Custom agent executed successfully!',
        timestamp: new Date().toISOString(),
        input
      };

      this.log('Custom agent execution completed successfully');
      return result;

    } catch (error) {
      this.log(\`Error in custom agent: \${error}\`, 'error');
      throw error;
    }
  }

  /**
   * Optional cleanup method
   */
  async cleanup(): Promise<void> {
    this.log('Cleaning up custom agent resources...');
    // Add any cleanup logic here
  }
}

/**
 * Example usage of your custom agent
 */
export async function runMyCustomAgent() {
  // Create a session (optional)
  const session = new Session({
    projectName: 'my-project',
    environment: 'development'
  });

  // Create and run your agent
  const agent = new MyCustomAgent(session);

  try {
    const result = await agent.run({
      // Add any input data your agent needs
      example: 'data'
    });

    console.log('Agent result:', result);

    // Cleanup when done
    await agent.cleanup();

  } catch (error) {
    console.error('Agent execution failed:', error);
    await agent.cleanup();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runMyCustomAgent();
}
`;
        await fs.writeFile(`${agentsDir}/example.agent.ts`, exampleAgentContent);
        console.log(chalk.green(`✅ Created ${agentsDir}/example.agent.ts`));
        // Create README for the agents directory
        const readmeContent = `# Agents Directory

This directory contains your custom Acrobi Cortex agents.

## Getting Started

1. **Example Agent**: Check out \`example.agent.ts\` for a template
2. **Create New Agents**: Copy the example and modify the logic
3. **Import Classes**: Use \`import { Agent, Session } from '@acrobi/cortex'\`
4. **Extend Base Class**: Make your agents extend the \`Agent\` class

## Agent Structure

Every agent should:
- Extend the \`Agent\` base class
- Implement the \`run(input?: any): Promise<any>\` method
- Optionally implement \`cleanup(): Promise<void>\` for resource cleanup
- Use the built-in \`this.log(message, level)\` method for logging

## Available Base Classes

- \`Agent\`: Base class for all agents
- \`Session\`: Context management for agent operations
- \`ClaudeFlowAdapter\`: Integration with Claude Flow for LLM capabilities

## Example Usage

\`\`\`typescript
import { Agent, Session } from '@acrobi/cortex';

class MyAgent extends Agent {
  constructor(session?: Session) {
    super('my-agent', 'Description of my agent', session);
  }

  async run(input?: any): Promise<any> {
    // Your agent logic here
    return { success: true, data: 'result' };
  }
}
\`\`\`

## Documentation

For more detailed information, see the @acrobi/cortex package documentation.
`;
        await fs.writeFile(`${agentsDir}/README.md`, readmeContent);
        console.log(chalk.green(`✅ Created ${agentsDir}/README.md`));
        console.log(chalk.bold.green("\n🎉 Acrobi Cortex Agents setup complete!"));
        console.log(chalk.cyan("\nNext steps:"));
        console.log(`1. Check out the ${agentsDir}/example.agent.ts file`);
        console.log(`2. Read the ${agentsDir}/README.md for guidance`);
        console.log(`3. Create your own custom agents in the ${agentsDir} directory`);
        console.log(chalk.dim("\nTip: Use 'npx ts-node agents/your-agent.ts' to run agents directly"));
    }
    catch (error) {
        console.error(`\n${chalk.red('Error:')} ${error.message}`);
        process.exit(1);
    }
}
// --- Command: add:design-system ---
async function addDesignSystemCommand() {
    try {
        console.log(chalk.bold("🎨 Adding Acrobi Design System to your project..."));
        // Install @acrobi/design-system package
        console.log(chalk.yellow("\n1. Installing @acrobi/design-system package..."));
        try {
            await execa("pnpm", ["add", "@acrobi/design-system"]);
            console.log(chalk.green("✅ @acrobi/design-system installed successfully"));
        }
        catch (installError) {
            if (installError.message.includes('404') || installError.message.includes('Not Found')) {
                console.log(chalk.yellow("⚠️  @acrobi/design-system not found in npm registry (expected for local development)"));
                console.log(chalk.cyan("💡 To install locally, use: pnpm add file:../design-system"));
                console.log(chalk.green("✅ Continuing with design system setup..."));
            }
            else {
                throw installError;
            }
        }
        // Create tailwind.config.js in user's project
        console.log(chalk.yellow("\n2. Creating Tailwind CSS configuration..."));
        const tailwindConfigContent = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-animate')],
  // Import design system theme
  presets: [require('@acrobi/design-system/tailwind.config.js')],
}`;
        await fs.writeFile('tailwind.config.js', tailwindConfigContent);
        console.log(chalk.green("✅ Created tailwind.config.js"));
        // Create styles directory and globals.css
        console.log(chalk.yellow("\n3. Setting up styles..."));
        const stylesDir = './styles';
        await fs.mkdir(stylesDir, { recursive: true });
        const globalsCssContent = `/* Import Acrobi Design System globals */
@import '@acrobi/design-system/src/globals.css';

/* Custom project styles go here */
body {
  /* Your custom styles */
}
`;
        await fs.writeFile(`${stylesDir}/globals.css`, globalsCssContent);
        console.log(chalk.green(`✅ Created ${stylesDir}/globals.css`));
        // Create themes directory and default theme file
        console.log(chalk.yellow("\n4. Creating theming system..."));
        const themesDir = './themes';
        await fs.mkdir(themesDir, { recursive: true });
        const defaultThemeContent = `/**
 * Default Theme Override
 *
 * This file allows you to customize the Acrobi Design System theme.
 * Override the CSS variables defined in the design system globals.css
 */

:root {
  /* Customize primary colors */
  /* --primary: #8b5cf6; */
  /* --primary-foreground: #ffffff; */

  /* Customize background colors */
  /* --background: #ffffff; */
  /* --foreground: #171717; */

  /* Customize accent colors */
  /* --accent: #f3f4f6; */
  /* --accent-foreground: #171717; */

  /* Customize border colors */
  /* --border: #e5e7eb; */
  /* --input: #e5e7eb; */

  /* Customize ring colors */
  /* --ring: #a78bfa; */
}

html.dark {
  /* Customize dark theme colors */
  /* --primary: #c084fc; */
  /* --primary-foreground: #0a0a0a; */

  /* --background: #0a0a0a; */
  /* --foreground: #fafafa; */

  /* --accent: #374151; */
  /* --accent-foreground: #fafafa; */

  /* --border: #374151; */
  /* --input: #374151; */

  /* --ring: #7c3aed; */
}

/* Custom component overrides */
.custom-button {
  /* Example: Custom button styles */
}

/* Layout utilities */
.container-centered {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
`;
        await fs.writeFile(`${themesDir}/default.css`, defaultThemeContent);
        console.log(chalk.green(`✅ Created ${themesDir}/default.css`));
        // Create README for the styles directory
        const stylesReadmeContent = `# Styles and Theming

This directory contains your project's styles and theme customizations.

## File Structure

### \`styles/globals.css\`
- Imports the Acrobi Design System base styles
- Add your global styles here

### \`themes/default.css\`
- Customize the design system theme by overriding CSS variables
- Supports both light and dark themes
- Uncomment and modify variables to customize colors

## Theme Customization

### Primary Colors
\`\`\`css
:root {
  --primary: #8b5cf6;        /* Light mode primary */
  --primary-foreground: #ffffff;
}

html.dark {
  --primary: #c084fc;        /* Dark mode primary */
  --primary-foreground: #0a0a0a;
}
\`\`\`

### Background Colors
\`\`\`css
:root {
  --background: #ffffff;     /* Light mode background */
  --foreground: #171717;
}

html.dark {
  --background: #0a0a0a;     /* Dark mode background */
  --foreground: #fafafa;
}
\`\`\`

## Using the Design System

### Import Components
\`\`\`tsx
import { Button } from '@acrobi/design-system/components/Button';

function MyComponent() {
  return (
    <Button variant="default" size="lg">
      Click me
    </Button>
  );
}
\`\`\`

### Theme Classes
Use Tailwind utility classes with semantic tokens:
- \`bg-primary\` - Primary background
- \`text-foreground\` - Primary text
- \`border-border\` - Border color
- \`bg-muted\` - Muted background

## Available Variables

See the Acrobi Design System documentation for all available CSS variables.
`;
        await fs.writeFile(`${stylesDir}/README.md`, stylesReadmeContent);
        console.log(chalk.green(`✅ Created ${stylesDir}/README.md`));
        console.log(chalk.bold.green("\n🎉 Acrobi Design System setup complete!"));
        console.log(chalk.cyan("\nNext steps:"));
        console.log("1. Import components from @acrobi/design-system");
        console.log("2. Customize themes in themes/default.css");
        console.log("3. Use Tailwind utility classes with semantic tokens");
        console.log(chalk.dim("\nExample usage:"));
        console.log(chalk.dim("import { Button } from '@acrobi/design-system/components/Button';"));
        console.log(chalk.dim("<Button variant='primary'>Click me</Button>"));
    }
    catch (error) {
        console.error(`\n${chalk.red('Error:')} ${error.message}`);
        process.exit(1);
    }
}
// --- Command: connect ---
async function connectCommand(options) {
    try {
        const url = options.url;
        if (!url) {
            console.error(chalk.red('Error: URL is required'));
            console.error(chalk.yellow('Usage: acrobi connect --url=<theme-server-url>'));
            console.error(chalk.yellow('Example: acrobi connect --url=http://localhost:3000/api/themes/default.css'));
            process.exit(1);
        }
        console.log(chalk.bold("🔗 Connecting to Acrobi Theme Server..."));
        // Validate URL format
        try {
            new URL(url);
        }
        catch {
            console.error(chalk.red('Error: Invalid URL format'));
            process.exit(1);
        }
        // Create acrobi.config.json
        console.log(chalk.yellow(`\n1. Creating configuration file...`));
        const config = {
            themeUrl: url,
            connectedAt: new Date().toISOString(),
            version: '1.0.0'
        };
        await fs.writeFile('acrobi.config.json', JSON.stringify(config, null, 2));
        console.log(chalk.green("✅ Created acrobi.config.json"));
        console.log(chalk.bold.green("\n🎉 Successfully connected to Acrobi Theme Server!"));
        console.log(chalk.cyan("\nConfiguration:"));
        console.log(`- Theme URL: ${url}`);
        console.log(`- Config file: acrobi.config.json`);
        console.log(chalk.dim("\nNext steps:"));
        console.log("1. Wrap your app in the ThemeProvider component");
        console.log("2. The theme URL will be automatically loaded from acrobi.config.json");
    }
    catch (error) {
        console.error(`\n${chalk.red('Error:')} ${error.message}`);
        process.exit(1);
    }
}
// --- Command: run ---
async function runCommand(task, options) {
    try {
        // Validate engine option
        const engine = options.engine || 'legacy';
        if (!['legacy', 'native'].includes(engine)) {
            console.error(chalk.red(`Error: Invalid engine "${engine}". Valid options are: legacy, native`));
            process.exit(1);
        }
        console.log(chalk.bold(`🚀 Running Acrobi task: "${task}"`));
        console.log(chalk.dim(`🔧 Using engine: ${engine.toUpperCase()}`));
        // Import the Cortex runtime
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const cortexPath = path.resolve(__dirname, '../cortex');
        let Agent, Session, Orchestrator, NativeSessionManager;
        try {
            // Try to import from local cortex
            const cortexModule = await import(`${cortexPath}/dist/index.js`);
            Agent = cortexModule.Agent;
            Session = cortexModule.Session;
            NativeSessionManager = cortexModule.NativeSessionManager;
            Orchestrator = cortexModule.Orchestrator;
        }
        catch (importError) {
            // Fallback to package installation
            try {
                const cortexPackage = await import('@acrobi/cortex');
                Agent = cortexPackage.Agent;
                Session = cortexPackage.Session;
                Orchestrator = cortexPackage.Orchestrator;
            }
            catch (packageError) {
                console.error(chalk.red('❌ Cortex runtime not found'));
                console.log(chalk.yellow('💡 Install it locally: npm install file:../cortex'));
                console.log(chalk.yellow('💡 Or install from npm: npm install @acrobi/cortex'));
                process.exit(1);
            }
        }
        // Initialize dynamic tool loading
        let initializeTools;
        try {
            const { initializeTools: initTools } = await import(`${cortexPath}/dist/tools/dynamic-tool-loader.js`);
            initializeTools = initTools;
        }
        catch (toolError) {
            try {
                const { initializeTools: initTools } = await import('@acrobi/cortex/dist/tools/dynamic-tool-loader.js');
                initializeTools = initTools;
            }
            catch (packageToolError) {
                console.warn(chalk.yellow('⚠️  Dynamic tool loading not available'));
                initializeTools = null;
            }
        }
        console.log(chalk.blue('🔧 Initializing Cortex runtime...'));
        const startTime = Date.now();
        // Initialize tools if available
        let loadedTools = new Map();
        if (initializeTools) {
            console.log(chalk.blue('🛠️  Loading dynamic tools...'));
            loadedTools = await initializeTools(process.cwd());
            if (options.verbose) {
                console.log(chalk.dim(`Found ${loadedTools.size} tool(s):`));
                for (const [name, tool] of loadedTools) {
                    console.log(chalk.dim(`  - ${name}: ${tool.definition.description}`));
                }
            }
        }
        let result;
        // Execute task based on engine choice
        if (engine === 'native') {
            console.log(chalk.blue('🚀 Using Native Engine with Anthropic SDK'));
            if (!NativeSessionManager) {
                throw new Error('NativeSessionManager not available - please ensure @acrobi/cortex is properly installed');
            }
            const nativeSessionManager = new NativeSessionManager();
            // Prepare tools for native session
            const tools = [];
            for (const [name, tool] of loadedTools) {
                tools.push({
                    name,
                    description: tool.definition.description,
                    code: tool.definition.code || tool.definition.input_schema?.description || '',
                    execute: tool.execute.bind(tool)
                });
            }
            // Create native session
            const sessionId = await nativeSessionManager.createSession({
                tools,
                metadata: {
                    projectName: path.basename(process.cwd()),
                    environment: 'local',
                    workingDirectory: process.cwd(),
                    engine: 'native'
                }
            });
            console.log(chalk.dim(`Created native session: ${sessionId}`));
            try {
                // Send task to native session
                const response = await nativeSessionManager.sendMessage(sessionId, task, {
                    system: `You are a local task execution assistant. Execute the given task to the best of your ability.`
                });
                result = {
                    success: true,
                    message: 'Task completed with native engine',
                    response: response.content
                };
                if (options.verbose && response.toolUse && response.toolUse.length > 0) {
                    console.log(chalk.dim(`Tools used: ${response.toolUse.map((t) => t.name).join(', ')}`));
                }
            }
            finally {
                // Clean up native session
                await nativeSessionManager.deactivateSession(sessionId);
                console.log(chalk.dim('Native session deactivated'));
            }
        }
        else {
            console.log(chalk.blue('🔄 Using Legacy Engine'));
            // Legacy engine execution
            const session = new Session({
                projectName: path.basename(process.cwd()),
                environment: 'local',
                workingDirectory: process.cwd()
            });
            // Create a simple execution agent
            class LocalExecutorAgent extends Agent {
                constructor(session) {
                    super('local-executor', 'Local task execution agent', session);
                }
                async run(input) {
                    this.log('Starting local task execution...');
                    try {
                        // Parse the task to understand what tools to use
                        const taskLower = task.toLowerCase();
                        let result = { success: true, message: 'Task completed successfully' };
                        // Check if task involves Playwright
                        if (taskLower.includes('playwright') || taskLower.includes('browser') || taskLower.includes('title of')) {
                            const playwrightTool = loadedTools.get('PlaywrightBrowser');
                            if (playwrightTool) {
                                this.log('Using Playwright browser tool...');
                                // Extract URL from task (simple pattern matching)
                                const urlMatch = task.match(/(?:title of|visit|go to|navigate to)\s+([^\s]+)/i);
                                if (urlMatch) {
                                    const url = urlMatch[1];
                                    this.log(`Navigating to: ${url}`);
                                    // Navigate to the URL
                                    const navResult = await playwrightTool.definition.execute({
                                        action: 'goto',
                                        url: url.startsWith('http') ? url : `https://${url}`
                                    });
                                    if (navResult.success) {
                                        this.log('Getting page title...');
                                        // Get the page title
                                        const titleResult = await playwrightTool.definition.execute({
                                            action: 'title'
                                        });
                                        if (titleResult.success) {
                                            result = {
                                                success: true,
                                                title: titleResult.data,
                                                message: `Page title: ${titleResult.data}`
                                            };
                                            // Cleanup the browser tool
                                            if (playwrightTool.definition.cleanup) {
                                                await playwrightTool.definition.cleanup();
                                            }
                                        }
                                        else {
                                            result = { success: false, error: titleResult.error };
                                        }
                                    }
                                    else {
                                        result = { success: false, error: navResult.error };
                                    }
                                }
                                else {
                                    result = { success: false, error: 'Could not extract URL from task' };
                                }
                            }
                            else {
                                result = { success: false, error: 'Playwright tool not found. Install it with: npm install @acrobi/tool-playwright' };
                            }
                        }
                        else {
                            // Generic task execution
                            this.log(`Executing task: ${task}`);
                            // Simulate task execution for non-tool-specific tasks
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            result = {
                                success: true,
                                message: `Task "${task}" completed successfully (simulated execution)`,
                                note: 'This is a simulated result. For actual automation, install specific tool packages.'
                            };
                        }
                        this.log('Task execution completed');
                        return result;
                    }
                    catch (error) {
                        this.log(`Error in task execution: ${error}`, 'error');
                        throw error;
                    }
                }
            }
            // Create and run the legacy agent
            console.log(chalk.blue('🤖 Creating local executor agent...'));
            const agent = new LocalExecutorAgent(session);
            console.log(chalk.blue('⚡ Executing task...'));
            result = await agent.run({ task });
            // Cleanup legacy session
            await agent.cleanup();
        }
        const duration = Date.now() - startTime;
        // Display results
        console.log(chalk.green('\n✅ Task Execution Complete!'));
        console.log(chalk.dim(`Duration: ${duration}ms`));
        if (result.success) {
            console.log(chalk.green('📊 Result:'));
            if (result.title) {
                console.log(chalk.white(`   Title: "${result.title}"`));
            }
            if (result.message) {
                console.log(chalk.white(`   Message: ${result.message}`));
            }
            if (result.response) {
                console.log(chalk.white(`   Response: ${result.response}`));
            }
            if (result.note) {
                console.log(chalk.dim(`   Note: ${result.note}`));
            }
        }
        else {
            console.log(chalk.red('❌ Error:'));
            console.log(chalk.red(`   ${result.error}`));
            process.exit(1);
        }
        console.log(chalk.green('\n🎉 Task completed successfully!'));
    }
    catch (error) {
        console.error(`\n${chalk.red('Error:')} ${error.message}`);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}
// --- Commander Program ---
program.name("acrobi-cli").description("AI-first CLI for the Acrobi Design System").version("1.0.0");
program.command("init").description("Configure your project for Acrobi").action(initCommand);
program.command("show").description("Show details and props for a component").argument("<component>", "component name").action(showCommand);
program.command("list").description("List all available components").action(listCommand);
program.command("add").description("Add a component to your project").argument("<component>", "component name").option("-d, --dry-run", "Preview what would be added without making changes").action(addComponent);
program.command("add:agents").description("Add Acrobi Cortex agents to your project").action(addAgentsCommand);
program.command("add:design-system").description("Add Acrobi Design System to your project").action(addDesignSystemCommand);
program.command("connect").description("Connect to Acrobi Theme Server").option("--url <url>", "Theme server URL").action(connectCommand);
program.command("run").description("Run an Acrobi task locally").argument("<task>", "Task to execute").option("-v, --verbose", "Enable verbose logging").option("-e, --engine <engine>", "Specify the execution engine (legacy|native)", "legacy").action(runCommand);
program.parse();
