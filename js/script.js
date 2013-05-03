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
	var yScale, yScale_reverse, xScale, yVar, xAxis, yAxis, y_domain, movie_body, option, body, yText, vis, fStartDate, fEndDate;
	//alert(data.total);
	
	w = 908;
    h = 480;
	pt = 20, pr = 20, pb = 50, pl = 50;
	picSize = 50, pic_p = picSize / 2;
	
	fStartDate = new Date(2013, 3, 1);
	fEndDate = new Date(2013, 4, 30);

	// for cross filter functionality
	var movie = crossfilter(data.movies),
		all = movie.groupAll(),
		date = movie.dimension(function(d) { return new Date(d.release_dates.theater); }),
		dates = date.group();
		
	//alert(data.movies[0].release_dates.theater);
    var x_domain = d3.extent(data.movies, function(d) { return new Date(d.release_dates.theater); });
	
	var charts = [
		barChart()
			.dimension(date)
			.group(dates)
			.round(d3.time.day.round)
		  .x(d3.time.scale()
			.domain(x_domain)
			.rangeRound([0, 10 * 90]))
			.filter([fStartDate, fEndDate])
	];
                     
    // display date format
    var date_format = d3.time.format("%b %d");

	xScale = d3.time.scale()
		.domain([new Date(date.bottom(1)[0].release_dates.theater), new Date(date.top(1)[0].release_dates.theater)])    
		.range([0, w]);   

	// define the x axis
	var xAxis = d3.svg.axis()
		.orient("bottom")
		.scale(xScale)
		.ticks(10)
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
	update_yaxis = function() {			
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
	  //base_vis.append("g").attr("transform", "translate(" + pl + "," + pt + ")").call(d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([1, 8]).on("zoom", zoom));
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
		update_yaxis();
		redraw_movies();
	});

	var chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderEnd); });
	  
	renderAll();
	
	// Renders the specified chart or list.
	function render(method) {
		d3.select(this).call(method);
	}
	
	// Whenever the brush moves, re-rendering everything.
	function renderAll() {
		chart.each(render);
	}
	
	function renderEnd() {	
		update_xaxis();		
		redraw_movies();
	}
	
	function update_xaxis() {
		xScale = d3.time.scale()
			.domain([new Date(date.bottom(1)[0].release_dates.theater), new Date(date.top(1)[0].release_dates.theater)])    
			.range([0, w]); 
			
		xAxis = d3.svg.axis()
			.orient("bottom")
			.scale(xScale)
			.ticks(10)
			.tickFormat(date_format);
			
		base_vis.transition().duration(1000).select(".x_axis").call(xAxis);
	}
	
	window.filter = function(filters) {
		filters.forEach(function(d, i) { charts[i].filter(d); });
		renderAll();
	};

	window.reset = function(i) {
		charts[i].filter(null);
		renderAll();
	};
	
	function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([100, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round;

    function chart(div) {
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");

          g = div.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      dimension.filterRange(extent);
    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }
  
  option = "Critics Rating";
	$("#rating_choice .dropdown-toggle:first-child").text(option);
	$("#rating_choice .dropdown-toggle:first-child").val(option);	
	update_yaxis();
	render_vis();

});

