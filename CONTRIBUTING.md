# Contributing to Gmail MCP Server

Thank you for your interest in contributing to the Gmail MCP Server! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Adding New Features](#adding-new-features)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions. We welcome contributions from everyone.

### Our Standards

- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/gmail-mcp.git`
3. Navigate to the project: `cd gmail-mcp`
4. Install dependencies: `npm install`

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Google Cloud Platform account with Gmail API access

### Environment Setup

1. Create a Google Cloud Project and enable the Gmail API
2. Create OAuth 2.0 credentials (Desktop app or Web application)
3. Place `gcp-oauth.keys.json` in project root or `~/.gmail-mcp/`
4. Run `npm run auth` to generate credentials

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled server
- `npm run auth` - Authenticate with Gmail API
- `npm run type-check` - Type check without emitting files
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report

## Project Structure

```
gmail-mcp/
├── src/
│   ├── index.ts                    # Entry point
│   ├── server/
│   │   └── mcp-server.ts          # MCP server setup
│   ├── services/                   # Business logic services
│   │   ├── auth.service.ts        # Authentication
│   │   ├── gmail-api.client.ts    # Gmail API wrapper
│   │   ├── email.service.ts       # Email operations
│   │   ├── label.service.ts       # Label management
│   │   └── filter.service.ts      # Filter management
│   ├── builders/
│   │   └── email.builder.ts       # Email message builder
│   ├── tools/
│   │   └── tool-handlers.ts       # MCP tool handlers
│   ├── types/                      # TypeScript types
│   ├── schemas/                    # Zod validation schemas
│   └── utils/                      # Utility functions
├── tests/                          # Test files
├── dist/                           # Compiled output (gitignored)
└── coverage/                       # Test coverage (gitignored)
```

## Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code style guidelines

3. Write or update tests for your changes

4. Ensure all tests pass: `npm run test:run`

5. Ensure type checking passes: `npm run type-check`

6. Update documentation if needed

## Testing

### Writing Tests

- All new features must have corresponding tests
- Tests use Vitest and should be in `tests/` directory
- Mock the Gmail API client to avoid real API calls
- Test both success and error cases

### Test Structure

```typescript
describe('Service Name', () => {
  beforeEach(() => {
    // Setup mocks
  });

  it('should perform operation successfully', async () => {
    // Test implementation
  });

  it('should handle errors gracefully', async () => {
    // Error handling test
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

## Code Style

### TypeScript

- Use strict TypeScript settings (already configured)
- Prefer explicit types over `any`
- Use `async/await` over promises
- Use meaningful variable and function names
- Add JSDoc comments for public methods

### Architecture Principles

- **KISS**: Keep It Simple, Stupid - Simple, straightforward solutions
- **DRY**: Don't Repeat Yourself - Reusable components and utilities
- **Separation of Concerns**: Each service handles a specific domain
- **Single Responsibility**: Each class has one clear purpose
- **Dependency Injection**: Services receive dependencies via constructor

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays
- Maximum line length: 100 characters (soft limit)

## Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions/changes
- `refactor`: Code refactoring
- `chore`: Build/tooling changes

### Examples

```
feat(email): add batch modify emails operation

Add support for modifying labels on multiple emails in batches.

Closes #123
```

```
fix(auth): handle token refresh errors

Properly handle OAuth token refresh failures and provide clear error messages.
```

## Pull Request Process

1. **Set up upstream** (first time only):
   ```bash
   git remote add upstream https://github.com/pouyanafisi/gmail-mcp.git
   ```

2. **Update your branch**: Rebase on latest `main` before submitting
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

3. **Ensure quality**:
   - All tests pass
   - Type checking passes
   - Code follows style guidelines
   - Documentation is updated

4. **Create PR**:
   - Use a clear, descriptive title
   - Provide detailed description of changes
   - Reference related issues
   - Include screenshots/examples if applicable

5. **Respond to feedback**: Address review comments promptly

## Adding New Features

When adding new Gmail API operations:

1. **Add to appropriate service** (e.g., `email.service.ts`):
   ```typescript
   async newOperation(params: NewOperationParams): Promise<Result> {
     // Implementation
   }
   ```

2. **Add Zod schema** to `src/schemas/tool.schemas.ts`:
   ```typescript
   export const NewOperationSchema = z.object({
     // ... fields
   });
   ```

3. **Add tool definition** to `src/tools/tool-handlers.ts`:
   ```typescript
   {
     name: 'new_operation',
     description: 'Description of the operation',
     inputSchema: schemas.NewOperationSchema,
   }
   ```

4. **Add handler** in `handleTool` function:
   ```typescript
   case 'new_operation': {
     const params = schemas.NewOperationSchema.parse(args);
     const result = await emailService.newOperation(params);
     return { content: [{ type: 'text', text: result }] };
   }
   ```

5. **Add tests**:
   ```typescript
   it('should perform new operation', async () => {
     // Test implementation
   });
   ```

6. **Update documentation**:
   - Add to `CLAUDE.md` and `GEMINI.md`
   - Update `README.md` if needed

## Documentation

### Code Documentation

- Add JSDoc comments for public methods
- Document parameters and return types
- Include usage examples for complex operations

### README Updates

- Update `README.md` for significant changes
- Keep setup instructions current
- Document new features

### AI Assistant Guidelines

- Update `CLAUDE.md` and `GEMINI.md` when adding new operations
- Include usage examples and common workflows
- Document error handling patterns

## Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with `main`
- [ ] No console.logs or debug code
- [ ] Error handling is appropriate

## Reporting Issues

Before opening an issue:

1. Check existing issues to avoid duplicates
2. Search closed issues - your issue may have been resolved

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS)
- Error messages or logs
- Minimal reproduction if possible

### Feature Requests

Include:
- Use case and motivation
- Proposed solution (if any)
- Alternatives considered

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be specific and provide reproduction steps for bugs

## Security

If you discover a security vulnerability, please email the maintainer directly rather than opening a public issue. We'll work with you to resolve and disclose the issue appropriately.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

