const config = {
	preset: '@storybook/test-runner/jest-preset',
	testTimeout: 60000, // 60 seconds for complex interaction tests
	maxWorkers: 2, // Limit concurrent workers to prevent overwhelming the system
	testEnvironment: 'node',

	// Only run interaction tests (stories with play functions)
	testMatch: [
		'<rootDir>/**/*.stories.@(js|jsx|ts|tsx)',
	],

	// Transform configuration
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest',
	},

	// Setup files
	setupFilesAfterEnv: ['<rootDir>/.storybook/jest-setup.js'],

	// Module resolution
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

	// Coverage configuration
	collectCoverageFrom: [
		'src/**/*.stories.@(js|jsx|ts|tsx)',
	],

	// Ignore patterns
	testPathIgnorePatterns: [
		'<rootDir>/node_modules/',
		'<rootDir>/.next/',
		'<rootDir>/storybook-static/',
	],
};

export default config; 