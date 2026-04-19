# Routing & Controllers Best Practices

## API-Only Controllers

This project is API-only. Controllers should return Data DTOs/JSON payloads, never views or redirects.

## Use Implicit Route Model Binding

Let Laravel resolve models automatically from route parameters.

Incorrect:

```php
public function show(int $id)
{
    $post = Post::findOrFail($id);
}
```

Correct:

```php
public function show(Post $post)
{
    return PostData::from($post);
}
```

## Use Scoped Bindings for Nested Resources

Enforce parent-child relationships automatically.

```php
Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
    // $post is automatically scoped to $user
})->scopeBindings();
```

## Use `Route::apiResource()`

Use `Route::apiResource()` for RESTful API endpoints.

```php
// In routes/api.php — the /api prefix is applied automatically
Route::apiResource('posts', Api\PostController::class);
```

## Keep Exactly 5 Controller Methods

API resource controllers should define exactly these methods:

- `index`
- `store`
- `show`
- `update`
- `destroy`

Do not add `create` or `edit` methods in API-only controllers.

## Keep Controllers Thin

Aim for under 10 lines per method. Extract business logic to action or service classes.

Incorrect:

```php
public function store(PostUpsertData $data)
{
    $post = Post::query()->create($data->all());
    $post->tags()->sync($data->tags);
    event(new PostCreated($post));
    Notification::route('mail', 'team@example.com')->notify(new PostPublishedNotification($post));

    return PostData::from($post->load('tags'));
}
```

Correct:

```php
public function store(PostUpsertData $data): PostData
{
    $post = CreatePostAction::run($data);

    return PostData::from($post);
}
```

## Use Dedicated Controllers for Custom Actions

If you need non-REST endpoints, keep them out of resource controllers and place them in a dedicated controller.

```php
Route::post('/posts/{post}/publish', PublishPostController::class);
```
