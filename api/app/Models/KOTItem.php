<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KOTItem extends Model
{
    use HasFactory;

    protected $table = 'kot_items';

    protected $with = ['item'];
    protected $fillable = ["quantity", "item_id"];

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
