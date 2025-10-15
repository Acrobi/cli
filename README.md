# @acrobi/cli

The official CLI for the Acrobi agent system - powerful swarm coordination and local task execution.

## Installation

```bash
npm install -g @acrobi/cli
```

## Features

- 🚀 **Powerful Swarm Coordination** - Execute complex multi-agent workflows
- 🤖 **Local Task Execution** - Run agents directly on your machine
- 📊 **Real-time Monitoring** - Track agent progress and performance
- 🔧 **Session Management** - Persistent task sessions with memory
- 🎯 **Native GLM-4.6 Integration** - Advanced AI model for superior performance

## Quick Start

```bash
# Initialize a new project
acrobi init my-project

# Execute a task
acrobi run "Build a REST API with authentication"

# Monitor active sessions
acrobi status

# View detailed logs
acrobi logs --follow
```

## Configuration

Configure your CLI by setting up environment variables:

```bash
export ANTHROPIC_AUTH_TOKEN="your-token-here"
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
export ANTHROPIC_MODEL="glm-4.6"
```

## Commands

### `acrobi init [name]`
Initialize a new Acrobi project directory with configuration files.

### `acrobi run <task>`
Execute a task using the native Acrobi multi-agent system.

### `acrobi status`
Show current session status and active agents.

### `acrobi logs [options]`
View execution logs and agent messages.

### `acrobi session <id>`
Interact with a specific session.

### `acrobi config <key> <value>`
Set configuration parameters.

## Examples

```bash
# Create a web application
acrobi run "Create a React application with TypeScript and Tailwind CSS"

# Analyze code quality
acrobi run "Analyze the codebase in ./src for security vulnerabilities"

# Generate documentation
acrobi run "Generate comprehensive API documentation for the backend"

# Run tests and fix issues
acrobi run "Run the test suite and fix any failing tests"
```

## Configuration File

Create an `acrobi.config.json` in your project root:

```json
{
  "model": "glm-4.6",
  "maxTokens": 4000,
  "temperature": 0.7,
  "timeout": 300000,
  "workspace": "./workspace",
  "memory": {
    "enabled": true,
    "persist": true
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_AUTH_TOKEN` | Your API token for GLM models | Required |
| `ANTHROPIC_BASE_URL` | API base URL | `https://api.z.ai/api/anthropic` |
| `ANTHROPIC_MODEL` | Default model to use | `glm-4.6` |
| `ACROBI_WORKSPACE` | Default workspace directory | `./workspace` |

## Advanced Usage

### Custom Prompts

```bash
acrobi run "Task description" --system "Custom system prompt"
```

### Session Management

```bash
# List all sessions
acrobi session list

# Resume a session
acrobi session resume <session-id>

# Delete a session
acrobi session delete <session-id>
```

### Performance Monitoring

```bash
# Enable performance monitoring
acrobi run "Task" --monitor

# View performance metrics
acrobi metrics
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure your `ANTHROPIC_AUTH_TOKEN` is valid
2. **Model Not Available**: Check that GLM-4.6 is accessible in your region
3. **Timeout Issues**: Increase the timeout value in configuration

### Debug Mode

Enable debug logging:

```bash
export DEBUG=acrobi:*
acrobi run "Your task"
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Acrobi](https://github.com/Acrobi)

## Support

- 📖 [Documentation](https://github.com/Acrobi/cli#readme)
- 🐛 [Issues](https://github.com/Acrobi/cli/issues)
- 💬 [Discussions](https://github.com/Acrobi/cli/discussions)