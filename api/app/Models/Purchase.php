<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use HasFactory, SoftDeletes;

    protected $with = ['purchase_items', 'transactions'];
    protected $fillable = ["date", "title", "description", "total", "discount", "grand_total"];

    public function purchase_items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function transactions()
    {
        return $this->morphMany(Transaction::class, 'transaction');
    }

    public function delete()
    {
        $this->purchase_items()->delete();
        parent::delete();
    }
}
