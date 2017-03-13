export default function createExecContext() {
  let idPointer = 0
  const registry = {}
  return {
    getNextId: () => {
      idPointer += 1
      return idPointer
    },
    registerComponent(id, Component) {
      registry[id] = Component
    },
    getComponent(id) {
      return registry[id]
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
