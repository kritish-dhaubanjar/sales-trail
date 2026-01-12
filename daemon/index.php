<?php

require __DIR__ . '/vendor/autoload.php';

use WebSocket\Client;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

$cluster = 'ap2';
$appKey = '<APP_KEY>';

$ws = new Client(
  "wss://ws-$cluster.pusher.com/app/$appKey?protocol=7&client=php&version=1.0",
  [
    'timeout' => 10,
    'fragment_size' => 4096,
  ]
);

sleep(2);

$ws->send(json_encode([
  'event' => 'pusher:subscribe',
  'data' => ['channel' => 'print-channel']
]));

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

$lastPing = time();
$pingInterval = 25; // seconds

while (true) {
  echo "Listening for JSON print jobs\n";

  try {
    $raw = $ws->receive();
  } catch (\WebSocket\TimeoutException $e) {
    if (time() - $lastPing > $pingInterval) {
      $ws->send(json_encode([
        'event' => 'pusher:ping',
        'data' => new stdClass()
      ]));
      $lastPing = time();
    }

    continue;
  }

  $message = json_decode($raw, true);

  echo "Event received: " . $message['event'] ?? '';

  if (($message['event'] ?? '') === 'pusher:ping') {
    $ws->send(json_encode([
      'event' => 'pusher:pong',
      'data' => new stdClass()
    ]));
    continue;
  }

  if (!$message) {
    continue;
  }

  if (($message['event'] ?? '') == 'print-reciept') {

    $data = json_decode($message['data'], true);

    $sale = $data['data'];

    echo "Printing Reciept " . $sale['id'] . "\n";

    try {
      // $connector = new NetworkPrintConnector("192.168.0.241", 9100);
      $connector = new WindowsPrintConnector("LPT2");
      $printer = new Printer($connector);

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
      $printer->text("Table No: " . $sale["title"] . "\n");
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

        $name = str_pad(substr($item['name'], 0, 16), 16, " ", STR_PAD_RIGHT);

        $qty = str_pad($item['quantity'], 3, " ", STR_PAD_LEFT);

        $rate = str_pad(number_format($item['price'], 2), 8, " ", STR_PAD_LEFT);

        $total = str_pad(number_format($item['total'], 2), 8, " ", STR_PAD_LEFT);

        $printer->text("$sn    $name  $qty  $rate  $total\n");
      }

      $printer->text("------------------------------------------------\n");

      // 5. Print totals
      $totals = [
        'Sub Total' => $sale['total'],
        'Discount' => $sale['discount'],
        'Taxable Amount' => $sale['taxable_amount'],
        '13% VAT' => $sale['vat_amount'],
        'Grand Total' => $sale['grand_total'],
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

      $printer->setJustification(Printer::JUSTIFY_LEFT);
      $printer->text("* This is an estimated bill only and is not a tax invoice.");
      $printer->feed(3);

      $printer->cut();
      $printer->close();
    } catch (Exception $e) {
      echo "Print error: {$e->getMessage()}\n";
    }
  }

  if (($message['event'] ?? '') == 'print-estimate') {

    $data = json_decode($message['data'], true);

    $table = $data['data'];

    echo "Printing Estimate " . $table['id'] . "\n";

    try {
      // $connector = new NetworkPrintConnector("192.168.0.241", 9100);
      $connector = new WindowsPrintConnector("LPT2");
      $printer = new Printer($connector);

      // 2. Print header
      $printer->setJustification(Printer::JUSTIFY_CENTER);
      $printer->setEmphasis(true);
      $printer->text("Estimate\n");
      $printer->setEmphasis(false);
      $printer->feed();

      // 3. Print bill info
      $printer->setJustification(Printer::JUSTIFY_LEFT);
      $printer->text("Bill Date: " . (new DateTime($table['items'][0]['created_at']))->setTimezone(new DateTimeZone('Asia/Kathmandu'))->format('Y-m-d H:i:s') . "\n");
      $printer->text("Table No: " . $table["name"] . "\n");
      $printer->feed();

      // 4. Print items table
      $printer->setJustification(Printer::JUSTIFY_LEFT);
      $printer->text("SN  ITEM                     QTY   RATE    AMT\n");
      $printer->text("------------------------------------------------\n");

      $sale_items = $table['items'];

      $items = array_map(function ($item) {
        return [
          'name' => $item['item']['name'],
          'price' => $item['price'],
          'quantity' => $item['quantity'],
          'total' => $item['price'] * $item['quantity'],
        ];
      }, $sale_items);

      // 5. Print totals
      $totals = [
        'Sub Total' => 0,
        'Discount' => 0,
        'Grand Total' => 0,
      ];

      foreach ($items as $index => $item) {
        $sn = str_pad($index + 1, 3, " ", STR_PAD_LEFT);

        $name = str_pad(substr($item['name'], 0, 16), 16, " ", STR_PAD_RIGHT);

        $qty = str_pad($item['quantity'], 3, " ", STR_PAD_LEFT);

        $rate = str_pad(number_format($item['price'], 2), 8, " ", STR_PAD_LEFT);

        $total = str_pad(number_format($item['total'], 2), 8, " ", STR_PAD_LEFT);

        $totals['Sub Total'] += $item['total'];
        $totals['Grand Total'] += $item['total'];

        $printer->text("$sn    $name  $qty  $rate  $total\n");
      }

      $printer->text("------------------------------------------------\n");

      // 5. Print totals
      foreach ($totals as $key => $value) {
        $printer->setJustification(Printer::JUSTIFY_RIGHT);
        $printer->text(str_pad($key, 20, " ", STR_PAD_LEFT) . "  " . str_pad(number_format($value, 2), 12, " ", STR_PAD_LEFT) . "\n");
      }

      $printer->feed();

      // 7. Footer
      $printer->setJustification(Printer::JUSTIFY_LEFT);
      $nepalTime = new DateTime('now', new DateTimeZone('Asia/Kathmandu'));

      $printer->text("Printed On: " . $nepalTime->format('D M d Y H:i:s') . "\n\n");
      $printer->text("THANK YOU\n");

      $printer->feed(2);

      $printer->cut();
      $printer->close();
    } catch (Exception $e) {
      echo "Print error: {$e->getMessage()}\n";
    }
  }
}
