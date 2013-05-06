<?php
set_time_limit(120);
if (file_exists("movies.json")) {
	header('Content-Type: application/json');
	echo file_get_contents("movies.json");
} else {

	$json_url = "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json?page_limit=10&page=1&country=us&apikey=bq2gvg6a4zv8ac366yq676uu";

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
	
	$genres = array();
	$movies = array();
	foreach ($all_movies["movies"] as $movie) {
		set_time_limit(30);
		$links = $movie["links"];	
		$movie_url = $links["self"] . "?apikey=bq2gvg6a4zv8ac366yq676uu";	
		$ch = curl_init( $movie_url );
		curl_setopt_array( $ch, $options );
		$result =  curl_exec($ch); 
		
		$data = json_decode($result, true);	
		$movie["genres"] = $data["genres"];
		$genres = array_merge($genres,$data["genres"]);
		$movies[] = $movie;	
	}

	$all_movies["movies"] = $movies;
	$all_movies["genres"] = array_unique($genres);
	
	$fp = fopen('movies.json', 'w');
	fwrite($fp, json_encode($all_movies));
	fclose($fp);

	echo json_encode($all_movies);
}
?>