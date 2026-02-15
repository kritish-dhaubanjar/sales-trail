<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Table extends Model
{
    use HasFactory;

    protected $with = ["items", "kotItems"];
    protected $fillable = ["name", "is_delivery", "description"];

    public function items(): HasMany
    {
        return $this->hasMany(TableItem::class);
    }

    public function kotItems(): HasMany
    {
        return $this->hasMany(KOTItem::class);
    }
}
