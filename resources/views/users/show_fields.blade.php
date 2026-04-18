<!-- Name Field -->
<div class="row">
    <p>Nom: {{ $user->name }}</p>
</div>

<!-- Email Field -->
<div class="row">
    <p>Courriel: {{ $user->email }}</p>
</div>

<!-- Roles->first() Field -->
<div class="row">
    <p>Rôle: {{ $user->roles->pluck('name')->join(' ,') }}</p>
</div>

<!-- Created_at Field -->
<div class="row">
    <p>Date de création: {{ $user->created_at }}</p>
</div>

<!-- Updated_at Field -->
<div class="row">
    <p>Mise à jour: {{ $user->updated_at }}</p>
</div>

<!-- Deleted_at Field -->
<div class="row">
    <p>Date de suppression: {{ $user->deleted_at }}</p>
</div>
