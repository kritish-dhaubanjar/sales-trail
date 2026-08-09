<?php

namespace App\Utils;

class FiscalYear
{
    public static function getFiscalYearFromDate(string $date)
    {
        [$year, $month] = array_map('intval', explode('-', $date));

        if ($month <= 3) {
            return ($year - 1) . '/' . substr((string) $year, -2);
        }

        return $year . '/' . substr((string) ($year + 1), -2);
    }
}
