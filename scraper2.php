<?php

$ch = curl_init("http://boxofficemojo.com/weekend/chart/");
$html = curl_exec($ch);
echo $html;

?>