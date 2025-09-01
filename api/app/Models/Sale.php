<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use HasFactory, SoftDeletes;

    protected $with = ['sale_items'];
    protected $fillable = ["date", "title", "description", "total", "discount", "grand_total", "sequence_no"];

    public function sale_items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function delete()
    {
        $this->sale_items()->delete();
        parent::delete();
    }

    protected static function booted()
    {
        static::creating(function ($sale) {
            $max = Sale::whereNull('deleted_at')->max('sequence_no');
            $sale->sequence_no = $max ? $max + 1 : 1;
        });
    }
}
