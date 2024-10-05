<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Item extends Model
{
    use HasFactory;

    protected $with = ['unit'];
    protected $fillable = ["name", "description", "price", "unit_id"];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function sale_items(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function refund_items(): BelongsTo
    {
        return $this->belongsTo(RefundItem::class);
    }

    public function delete()
    {
        if ($this->sale_items()->exists()) {
            throw new Exception('This item cannot be deleted because it is associated with sale items.');
        }

        if ($this->refund_items()->exists()) {
            throw new Exception('This item cannot be deleted because it is associated with return items.');
        }

        return parent::delete();
    }
}
