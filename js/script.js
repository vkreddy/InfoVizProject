function getMoviesInTheaters() {
	// send off the query
	var movieData = [];
	$.ajax({
		url: "/php/in_theaters.php",
		dataType: "json",
		success: function(data){			
			/* for(var i=0;i<10;i++){
				alert(data.movies[i].release_dates.theater)
			}
			alert(data.total); */
			movieData = data;
		},
		async: false
	})
	
	return movieData
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

function getDateAndRatings(data) {
	var dateRating = {}
	for(var i=0;i<10;i++){
		alert(data.movies[i].release_dates.theater)
	}
	
	return dateRating;
}

$(document).ready(function () {
	var data = getMoviesInTheaters()
	var yScale, xScale, yVar, movie_body;
	//alert(data.total);
	
	w = 860;
    h = 450;
    key_h = 150;
    key_w = 400;
    _ref = [10, 10, 10, 15], key_pt = _ref[0], key_pr = _ref[1], key_pb = _ref[2], key_pl = _ref[3];
    _ref2 = [20, 20, 50, 60], pt = _ref2[0], pr = _ref2[1], pb = _ref2[2], pl = _ref2[3];
	
	var width = 950,
        height = 500,
        padding = 60;                            	
	
//	alert(data.movies[0].release_dates.theater);
    var x_domain = d3.extent(data.movies, function(d) { return new Date(d.release_dates.theater); });
                       
    // display date format
    var date_format = d3.time.format("%d %b");
	
	// create an svg container
	/*var vis = d3.select(".hero-unit")
		.append("svg:svg")
		.attr("width", width)
		.attr("height", height);*/

	xScale = d3.time.scale()
		.domain(x_domain)    
		.range([padding, width - padding * 2]);   

	// define the x axis
	var xAxis = d3.svg.axis()
		.orient("bottom")
		.scale(xScale)
		.tickFormat(date_format);
		
	var y_domain = d3.extent(data.movies, function(d) { return d.ratings.critics_score; });
		
	// define the y scale  (vertical)
	yScale = d3.scale.linear()
			.domain(y_domain)    
			.range([height - padding, padding]);
			
	var yAxis = d3.svg.axis()
			.orient("left")
			.scale(yScale)
			.ticks(10).orient("left");
	// draw x axis with labels and move to the bottom of the chart area
	/*vis.append("g")
		.attr("class", "xaxis")   
		.attr("transform", "translate(0," + (height - padding) + ")")
		.call(xAxis);*/
	

	draw_movies = function() {
      var movies;
	
	  movies = movie_body.selectAll(".movie").data(data.movies, function(d) {
        return d.id;
      });
      	  
	   movies.enter().append("g").attr("class", "movie")
			.append("svg:image")
				.attr("class", "movie")
				.attr("xlink:href", function(d) { return d.posters.thumbnail; })
				.attr("x", function(d) { return xScale(new Date(d.release_dates.theater)); })
				.attr("y", function(d) { return yScale(d.ratings.critics_score); })
				.attr("width", "50px")
				.attr("height", "50px");
		
		movies.transition().duration(1000).attr("transform", function(d) {
			return "translate(" + (xScale(d.release_dates.theater)) + "," + (yScale(d.ratings.critics_score)) + ")";
		});
		
		movies.exit().transition().duration(1000).attr("transform", function(d) {
			return "translate(" + 0 + "," + 0 + ")";
		}).remove();
      return movies.exit().selectAll("circle").transition().duration(1000).attr("r", 0);
	}
	render_vis = function() {      
      base_vis = d3.select(".hero-unit").append("svg").attr("width", w + (pl + pr)).attr("height", h + (pt + pb)).attr("id", "vis-svg");
      base_vis.append("g").attr("class", "x_axis").attr("transform", "translate(" + 0 + "," + (h + pt) + ")").call(xAxis);
      base_vis.append("text").attr("x", w / 2).attr("y", h + (pt + pb) - 10).attr("text-anchor", "middle").attr("class", "axisTitle").attr("transform", "translate(" + pl + ",0)").text("Profit ($ mil)");
      base_vis.append("g").attr("class", "y_axis").attr("transform", "translate(" + pl + "," + pt + ")").call(yAxis);
      vis = base_vis.append("g").attr("transform", "translate(" + 0 + "," + (h + (pt + pb)) + ")scale(1,-1)");
      vis.append("text").attr("x", h / 2).attr("y", 20).attr("text-anchor", "middle").attr("class", "axisTitle").attr("transform", "rotate(270)scale(-1,1)translate(" + pb + "," + 0 + ")").text("Rating (Rotten Tomatoes %)");
      body = base_vis.append("g").attr("transform", "translate(" + pl + "," + pb + ")").attr("id", "vis-body");
      //zero_line = body.append("line").attr("x1", xScale(0)).attr("x2", xScale(0)).attr("y1", 0 + 5).attr("y2", h - 5).attr("stroke", "#aaa").attr("stroke-width", 1).attr("stroke-dasharray", "2");
      //middle_line = body.append("line").attr("x1", 0 + 5).attr("x2", w + 5).attr("y1", yScale(50.0)).attr("y2", yScale(50.0)).attr("stroke", "#aaa").attr("stroke-width", 1).attr("stroke-dasharray", "2");
      movie_body = body.append("g").attr("id", "movies");
      draw_movies();            
    };
	
	$("#rating_choice .dropdown-menu li a").click(function(){
      $("#rating_choice .dropdown-toggle:first-child").text($(this).text());
      $("#rating_choice .dropdown-toggle:first-child").val($(this).text());
	  	  
	  update_vis($(this).text());
	});
	
	$("#boxoffice_choice .dropdown-menu li a").click(function(){
      $("#boxoffice_choice .dropdown-toggle:first-child").text($(this).text());
      $("#boxoffice_choice .dropdown-toggle:first-child").val($(this).text());
   });
   
   render_vis();
});

