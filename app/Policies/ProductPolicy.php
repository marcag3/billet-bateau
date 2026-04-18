<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProductPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $this->view($user);
    }

    public function view(User $user, ?Product $product = null)
    {
        return $user->can('view products');
    }

    public function create(User $user)
    {
        return $this->update($user);
    }

    public function update(User $user, ?Product $product = null)
    {
        return $user->can('edit products');
    }

    public function delete(User $user, Product $product)
    {
        return $user->can('delete products');
    }
}
