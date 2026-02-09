<?php

require __DIR__ . '/vendor/autoload.php';

use WebSocket\Client;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

$cluster = 'ap2';
$appKey = '<APP_KEY>';
$url = "https://sushitimebkt.gihm.com.np/api/v1";
$token = '<BEARER_TOKEN>';
$printers = [null, "127.0.0.1"];

function logger(string $level, string $message)
{
  echo sprintf("[%s] %-7s %s\n", date('Y-m-d H:i:s'), strtoupper($level), $message);
}

function connect($cluster, $appKey)
{
  $ws = new Client(
    "wss://ws-$cluster.pusher.com/app/$appKey?protocol=7&client=php&version=1.0",
    [
      'timeout' => 10,
      'fragment_size' => 4096,
      'headers' => [],
      'context' => stream_context_create([
        'ssl' => [
          'verify_peer' => true,
          'verify_peer_name' => true,
        ],
        'socket' => [
          'tcp_nodelay' => true,
          'so_keepalive' => true
        ]
      ])
    ]
  );

  $ws->setTimeout(10);

  return $ws;
}

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

function isInternetAlive(): bool
{
  $c = @fsockopen("1.1.1.1", 53, $e, $s, 2);
  if ($c) {
    fclose($c);
    return true;
  }
  return false;
}


$lastPing = time();
$pingInterval = 20; // seconds

while (true) {
  try {
    $ws = connect($cluster, $appKey);
    $ws->send(json_encode(['event' => 'pusher:subscribe', 'data' => ['channel' => 'print-channel']]));

    $lastPing = time();

    logger('info', 'WebSocket connection established. Listening for print jobs.');

    while (true) {
      try {
        if (!isInternetAlive()) {
          throw new Exception("Internet unreachable");
        }

        if (time() - $lastPing > 60) {
          throw new Exception("Heartbeat timeout");
        }

        $raw = $ws->receive();

        if ($raw === false || $raw === null || trim($raw) === '') {
          throw new Exception("Socket dead or network lost...");
        }

        $message = json_decode($raw, true);
        $event = $message['event'] ?? '';

        logger('debug', "Event received: {$event}");

        // Confirmation server received our ping
        if ($event === 'pusher:pong') {
          $lastPing = time();
          continue;
        }

        // Handle Pusher Hearbeat
        if ($event === 'pusher:ping') {
          $ws->send(json_encode(['event' => 'pusher:pong', 'data' => new stdClass()]));
          $lastPing = time();
          continue;
        }

        // Manual Heartbeat: If no message received, send a ping to keep alive
        if (time() - $lastPing > $pingInterval) {
          $ws->send(json_encode(['event' => 'pusher:ping', 'data' => new stdClass()]));
        }

        if ($event == 'print-reciept') {
          $data = json_decode($message['data'], true);

          $sale = $data['data'];

          logger('info', "Printing receipt | Sale ID: {$sale['id']}");

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
            $printer->text("SN ITEM                         QTY  RATE   AMT\n");
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
              $sn = str_pad($index + 1, 2, " ", STR_PAD_RIGHT);

              $name = str_pad(substr($item['name'], 0, 29), 29, " ", STR_PAD_RIGHT);

              $qty = str_pad($item['quantity'], 3, " ", STR_PAD_LEFT);

              $rate = str_pad(number_format($item['price']), 6, " ", STR_PAD_LEFT);

              $total = str_pad(number_format($item['total']), 6, " ", STR_PAD_LEFT);

              $printer->text("$sn $name$qty$rate$total\n");
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
            logger('error', "Receipt print failed | Reason: {$e->getMessage()}");
            continue;
          }
        }

        if ($event == 'print-estimate') {
          $data = json_decode($message['data'], true);

          $table = $data['data'];

          logger('info', "Printing estimate | Table ID: {$table['id']}");

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
            $printer->text("SN ITEM                         QTY  RATE   AMT\n");
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
              $sn = str_pad($index + 1, 2, " ", STR_PAD_RIGHT);

              $name = str_pad(substr($item['name'], 0, 29), 29, " ", STR_PAD_RIGHT);

              $qty = str_pad($item['quantity'], 3, " ", STR_PAD_LEFT);

              $rate = str_pad(number_format($item['price']), 6, " ", STR_PAD_LEFT);

              $total = str_pad(number_format($item['total']), 6, " ", STR_PAD_LEFT);

              $totals['Sub Total'] += $item['total'];
              $totals['Grand Total'] += $item['total'];

              $printer->text("$sn $name$qty$rate$total\n");
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
            logger('error', "Estimate print failed | Reason: {$e->getMessage()}");
            continue;
          }
        }

        if ($event == 'print-kot') {
          $data = json_decode($message['data'], true);

          $kot = $data['data'];
          $printer_id = $kot['printer_id'];

          logger('info', "Printing KOT | Table ID: {$kot['table_id']} | Printer ID: {$kot['printer_id']}");

          try {
            $connector;

            if ($printer_id == 1) {
              $connector = new WindowsPrintConnector("LPT2");
            }

            if ($printer_id == 2) {
              $connector = new NetworkPrintConnector($printers[1], 9100);
            }

            $printer = new Printer($connector);

            // 2. Print header
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setEmphasis(true);
            $printer->text("KOT\n");
            $printer->setEmphasis(false);
            $printer->feed();

            // 3. Print bill info
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->text("Table No: " . $kot["table"] . "\n");
            $printer->text("KOT Date: " . (new DateTime())->setTimezone(new DateTimeZone('Asia/Kathmandu'))->format('Y-m-d H:i:s') . "\n");
            $printer->feed();

            // 4. Print items table
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->text("QTY ITEM                                       \n");
            $printer->text("------------------------------------------------\n");

            $items = array_merge($kot['removed'], $kot['added']);

            foreach ($items as $index => $item) {
              $qty = str_pad($item['quantity'], 4, " ", STR_PAD_LEFT);

              $name = str_pad(substr($item['name'], 0, 45), 45, " ", STR_PAD_RIGHT);

              $printer->text("$qty $name\n");
            }

            $feed_count = 5 - count($item);

            for ($i = $feed_count; $i > 0; $i--) {
              $printer->feed();
            }

            $printer->text("------------------------------------------------\n");

            // 7. Footer
            $printer->setJustification(Printer::JUSTIFY_LEFT);

            $printer->feed(2);

            $printer->cut();
            $printer->close();

            $curl = curl_init();

            curl_setopt_array($curl, [
              CURLOPT_URL => "$url/tables/" . $kot["table_id"] . "/kot",
              CURLOPT_RETURNTRANSFER => true,
              CURLOPT_CUSTOMREQUEST => "PUT",
              CURLOPT_ENCODING => "",
              CURLOPT_MAXREDIRS => 10,
              CURLOPT_TIMEOUT => 30,
              CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
              CURLOPT_HTTPHEADER => [
                "Accept: application/json, text/plain, */*",
                "Accept-Language: en-US,en;q=0.9,ne;q=0.8",
                "Authorization: Bearer $token",
                "Connection: keep-alive",
                "Origin: https://sushitimebkt.gihm.com.np/",
                "Referer: https://sushitimebkt.gihm.com.np/",
                "Sec-Fetch-Dest: empty",
                "Sec-Fetch-Mode: cors",
                "Content-Type: application/json",
                "Sec-Fetch-Site: cross-site",
                "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
                'sec-ch-ua: "Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
                "sec-ch-ua-mobile: ?0",
                'sec-ch-ua-platform: "Linux"'
              ],
              CURLOPT_POSTFIELDS => json_encode([
                'printer_id' => $kot['printer_id']
              ])
            ]);

            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);

            $response = curl_exec($curl);
            $error = curl_error($curl);

            if ($error) {
              logger('error', "KOT print failed | Reason: $error");
            }
          } catch (Exception $e) {
            logger('error', "KOT print failed | Reason: {$e->getMessage()}");
            continue;
          }
        }
      } catch (\WebSocket\TimeoutException $e) {
        try {
          $ws->send(json_encode(['event' => 'pusher:ping', 'data' => new stdClass()]));
        } catch (Throwable $pingError) {
          throw new Exception($pingError);
        }
        continue;
      }
    }
  } catch (Throwable $error) {
    logger('error', "Connection lost: {$error->getMessage()}");
    logger('warn', "Reconnecting in 5 seconds...");

    if (isset($ws)) {
      try {
        $ws->close();
      } catch (Exception $error) {
      }
    }

    sleep(5);
  }
}
