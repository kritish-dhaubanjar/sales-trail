<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Refund extends Model
{
    use HasFactory, SoftDeletes;

    protected $with = ['refund_items'];
    protected $fillable = ["date", "title", "description", "total", "discount", "grand_total"];

    public function refund_items(): HasMany
    {
        return $this->hasMany(RefundItem::class);
    }

    public function delete()
    {
        $this->refund_items()->delete();
        parent::delete();
    }
}
