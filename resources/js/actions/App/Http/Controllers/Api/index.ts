import ShapeProxyController from './ShapeProxyController'
import TodoController from './TodoController'

const Api = {
    ShapeProxyController: Object.assign(ShapeProxyController, ShapeProxyController),
    TodoController: Object.assign(TodoController, TodoController),
}

export default Api