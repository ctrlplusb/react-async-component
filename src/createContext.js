export default function createContext() {
  let idPointer = 0
  const registry = {}
  const errorRegistry = {}
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
    registerError(id, message) {
      errorRegistry[id] = message
    },
    getError(id) {
      return errorRegistry[id]
    },
    getState() {
      return {
        resolved: Object.keys(registry).reduce(
          (acc, cur) => Object.assign(acc, { [cur]: true }),
          {},
        ),
        errors: Object.assign({}, errorRegistry),
      }
    },
  }
}
