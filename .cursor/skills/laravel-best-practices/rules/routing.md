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

## PowerSync vs classic REST

This app syncs many entities through **PowerSync**, not per-model REST CRUD:

- **Upload path**: authenticated `POST /powersync/upload` validates a `crud` array and runs each entry in a transaction. Extend `PowerSyncUploadRouter` and add a `*PowerSyncUploadApplier` for new synced `type` values — that is the primary mutation surface for those tables.
- **Credentials**: invokable controller issuing token + endpoint for the PowerSync client.
- **Other API routes** (e.g. media upload, one-off `store`): dedicated routes/controllers are correct; they are not required to mirror `index`/`show`/`update`/`destroy` for PowerSync-backed models.

Do not refactor PowerSync flows into `Route::apiResource()` unless you are intentionally adding a parallel REST API.

## Use `Route::apiResource()` for classic REST only

When you expose a **non–PowerSync-synced** resource as full REST, use `Route::apiResource()`.

```php
// In routes/api.php — the /api prefix is applied automatically
Route::apiResource('posts', Api\PostController::class);
```

## Resource controllers: five methods

For a controller backing `apiResource()`, define exactly:

- `index`
- `store`
- `show`
- `update`
- `destroy`

Do not add `create` or `edit` methods in API-only resource controllers. Invokable controllers, upload appliers, and single-action endpoints are outside this rule.

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
