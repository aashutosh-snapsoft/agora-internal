1. When creating new storybook files, use the storybook CLI.

2. When adding storybook files to an existing component, consider the template found in `src/templates/components`.

# Storybook Testing Guide

## Setting up Redux in Storybook Components

When creating Storybook stories for components that use Redux, you need to wrap them with the Redux Provider. Here's how to do it:

1. Import the necessary dependencies:
```typescript
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ThemeProvider from "@/external/essence/theme";
```

2. Create a mock store with the required reducers:
```typescript
const mockStore = configureStore({
  reducer: {
    // Add your reducers here
    financial_modeling: (state = {}) => state,
    project: (state = {}) => state,
    // ... other reducers
  },
  preloadedState: {
    // Add initial state if needed
  }
});
```

3. Create a decorator to wrap your stories:
```typescript
const withProviders = (Story: any) => (
  <Provider store={mockStore}>
    <ThemeProvider>
      <Story />
    </ThemeProvider>
  </Provider>
);
```

4. Add the decorator to your story's meta:
```typescript
const meta: Meta<typeof YourComponent> = {
  title: "Components/YourComponent",
  component: YourComponent,
  decorators: [withProviders, withRouter, withApollo({})], // Add other decorators as needed
};
```

### Common Errors

#### "Error: could not find react-redux context value; please ensure the component is wrapped in a <Provider>"

This error occurs when a component that uses Redux is not wrapped in a Redux Provider. To fix this:

1. Make sure you've imported the Provider from react-redux
2. Create a mock store with the required reducers
3. Wrap your component with the Provider using a decorator
4. Add the decorator to your story's meta configuration

Example of a complete setup:
```typescript
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ThemeProvider from "@/external/essence/theme";

const mockStore = configureStore({
  reducer: {
    // Add your reducers here
    financial_modeling: (state = {}) => state,
    project: (state = {}) => state,
  }
});

const withProviders = (Story: any) => (
  <Provider store={mockStore}>
    <ThemeProvider>
      <Story />
    </ThemeProvider>
  </Provider>
);

const meta: Meta<typeof YourComponent> = {
  title: "Components/YourComponent",
  component: YourComponent,
  decorators: [withProviders],
};
```

## Best Practices

1. **Mock Data**: Use realistic mock data that matches your application's data structures
2. **Reducers**: Include all reducers that your component depends on
3. **Initial State**: Set up initial state that matches your component's expected state
4. **Decorators**: Use decorators to provide context (Redux, Router, Apollo, etc.)
5. **Testing**: Create stories that cover different states and edge cases