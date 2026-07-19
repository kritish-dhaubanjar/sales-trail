<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = ['name', 'phone'];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    } 
}
