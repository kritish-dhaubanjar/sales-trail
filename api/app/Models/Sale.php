<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use HasFactory, SoftDeletes;

    protected $with = ['sale_items', 'transactions'];
    protected $fillable = ["date", "title", "description", "total", "discount", "grand_total"];

    public function sale_items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function transactions()
    {
        return $this->morphMany(Transaction::class, 'transaction');
    }

    public function delete()
    {
        $this->sale_items()->delete();
        parent::delete();
    }
}
