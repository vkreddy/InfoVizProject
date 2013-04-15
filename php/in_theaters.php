<?php

$json_url = "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json?page_limit=16&page=1&country=us&apikey=bq2gvg6a4zv8ac366yq676uu";

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