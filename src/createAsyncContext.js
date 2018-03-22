export default () => {
  let idPointer = 0
  const registry = {}
  const errors = {}
  return {
    getNextId: () => {
      idPointer += 1
      return idPointer
    },
    resolved(id) {
      registry[id] = true
    },
    failed(id, error) {
      errors[id] = error
    },
    getState() {
      return {
        resolved: Object.keys(registry).reduce(
          (acc, cur) => Object.assign(acc, { [cur]: true }),
          {},
        ),
        errors,
      }
    },
  }
}
