export default function createAsyncContext() {
  const registry = {}
  return {
    resolved(chunkName) {
      registry[chunkName] = true
    },
    getState() {
      return {
        resolved: Object.keys(registry).reduce(
          (acc, cur) => Object.assign(acc, { [cur]: true }),
          {},
        ),
      }
    },
  }
}
