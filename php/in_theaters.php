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

$data = json_decode($result, true);

$total_pages = $data['total'] % 16;

$all_movies["total"] = $data['total'];
$all_movies["movies"] = $data['movies'];

while ($data["movies"]) {
    $all_movies['movies'] = array_merge( (array)$all_movies['movies'], (array)$data['movies'] );

    $paging = $data['links'];
    $next = $paging['next'] . "&apikey=bq2gvg6a4zv8ac366yq676uu";
	$ch = curl_init( $next );
	curl_setopt_array( $ch, $options );
    $result =  curl_exec($ch); 
	$data = json_decode($result, true);	
}

echo json_encode($all_movies);
?>