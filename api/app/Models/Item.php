<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Item extends Model
{
    use HasFactory;

    protected $with = ['unit', 'category'];
    protected $fillable = ["name", "description", "price", "unit_id", "category_id"];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function sale_items(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function refund_items(): BelongsTo
    {
        return $this->belongsTo(RefundItem::class);
    }

    public function purchase_items(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function delete()
    {
        if ($this->sale_items()->exists()) {
            throw new Exception('This item cannot be deleted because it is associated with sale items.');
        }

        if ($this->refund_items()->exists()) {
            throw new Exception('This item cannot be deleted because it is associated with return items.');
        }

        if ($this->purchase_items()->exists()) {
            throw new Exception('This item cannot be deleted because it is associated with purchase items.');
        }

        return parent::delete();
    }
}
