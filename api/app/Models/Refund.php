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
    protected $fillable = ["date", "title", "description", "total", "discount", "grand_total", "sequence_no", "sequence_code"];

    public function refund_items(): HasMany
    {
        return $this->hasMany(RefundItem::class);
    }

    public function delete()
    {
        $this->refund_items()->delete();
        parent::delete();
    }

    protected static function booted()
    {
        static::creating(function ($refund) {
            $max = Refund::whereNull('deleted_at')->max('sequence_no');
            $refund->sequence_no = $max ? $max + 1 : 1;
            $refund->sequence_code = self::generateSequenceCode($refund->sequence_no);
        });
    }

    public static function generateSequenceNumber(int $id): string
    {
        $size = 500;

        $segment = intdiv($id - 1, $size);
        $number = ($id - 1) % $size + 1;

        $letters = '';

        for ($n = $segment; $n >= 0; $n = intdiv($n, 26) - 1) {
            $letters = chr($n % 26 + 65) . $letters;
        }

        $padded = str_pad($number, 3, '0', STR_PAD_LEFT);

        return $letters . $padded;
    }
}
