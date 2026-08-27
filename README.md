# Agora

Agora is a frontend application for Socratics AI platform built with Next.js.

In earlier days, Agora was the marketplace of ideas. Now, it is the marketplace of business ideas- scrutinized with
rigorous logic and socratic reasoning.

## Installation

```bash
git clone https://github.com/SocraticsAI/agora.git
cd agora
npm install
```

# Specs

Node version: 22.11.0
NPM version: 10.9.0 (bundled with Node 22.11.0 in CI)

## Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Development with Storybook

By using Storybook, you can develop your components in isolation.

```bash
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) with your browser to see the result.

## Creating your own components

The following command will create a new component in the `src/components` directory.

```bash
npx generate-react component --name=your-component-name-in-barbeque-case
```

It will generate:

1. a tsx component file
2. a storybook story file
3. a lazy file for lazy loading the component
# agora-internal
