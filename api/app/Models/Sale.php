<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use HasFactory, SoftDeletes;

    protected $with = ['sale_items', 'account'];
    protected $fillable = ["date", "title", "description", "account_id", "total", "discount", "grand_total"];

    public function sale_items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function delete()
    {
        $this->sale_items()->delete();
        parent::delete();
    }
}
