<?php

$tries = 10;

$wallets = array();

$filename = 'wallets/wallets.txt';

$string = "<a href='/address/0x";

$pages = 100;
$page = 1;
$wallets_on_page = 100;

echo '<pre>';
for ($page = 1; $page <= $pages; $page++) {
    $i = 0;
    $count_of_wallets = 0;
    $tmp = [];
    do {
        sleep(1);
        $i++;
        $url = 'https://etherscan.io/accounts/' . $page . '?ps=' . $wallets_on_page;
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_VERBOSE, true);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        $result = curl_exec($curl);
        curl_close($curl);

        if (strlen($result)) {
            $tmp = explode($string, $result);
            $count_of_wallets = count($tmp);
        }
    } while (
        ($i < $tries) &&
        ($count_of_wallets < 100)
    );

    if ($i < $tries) {
        echo 'page ' . $page . '; count: ' . $count_of_wallets . '<br>';

        foreach ($tmp as $key => $wallet) {
            if ($key === 0) {
                continue;
            }
            if (strlen($wallet)) {
                $wallet = '0x' . strtolower(substr($wallet, 0, 40));
                $wallets[] = $wallet;
            }
        }
    }
}

echo '</pre>';

$wallets = array_unique($wallets);

if (count($wallets)) {
    $handle = fopen($filename, 'a');
    foreach ($wallets as $wallet) {
        fwrite($handle, $wallet . "\r\n");
    }
    fclose($handle);
}

die('success');