# Pull Request Review Guide for Claude Code

This guide provides optimal prompting strategies for conducting thorough and effective code reviews using Claude Code.

## Table of Contents
- [Comprehensive Review Prompt](#comprehensive-review-prompt)
- [Focused Review Prompts](#focused-review-prompts)
- [Context-Specific Prompts](#context-specific-prompts)
- [Best Practices](#best-practices)
- [Example Comprehensive Prompt](#example-comprehensive-prompt)
- [Follow-up Questions](#follow-up-questions)

## Comprehensive Review Prompt

Use this as your go-to prompt for thorough PR reviews:

```
Please review this pull request thoroughly. Focus on:

- Code quality and best practices
- TypeScript type safety and error handling
- Security vulnerabilities or potential issues
- Performance implications
- Testing coverage and edge cases
- Architecture and design patterns
- Documentation and code clarity
- Breaking changes or API compatibility

Provide specific feedback with line numbers where applicable, suggest improvements, and highlight both strengths and areas for improvement.
```

## Focused Review Prompts

### Security Review
```
Review this PR with a focus on security. Look for:
- Authentication/authorization issues
- Input validation and sanitization
- SQL injection or XSS vulnerabilities
- Secrets or sensitive data exposure
- CORS and API security
- Rate limiting and abuse prevention
```

### Performance Review
```
Analyze this PR for performance impacts:
- Database query efficiency
- Memory usage and potential leaks
- Bundle size implications
- Caching strategies
- Async/await patterns and race conditions
- React rendering optimizations
```

### TypeScript Quality Review
```
Focus on TypeScript quality in this PR:
- Type safety and proper typing
- Interface consistency
- Null safety and error handling
- Generic usage and type constraints
- Any type usage (should be avoided)
- Type inference vs explicit typing
```

## Context-Specific Prompts

### New Feature Review
```
This PR introduces [feature name]. Please review for:
- Feature completeness and user experience
- Error handling and edge cases
- Integration with existing systems
- Backwards compatibility
- Testing strategy and coverage
- Documentation updates needed
```

### Bug Fix Review
```
This PR fixes [issue description]. Please verify:
- The root cause is properly addressed
- No regression risks introduced
- Edge cases are handled
- Similar issues elsewhere in codebase
- Testing validates the fix
```

### Refactoring Review
```
This PR refactors [component/module]. Please check:
- Code organization improvements
- Maintained functionality and behavior
- Reduced complexity and improved readability
- No performance regressions
- Updated tests and documentation
```

## Best Practices

### 1. Be Specific About Context
- Include the GitHub PR URL if available
- Mention the type of application (React, Next.js, API, etc.)
- Specify any particular concerns or focus areas
- Provide background on the change purpose

### 2. Request Structured Output
```
Please organize your review into:
1. Summary of changes
2. Critical issues (must fix)
3. Suggestions (should consider)
4. Nitpicks (nice to have)
5. Positive highlights
```

### 3. Ask for Actionable Feedback
```
For each issue found, please provide:
- Specific file and line number
- Clear description of the problem
- Suggested solution or improvement
- Severity level (critical/moderate/minor)
```

### 4. Consider Multiple Perspectives
- **Developer Experience**: Is the code easy to understand and maintain?
- **End User Impact**: How do changes affect performance and functionality?
- **Team Standards**: Does it follow established patterns and conventions?
- **Future Maintenance**: Will this be easy to modify and extend?

## Example Comprehensive Prompt

```
Please conduct a thorough code review of this pull request. I'm particularly interested in:

TECHNICAL REVIEW:
- TypeScript type safety and proper error handling
- React best practices and performance considerations
- Database query efficiency and security
- API design and error responses
- Testing coverage for new/modified code

ARCHITECTURAL REVIEW:
- Code organization and maintainability
- Separation of concerns
- Reusability and DRY principles
- Integration with existing patterns

SECURITY & QUALITY:
- Input validation and sanitization
- Authentication/authorization checks
- Potential security vulnerabilities
- Code clarity and documentation

Please provide specific feedback with file locations, categorize issues by severity, and suggest concrete improvements. Also highlight any particularly well-written code or good practices you notice.
```

## Follow-up Questions

After the initial review, consider asking:

### Pattern Analysis
- "Are there any patterns in this codebase that could be improved?"
- "Do you see any opportunities for consolidating similar code?"
- "Are there any anti-patterns that should be addressed?"

### Risk Assessment
- "What are the biggest risks with these changes?"
- "Are there any potential breaking changes I should be aware of?"
- "What could go wrong in production with these changes?"

### Enhancement Suggestions
- "How could the testing strategy be enhanced?"
- "Are there any performance optimizations you'd recommend?"
- "What documentation updates would improve this change?"

### Code Quality
- "Are there any areas where error handling could be improved?"
- "Do you see opportunities for better TypeScript typing?"
- "Are there any accessibility considerations?"

## Templates by Change Type

### Database Changes
```
This PR modifies database schemas/queries. Please review for:
- Migration safety and rollback strategy
- Query performance and indexing
- Data integrity and constraints
- Backwards compatibility
- Transaction handling
```

### UI/UX Changes
```
This PR updates user interface components. Please check:
- Accessibility compliance (ARIA, keyboard navigation)
- Responsive design across devices
- Performance impact on rendering
- User experience consistency
- Error states and loading states
```

### API Changes
```
This PR modifies API endpoints. Please verify:
- Request/response schema validation
- Error handling and status codes
- Authentication and authorization
- Rate limiting and security
- API documentation updates
- Backwards compatibility
```

## Tips for Effective Reviews

1. **Start with the big picture**: Understand the overall change before diving into details
2. **Focus on impact**: Prioritize issues that affect security, performance, or user experience
3. **Be constructive**: Suggest solutions, not just problems
4. **Consider maintainability**: Will future developers understand this code?
5. **Check for consistency**: Does it follow established patterns in the codebase?
6. **Verify testing**: Are the changes adequately tested?
7. **Think about edge cases**: What could go wrong?

Remember: The goal is to improve code quality, catch potential issues, and maintain consistent standards while being constructive and helpful to the development team.