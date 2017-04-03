export default function createAsyncContext() {
  let idPointer = 0
  const registry = {}
  return {
    getNextId: () => {
      idPointer += 1
      return idPointer
    },
    resolved(id) {
      registry[id] = true
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
