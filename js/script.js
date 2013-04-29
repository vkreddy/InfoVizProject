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
	for(var i=0;i<2;i++){
		alert(data.movies[i].release_dates.theater)
	}
	
	return dateRating;
}

function getBoxOfficeData(movie_id) {
	var opening, gross, lastweekend;
	
	var imdbid = "tt" + movie_id;        
	
	$.ajax({
		url: "/scraper.php?imdbid=" + imdbid + " #tn15content",
		success: function(data){	
			var subset = data.match(/Budget(.|\n)*?Related/);
			var subsetnon = subset[0].replace(/(\r\n|\n|\r)/gm,"");
			//pull opening weekend data
			var openingM = subsetnon.match(/Opening Weekend.*?USA/);
			var opening1 = openingM[0].replace("Opening Weekend</h5>$","");
			var opening2 = opening1.replace(" (USA","");
			opening = opening2.replace(/\,/g,"");
			//pull gross data
			var grossM = subsetnon.match(/Gross.*?USA/);
			var gross1 = grossM[0].replace("Gross</h5>$","");
			var gross2 = gross1.replace(" (USA","");
			gross = gross2.replace(/\,/g,"");
			//pull last weekend
			var lastweekendM = subsetnon.match(/Weekend Gross.*?USA/);
			var lastweekend1 = lastweekendM[0].replace("Weekend Gross</h5>$","");
			var lastweekend2 = lastweekend1.replace(" (USA","");
			lastweekend = lastweekend2.replace(/\,/g,"");
			//console.log the important data. these are strings at the moment.
			//console.log(opening);
			//console.log(gross);
			//console.log(lastweekend);		  
		},
		async: false
	});    
	return { "opening": opening, "gross": gross, "lastweekend": lastweekend}
}

function getCombineData() {
	var data = getMoviesInTheaters();
	for(var i=0;i<data.movies.length;i++){		
		var val = getBoxOfficeData(data.movies[i].alternate_ids.imdb);		
		data.movies[i].boxoffice = val;
	}
	return data;
}

$(document).ready(function () {
	var data = getMoviesInTheaters();
	var yScale, yScale_reverse, xScale, yVar, xAxis, yAxis, y_domain, movie_body, option, body, yText, vis;
	//alert(data.total);
	
	w = 950;
    h = 500;
	pt = 20, pr = 20, pb = 50, pl = 50;
	picSize = 50, pic_p = picSize / 2;

	//alert(data.movies[0].release_dates.theater);
    var x_domain = d3.extent(data.movies, function(d) { return new Date(d.release_dates.theater); });
                       
    // display date format
    var date_format = d3.time.format("%d %b");

	xScale = d3.time.scale()
		.domain(x_domain)    
		.range([0, w]);   

	// define the x axis
	var xAxis = d3.svg.axis()
		.orient("bottom")
		.scale(xScale)
		.tickFormat(date_format);
		
	function getYVal(movie) {
		switch (option) {
				case "Critics Rating":
					return movie.ratings.critics_score; 
					break;
				case "Audience Rating":
					return movie.ratings.audience_score;
					break;
				case "Opening Weekend":
					return movie.boxoffice.opening;
					break;
				case "Gross":
					return movie.boxoffice.gross;
					break;
		}
	}
	update_scale = function() {			
		y_domain = d3.extent(data.movies, function(d) { 
			return getYVal(d)
		});
		
		// define the y scale  (vertical)
		yScale = d3.scale.linear()
			.domain(y_domain)    
			.range([0, h]);
		
		yScale_reverse = d3.scale.linear()
			.domain(y_domain.reverse())    
			.range([0, h]);
			
		yAxis = d3.svg.axis()
			.scale(yScale_reverse)
			.ticks(10).orient("left");
		
		switch (option) {
				case "Critics Rating":
					yText = "Critics Rating (Rotten Tomatoes)";
					break;
				case "Audience Rating":
					yText = "Audience Score (Rotten Tomatoes)"; 
					break;
				case "Opening Weekend":
					yText = "Opening Weekend ($)"; 
					break;
				case "Gross":
					yText = "Gross($)"; 
					break;
		}
			
	}
	draw_movies = function() {
      var movies;	
	  movies = movie_body.selectAll(".movie").data(data.movies, function(d) {
        return d.id;
      });     		
	  movies.enter().append("g").attr("class", "movie").on("mouseover", function(d, i) {
			return show_details(d, i, this);
		}).on("mouseout", hide_details)
			.append("svg:image")
				.attr("transform", "rotate(180)")
				.attr("xlink:href", function(d) { return d.posters.thumbnail; })
				.attr("width", picSize + "px")
				.attr("height", picSize + "px");
		
	  movies.transition().duration(1000).attr("transform", function(d) {						
			return "translate(" + (xScale(new Date(d.release_dates.theater)) + pic_p) + "," + (yScale(d.ratings.critics_score) + pic_p) + ")"
	  });
		
	  base_vis.transition().duration(1000).select(".y_axis").call(yAxis);      
	}
	redraw_movies= function() {
		movies = movie_body.selectAll(".movie").data(data.movies, function(d) {
			return d.id;
		});
				
		movies.transition().duration(1000).attr("transform", function(d) {	
			return "translate(" + (xScale(new Date(d.release_dates.theater)) + pic_p) + "," + (yScale(getYVal(d)) + pic_p) + ")"			
		});
	  
		base_vis.transition().duration(1000).select(".y_axis").call(yAxis);
		vis.select("text").text(yText);
	}
	show_details = function(movie_data, index, element) {
      var bBox, box, crosshairs_g, movies, msg, selected_movie, tooltipWidth, unselected_movies;
      movies = body.selectAll(".movie");
      bBox = element.getBBox();
      box = {
        "height": Math.round(bBox.height),
        "width": Math.round(bBox.width),
        "x": w + bBox.x,
        "y": h + bBox.y
      };
      box.x = Math.round(xScale(new Date(movie_data.release_dates.theater)) - (pr + 50) + 25);
      box.y = Math.round(yScale_reverse(getYVal(movie_data)) + pt - 30);
      tooltipWidth = parseInt(d3.select('#tooltip').style('width').split('px').join(''));
      msg = '<p class="title">' + movie_data.title + '</p>';
      msg += '<table>';
      msg += '<tr><td>Release Date:</td><td>' + date_format(new Date(movie_data.release_dates.theater)) + '</td></tr>';
      msg += '<tr><td>Score:</td><td>' + getYVal(movie_data) + ' </td></tr>';
      msg += '</table>';
      d3.select('#tooltip').classed('hidden', false);
      d3.select('#tooltip .content').html(msg);
	  d3.select('#tooltip').style('left', "" + ((box.x + (tooltipWidth / 2)) - box.width / 2) + "px").style('top', "" + box.y + "px");
	  //d3.select('#tooltip').style('left', "" + box.x + "px").style('top', "" + box.y + "px");
      selected_movie = d3.select(element);
      selected_movie.attr("opacity", 1.0);
      unselected_movies = movies.filter(function(d) {
        return d.id !== movie_data.id;
      }).selectAll("image").attr("opacity", 0.3);
      crosshairs_g = body.insert("g", "#movies").attr("id", "crosshairs");
      crosshairs_g.append("line").attr("class", "crosshair").attr("x1", 0 + 3).attr("x2", xScale(new Date(movie_data.release_dates.theater))).attr("y1", yScale(getYVal(movie_data))).attr("y2", yScale(getYVal(movie_data))).attr("stroke-width", 1);
      return crosshairs_g.append("line").attr("class", "crosshair").attr("x1", xScale(new Date(movie_data.release_dates.theater))).attr("x2", xScale(new Date(movie_data.release_dates.theater))).attr("y1", 0 + 3).attr("y2", yScale(getYVal(movie_data))).attr("stroke-width", 1);
    };
	hide_details = function(movie_data) {
      var movies;
      d3.select('#tooltip').classed('hidden', true);
      movies = body.selectAll(".movie").selectAll("image").attr("opacity", 0.85);
      return body.select("#crosshairs").remove();
    };
	render_vis = function() {      
      base_vis = d3.select(".vis").append("svg").attr("width", w + (pl + pr)).attr("height", h + (pt + pb)).attr("id", "vis-svg");
      base_vis.append("g").attr("class", "x_axis").attr("transform", "translate(" + pl + "," + (h + pt) + ")").call(xAxis);
      base_vis.append("text").attr("x", w / 2).attr("y", h + (pt + pb) - 10).attr("text-anchor", "middle").attr("class", "axisTitle").attr("transform", "translate(" + pl + ",0)").text("Release Date");
      base_vis.append("g").attr("class", "y_axis").attr("transform", "translate(" + pl + "," + pt + ")").call(yAxis);
      vis = base_vis.append("g").attr("transform", "translate(" + 0 + "," + (h + (pt + pb)) + ")scale(1,-1)");
      vis.append("text").attr("x", h / 2).attr("y", 20).attr("text-anchor", "middle").attr("class", "axisTitle").attr("transform", "rotate(270)scale(-1,1)translate(" + pb + "," + 0 + ")").text(yText);
      body = vis.append("g").attr("transform", "translate(" + pl + "," + pb + ")").attr("id", "vis-body");
      movie_body = body.append("g").attr("id", "movies");
      draw_movies();            
    };
	
	$("#rating_choice .dropdown-menu li a").click(function(){
		$("#rating_choice .dropdown-toggle:first-child").text($(this).text());
		$("#rating_choice .dropdown-toggle:first-child").val($(this).text());	  	  		
		option = $(this).text();				
		update_scale();
		redraw_movies();
	});
		
	option = "Critics Rating";
	$("#rating_choice .dropdown-toggle:first-child").text(option);
	$("#rating_choice .dropdown-toggle:first-child").val(option);
	update_scale();
	render_vis();
});

