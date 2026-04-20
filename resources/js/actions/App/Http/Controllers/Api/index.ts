import TodoShapeProxyController from './TodoShapeProxyController'
import TodoController from './TodoController'

const Api = {
    TodoShapeProxyController: Object.assign(TodoShapeProxyController, TodoShapeProxyController),
    TodoController: Object.assign(TodoController, TodoController),
}

export default Api