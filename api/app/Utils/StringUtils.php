<?php

namespace App\Utils;

class StringUtils
{
    public static function amountInWords($amount)
    {
        $no = floor($amount);
        $decimal = round(($amount - $no) * 100);

        $formatter = new \NumberFormatter("en", \NumberFormatter::SPELLOUT);

        $words = ucwords($formatter->format($no)) . " Rupees";

        if ($decimal > 0) {
            $words .= " And " . ucwords($formatter->format($decimal)) . " Paisa";
        }

        $words .= " Only";

        return $words;
    }
}
