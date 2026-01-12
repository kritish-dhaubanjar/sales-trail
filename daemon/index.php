<?php

require __DIR__ . '/vendor/autoload.php';

use WebSocket\Client;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;

$cluster = 'ap2';
$appKey = '<APP_KEY>';

$ws = new Client(
  "wss://ws-$cluster.pusher.com/app/$appKey?protocol=7&client=php&version=1.0",
  [
    'timeout' => 60,
    'fragment_size' => 4096,
  ]
);

$ws->send(json_encode([
  'event' => 'pusher:subscribe',
  'data' => ['channel' => 'print-channel']
]));

echo "Listening for JSON print jobs\n";

function amountInWords($amount)
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

while (true) {
  try {
    $raw = $ws->receive();
  } catch (\WebSocket\TimeoutException $e) {
    continue;
  }

  $message = json_decode($raw, true);

  if (!$message) {
    continue;
  }

  if (($message['event'] ?? '') !== 'print') {
    continue;
  }

  $data = json_decode($message['data'], true);

  $sale = $data['data'];

  $connector = new NetworkPrintConnector("192.168.0.241", 9100);
  $printer = new Printer($connector);

  echo "Printing " . $sale['id'] . "\n";

  try {
    // 2. Print header
    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->setEmphasis(true);
    $printer->text("Sushi Time - Bhaktapur\n");
    $printer->setEmphasis(false);
    $printer->text("By: Global Institute Of Hotel Management & Tourism Technical Center Pvt. Ltd\n");
    $printer->setEmphasis(true);
    $printer->text("VAT: 302891803\n");
    $printer->text("INVOICE\n");
    $printer->setEmphasis(false);
    $printer->feed();

    // 3. Print bill info
    $printer->setJustification(Printer::JUSTIFY_LEFT);
    $printer->text("Bill No: " . $sale["id"] . "\n");
    $printer->text("Bill Date: " . $sale["date"] . "\n");
    $printer->text("Buyer's Name: LEAPFROG TECHNOLOGY NEPAL PVT. LTD\n");
    $printer->text("Buyer's PAN: 600243227\n");
    $printer->text("Address: DILLBAZAR, KATHMANDU\n");
    $printer->text("Table No: \n");
    $printer->feed();

    // 4. Print items table
    $printer->setJustification(Printer::JUSTIFY_LEFT);
    $printer->text("SN  ITEM                     QTY   RATE    AMT\n");
    $printer->text("------------------------------------------------\n");

    $sale_items = $sale['sale_items'];

    $items = array_map(function ($item) {
      return [
        'name' => $item['item']['name'],
        'price' => $item['price'],
        'quantity' => $item['quantity'],
        'total' => $item['price'] * $item['quantity'],
      ];
    }, $sale_items);

    foreach ($items as $index => $item) {
      $sn = str_pad($index + 1, 3, " ", STR_PAD_LEFT);

      $name = str_pad(substr($item['name'], 0, 20), 20, " ", STR_PAD_RIGHT);

      $qty = str_pad($item['quantity'], 3, " ", STR_PAD_LEFT);

      $rate = str_pad(number_format($item['price'], 2), 6, " ", STR_PAD_LEFT);

      $total = str_pad(number_format($item['total'], 2), 6, " ", STR_PAD_LEFT);

      $printer->text("$sn    $name  $qty  $rate  $total\n");
    }

    $printer->text("------------------------------------------------\n");

    // 5. Print totals
    $totals = [
      'Sub Total' => $sale['total'],
      'Adj' => $sale['discount'],
      'Taxable Amount' => $sale['total'] - $sale['discount'],
      '13% VAT' => $sale['vat_amount'],
      'Grand Total' => $sale['total'] - $sale['discount'] + $sale['vat_amount'],
    ];

    foreach ($totals as $key => $value) {
      $printer->setJustification(Printer::JUSTIFY_RIGHT);
      $printer->text(str_pad($key, 20, " ", STR_PAD_LEFT) . "  " . str_pad(number_format($value, 2), 12, " ", STR_PAD_LEFT) . "\n");
    }

    $printer->feed();

    // 6. Print amount in words
    $printer->setJustification(Printer::JUSTIFY_LEFT);

    $inWords = amountInWords($totals['Grand Total']);

    $printer->text("In Words: $inWords\n");
    $printer->feed();

    // 7. Footer
    $nepalTime = new DateTime('now', new DateTimeZone('Asia/Kathmandu'));

    $printer->text("Printed On: " . $nepalTime->format('D M d Y H:i:s') . "\n\n");
    $printer->setJustification(Printer::JUSTIFY_LEFT);
    $printer->text("----------------                ----------------\n");
    $printer->text("Cashier                          Guest Signature\n");
    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->text("THANK YOU\n");
    $printer->feed(3);

    $printer->cut();
    $printer->close();
  } catch (Exception $e) {
    $printer->close();
    echo "Print error: {$e->getMessage()}\n";
  }
}

