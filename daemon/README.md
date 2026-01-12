
1. Control Panel → Devices and Printers → right-click → Printer properties → Sharing → Share name (ZKP8016)
2. `NET USE LPT2: \\GIHMTTC\ZKP8016 /persistent:yes`
3. `$connector = new WindowsPrintConnector("LPT2");`
