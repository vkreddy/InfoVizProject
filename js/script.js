function getMoviesInTheaters() {
	// send off the query
	$.ajax({
		url: "/php/in_theaters.php",
		dataType: "json",
		success: function(data){			
			for(var i=0;i<10;i++){
				alert(data.movies[i].release_dates.theater)
			}
			alert(data.total);
			
		},
		async: false
	})
}

function getSearchMovies(query) {
	$.ajax({
		url: "/php/search_movies.php?query=" + encodeURI(query),
		dataType: "json",
		success: function(data){			
			$(document.body).append('Found ' + data.total + ' results for ' + query);
			var movies = data.movies;
			$.each(movies, function(index, movie) {
				$(document.body).append('<h1>' + movie.title + '</h1>');
				$(document.body).append('<img src="' + movie.posters.thumbnail + '" />');
			});
			
			alert(data.total);			
		},
		async: false
	})
}

function getDataFromTMS(date,zipcode) {	
	var fullURL = "/php/get_shows.php?startDate=" + date + "&zip=" + zipcode;
	$.ajax({
		url: fullURL,
		dataType: "json",
		success: function(data){			
		},
		async: false
	});	
}

$(document).ready(function () {
	getMoviesInTheaters()
});
