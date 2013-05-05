<?php

$imdbid = $_GET['imdbid'];
$ch = curl_init("http://www.imdb.com/title/".$imdbid."/business?");
$html = curl_exec($ch);
echo $html;

?>