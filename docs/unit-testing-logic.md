# Unit Testing Best Practices

This document outlines best practices for writing unit tests in our codebase.

## General Guidelines

1. **Test Organization**
   - Group related tests using nested `describe` blocks
   - Use clear, descriptive test names that explain the expected behavior
   - Separate test cases by functionality, edge cases, and error conditions

2. **Reduce Duplication**
   - Create helper functions for test setup when constructing similar test objects
   - Use factory functions to create test data with sensible defaults
   - Override only the necessary properties for specific test cases

3. **Test Coverage**
   - Test both happy paths and edge cases
   - Include tests for invalid inputs and error handling
   - Ensure all branches of conditional logic are covered

4. **Test Isolation**
   - Each test should be independent and not rely on the state from other tests
   - Reset any shared state before/after tests
   - Mock external dependencies to isolate the code being tested

5. **Assertion Best Practices**
   - Make assertions specific and targeted
   - For complex objects, test only the relevant properties when appropriate
   - Use specific matchers rather than generic equality checks when possible

## TypeScript-specific Tips

1. **Type Safety**
   - Ensure test objects match the expected interfaces
   - Use type annotations for test data to catch errors at compile time
   - Create strongly-typed test helper functions

2. **Arrange-Act-Assert**
   - Structure tests with clear separation between:
     - Arrangement (setting up test data)
     - Action (calling the function under test)
     - Assertion (verifying the results)

## Example

```typescript
// Helper function to reduce duplication
const createTestItem = (overrides = {}): Item => ({
  id: "default-id",
  name: "Default Name",
  active: true,
  ...overrides
});

describe("itemProcessor", () => {
  describe("happy paths", () => {
    it("should process active items", () => {
      // Arrange
      const item = createTestItem({ active: true });
      
      // Act
      const result = itemProcessor(item);
      
      // Assert
      expect(result.processed).toBe(true);
    });
  });
  
  describe("edge cases", () => {
    it("should handle missing properties", () => {
      const item = createTestItem({ name: undefined });
      const result = itemProcessor(item);
      expect(result.error).toBeUndefined();
    });
  });
});
```

## Parameterized Tests

For testing the same function with multiple inputs and expected outputs, consider using parameterized tests:

```typescript
describe("calculator", () => {
  it.each([
    [1, 1, 2],
    [2, 2, 4],
    [0, 5, 5]
  ])("should add %i and %i to get %i", (a, b, expected) => {
    expect(calculator.add(a, b)).toBe(expected);
  });
});
```

## Mocking

When unit testing components that have dependencies:

```typescript
// Mock the dependency
jest.mock("../services/userService");

// Provide mock implementation
userService.getUser.mockResolvedValue({ id: "123", name: "Test User" });

// Test with the mock
test("should display user name", async () => {
  const result = await userComponent.displayUserInfo("123");
  expect(result).toContain("Test User");
});
``` 