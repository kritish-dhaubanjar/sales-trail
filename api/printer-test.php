<?php
// require __DIR__ . '/vendor/autoload.php';

// use Mike42\Escpos\PrintConnectors\FilePrintConnector;
// use Mike42\Escpos\Printer;

// $connector = new FilePrintConnector("php://stdout");
// $printer = new Printer($connector);

// $printer->setEmphasis(true);
// $printer->text("GLOBAL INSTITUTE OF HOTEL MANAGEMENT & TOURISM TECHNICAL CENTER PVT. LTD\n");
// $printer->text("VAT: 302891803\n");
// $printer->text("TAX INVOICE\n");
// $printer->cut();
// $printer->close();

// php printer-test.php | nc x.x.x.x. 9100

require __DIR__ . '/vendor/autoload.php';

use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\Printer;

/*
 * For network printer:
 * php printer-test.php | nc x.x.x.x 9100
 */
$connector = new FilePrintConnector("php://stdout");
$printer   = new Printer($connector);

/* ===== Header ===== */
$printer->setJustification(Printer::JUSTIFY_CENTER);
$printer->setEmphasis(true);
$printer->text("GLOBAL INSTITUTE OF HOTEL MANAGEMENT\n");
$printer->text("& TOURISM TECHNICAL CENTER PVT. LTD\n");
$printer->setEmphasis(false);
$printer->text("VAT: 302891803\n");
$printer->text("------------------------------------------\n");

$printer->setEmphasis(true);
$printer->text("INVOICE\n");
$printer->setEmphasis(false);
$printer->text("------------------------------------------\n");

/* ===== Client & Date ===== */
$printer->setJustification(Printer::JUSTIFY_LEFT);
$printer->text("Client : PP-New Client\n");
$printer->text("Date   : 2082-09-27\n");
$printer->text("------------------------------------------\n");

/* ===== Title ===== */
$printer->setJustification(Printer::JUSTIFY_CENTER);
$printer->setEmphasis(true);
$printer->text("ESTIMATE\n");
$printer->setEmphasis(false);
$printer->text("------------------------------------------\n");

/* ===== Table Header ===== */
$printer->setJustification(Printer::JUSTIFY_LEFT);
$printer->setEmphasis(true);
$printer->text(
    str_pad("S.N.", 4) .
    str_pad("Particulars", 20) .
    str_pad("Qty", 4, ' ', STR_PAD_LEFT) .
    str_pad("Amt", 8, ' ', STR_PAD_LEFT) . "\n"
);
$printer->setEmphasis(false);
$printer->text("------------------------------------------\n");

/* ===== Items ===== */
$items = [
    [1, "American Buffalo Wings", 1, 450.00],
    [2, "Plain Omelette", 1, 130.00],
    [3, "Pad Thai Noodles (Chicken)", 1, 380.00],
];

foreach ($items as $item) {
    [$sn, $name, $qty, $amount] = $item;

    // First line (name)
    $printer->text(
        str_pad($sn, 4) .
        str_pad(substr($name, 0, 20), 20) .
        str_pad($qty, 4, ' ', STR_PAD_LEFT) .
        str_pad(number_format($amount, 2), 8, ' ', STR_PAD_LEFT) . "\n"
    );

    // If item name is long, wrap remaining text
    if (strlen($name) > 20) {
        $printer->text("    " . substr($name, 20) . "\n");
    }
}

/* ===== Totals ===== */
$printer->text("------------------------------------------\n");

$printer->setEmphasis(true);
$printer->text(str_pad("Total", 32) . str_pad("960.00", 8, ' ', STR_PAD_LEFT) . "\n");
$printer->setEmphasis(false);

$printer->text(str_pad("Adj", 32) . str_pad("0.00", 8, ' ', STR_PAD_LEFT) . "\n");

$printer->setEmphasis(true);
$printer->text(str_pad("Grand Total", 32) . str_pad("960.00", 8, ' ', STR_PAD_LEFT) . "\n");
$printer->setEmphasis(false);

/* ===== Footer ===== */
$printer->text("------------------------------------------\n");
$printer->setJustification(Printer::JUSTIFY_CENTER);
$printer->text("Thank You!\n");

/* ===== Cut ===== */
$printer->cut();
$printer->close();
