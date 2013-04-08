function getDataFromRT(url) {
	var fullURL = "http://api.rottentomatoes.com/api/public/v1.0" + url + "&apikey=bq2gvg6a4zv8ac366yq676uu";
	$.ajax({
		url: fullURL,
		dataType: "jsonp",
		success: function(data){
			return data;
		}
	});
	return false;
}

function getMoviesInTheaters() {
	var moviesSearchUrl = '/lists/movies/in_theaters.json?page_limit=16&page=1&country=us';
	
	var data = getDataFromRT(movieSearchUrl);
	// send off the query
	if (data) {
		$(document.body).append('Found ' + data.total + ' results for ' + query);
		var movies = data.movies;
		$.each(movies, function(index, movie) {
			$(document.body).append('<h1>' + movie.title + '</h1>');
			$(document.body).append('<img src="' + movie.posters.thumbnail + '" />');
		});
	}
}

function getSearchMovies(query) {
	var moviesSearchUrl = '/movies.json?page_limit=16&page=1&q=' + encodeURI(query);	
	var data = getDataFromRT(movieSearchUrl);
	// send off the query
	if (data) {
		$(document.body).append('Found ' + data.total + ' results for ' + query);
		var movies = data.movies;
		$.each(movies, function(index, movie) {
			$(document.body).append('<h1>' + movie.title + '</h1>');
			$(document.body).append('<img src="' + movie.posters.thumbnail + '" />');
		});
	}
}

function getDataFromTMS(date,zipcode) {	
	var fullURL = "http://data.tmsapi.com/v1/movies/showings?startDate=" + date + "&zip=" + zipcode + "&api_key=vrcaw8k9yzfkpcdkvdua6ufz";
	$.ajax({
		url: fullURL,
		dataType: "jsonp",
		success: function(data){
			return data;
		}
	});
	return false;
}

$(document).ready(function () {
	// Sample Code for getting started
	var diameter = 960,
		format = d3.format(",d"),
		color = d3.scale.category20c();

	var bubble = d3.layout.pack()
		.sort(null)
		.size([diameter, diameter])
		.padding(1.5);

	var svg = d3.select(".container").append("svg")
		.attr("width", diameter)
		.attr("height", diameter)
		.attr("class", "bubble");

	d3.json("falre.json", function(error, root) {
	var node = svg.selectAll(".node")
		.data(bubble.nodes(classes(root))
		.filter(function(d) { return !d.children; }))
		.enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	  node.append("title")
		.text(function(d) { return d.className + ": " + format(d.value); });

	  node.append("circle")
		.attr("r", function(d) { return d.r; })
		.style("fill", function(d) { return color(d.packageName); });

	  node.append("text")
		.attr("dy", ".3em")
		.style("text-anchor", "middle")
		.text(function(d) { return d.className.substring(0, d.r / 3); });
	});
	
	// Returns a flattened hierarchy containing all leaf nodes under the root.
	function classes(root) {
	  var classes = [];

	  function recurse(name, node) {
		if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
		else classes.push({packageName: name, className: node.name, value: node.size});
	  }

	  recurse(null, root);
	  return {children: classes};
	}

	d3.select(self.frameElement).style("height", diameter + "px");

	// Sample Code - End
});
