<?php

$wallets = array();

$filename = 'wallets/wallets.txt';

$string = "<a href='/address/0x";

$pages = 100;
$page = 1;
$wallets_on_page = 100;

for ($page = 1; $page <= $pages; $page++) {
    $url = 'https://etherscan.io/accounts/'.$page.'?ps='.$wallets_on_page;
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_VERBOSE, true);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    $result = curl_exec($curl);
    curl_close($curl);
    if (strlen($result)) {
        $tmp = explode($string, $result);
        for ($i = 1; $i <= $wallets_on_page; $i++) {
            $wallet = '0x' . strtolower(substr($tmp[$i], 0, 40));
            $wallets[] = $wallet;
        }
    }
}

if (count($wallets)) {
    $handle = fopen($filename, 'a');
    foreach ($wallets as $wallet) {
        fwrite($handle, $wallet . "\r\n");
    }
    fclose($handle);
}

die('success');