require("@testing-library/jest-dom");

// jsdom leaves out TextEncoder/TextDecoder, and React Router 7 needs them as
// soon as it is imported. Node's own implementations are spec-compliant.
const { TextDecoder, TextEncoder } = require("util");

Object.assign(globalThis, { TextDecoder, TextEncoder });
