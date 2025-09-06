// Mock implementation of node-fetch for testing
export default jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Map(),
  })
);

export const Response = jest.fn();
export const Request = jest.fn();