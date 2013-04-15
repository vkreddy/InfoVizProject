<?php

$startDate = $_GET['startDate'];
$zipcode = $_GET['zipcode'];
$json_url = "http://data.tmsapi.com/v1/movies/showings?startDate=".$startDate."&zip=".$zipcode."&api_key=vrcaw8k9yzfkpcdkvdua6ufz";

// Initializing curl
$ch = curl_init( $json_url );
 
// Configuring curl options
$options = array(
CURLOPT_RETURNTRANSFER => true,
CURLOPT_HTTPHEADER => array('Content-type: application/json') ,
);
 
// Setting curl options
curl_setopt_array( $ch, $options );
 
// Getting results
$result =  curl_exec($ch); 
echo $result
?>