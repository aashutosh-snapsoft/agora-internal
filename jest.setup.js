/**
 * @fileoverview Jest setup file for React component testing.
 *
 * This file is run before each test file and sets up the testing environment.
 * It imports @testing-library/jest-dom which provides custom matchers like:
 * - toBeInTheDocument()
 * - toHaveTextContent()
 * - toBeVisible()
 * - etc.
 *
 * @see {@link https://github.com/testing-library/jest-dom} jest-dom documentation
 */

require('@testing-library/jest-dom');

// jsdom doesn't expose TextEncoder/TextDecoder globally (unlike a real browser
// or Node's own global scope outside jsdom) — code that encodes/decodes text
// client-side (e.g. src/lib/demo/text-encoding.ts) throws ReferenceError under
// this test environment without this polyfill.
const { TextEncoder, TextDecoder } = require('node:util');
if (typeof global.TextEncoder === 'undefined') {
	global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
	global.TextDecoder = TextDecoder;
}
