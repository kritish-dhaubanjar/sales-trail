<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Account extends Model
{
    use HasFactory;

    protected $fillable = ["name"];

    public function sales(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function refunds(): BelongsTo
    {
        return $this->belongsTo(Refund::class);
    }

    public function delete()
    {
        if ($this->sales()->exists()) {
            throw new Exception('This item cannot be deleted because it is associated with sales.');
        }

        if ($this->refunds()->exists()) {
            throw new Exception('This item cannot be deleted because it is associated with returns.');
        }

        return parent::delete();
    }
}
