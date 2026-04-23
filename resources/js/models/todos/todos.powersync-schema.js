import { column, Schema, Table } from '@powersync/web';

const todosTable = new Table({
    user_id: column.integer,
    title: column.text,
    completed: column.integer,
    created_at: column.text,
    updated_at: column.text,
});

export const todosPowerSyncSchema = new Schema({
    todos: todosTable,
});

export const todosPowerSyncTable = todosPowerSyncSchema.props.todos;
